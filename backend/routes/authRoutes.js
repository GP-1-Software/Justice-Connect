import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Login Endpoint
router.post("/login", async (req, res) => {
    try {
        const { id_number, password } = req.body;

        if (!id_number || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const cleanIdNumber = id_number.replace(/[\s-]/g, '');

        // 1. Check user_roles to see what roles exist
        const { data: roles, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("id_number", cleanIdNumber);

        if (rolesError) {
            console.error("Error fetching roles:", rolesError);
            return res.status(500).json({ error: "Database error" });
        }

        if (!roles || roles.length === 0) {
            // Fallback: Check individual tables if migration hasn't run or for legacy support
            // But for now, let's assume migration ran. 
            // If not found in user_roles, maybe return 401.
            return res.status(401).json({ error: "User not found" });
        }

        // 2. Verify password
        // Check against the first available role's table
        let user = null;
        let validRole = null;

        for (const r of roles) {
            let table = 'users';
            if (r.role === 'lawyer') table = 'lawyers';
            if (r.role === 'admin' || r.role === 'super_admin') table = 'admins';

            const { data, error } = await supabase
                .from(table)
                .select("*")
                .eq("id_number", cleanIdNumber)
                .eq("password_hash", password)
                .single();

            if (data && !error) {
                user = data;
                validRole = r.role;
                break;
            }
        }

        if (!user) {
            return res.status(401).json({ error: "Invalid password" });
        }

        // 3. Check if user is banned
        if (user.account_status === 'banned') {
            return res.status(403).json({
                error: "تم تعليق حسابك. للاستفسار يرجى التواصل مع الدعم الفني:\nالبريد الإلكتروني: ali.odeh.pss@gmail.com \nالهاتف: 0592891676-972+",
                banned: true,
                ban_reason: user.ban_reason || null
            });
        }

        // 4. Return success with available roles
        // For admins, use the actual role from admins table (could be 'admin' or 'super_admin')
        const actualRole = (validRole === 'admin' && user.role) ? user.role : validRole;

        res.json({
            success: true,
            roles: roles.map(r => r.role),
            user: {
                ...user,
                user_type: validRole, // The role that matched credentials
                role: actualRole // Actual role (super_admin or admin)
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Assign Role Endpoint (Admin only)
router.post("/assign-role", async (req, res) => {
    try {
        const { target_id_number, new_role } = req.body;

        if (!target_id_number || !new_role) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const cleanIdNumber = target_id_number.replace(/[\s-]/g, '');

        // Check if role already exists
        const { data: existingRole } = await supabase
            .from("user_roles")
            .select("*")
            .eq("id_number", cleanIdNumber)
            .eq("role", new_role)
            .single();

        if (existingRole) {
            return res.status(400).json({ error: "User already has this role" });
        }

        // Get existing user data to copy
        const { data: existingRoles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("id_number", cleanIdNumber);

        if (!existingRoles || existingRoles.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const sourceRole = existingRoles[0].role;
        let sourceTable = 'users';
        if (sourceRole === 'lawyer') sourceTable = 'lawyers';
        if (sourceRole === 'admin' || sourceRole === 'super_admin') sourceTable = 'admins';

        const { data: sourceUser } = await supabase
            .from(sourceTable)
            .select("*")
            .eq("id_number", cleanIdNumber)
            .single();

        if (!sourceUser) {
            return res.status(500).json({ error: "Source user data not found" });
        }

        // Insert into new role table
        let targetTable = 'users';
        if (new_role === 'lawyer') targetTable = 'lawyers';
        if (new_role === 'admin' || new_role === 'super_admin') targetTable = 'admins';

        const commonData = {
            id_number: sourceUser.id_number,
            first_name: sourceUser.first_name,
            last_name: sourceUser.last_name,
            email: sourceUser.email,
            phone: sourceUser.phone,
            city: sourceUser.city,
            password_hash: sourceUser.password_hash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (new_role === 'lawyer') {
            commonData.user_type = 'lawyer';
            commonData.account_status = 'approved';
        } else if (new_role === 'client') {
            commonData.user_type = 'client';
            commonData.account_status = 'approved';
        } else if (new_role === 'admin' || new_role === 'super_admin') {
            commonData.role = new_role;
        }

        const { error: insertError } = await supabase
            .from(targetTable)
            .insert(commonData);

        if (insertError) {
            console.error("Error creating new role profile:", insertError);
            return res.status(500).json({ error: "Failed to create profile for new role: " + insertError.message });
        }

        // Add to user_roles
        const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
                id_number: cleanIdNumber,
                role: new_role
            });

        if (roleError) {
            return res.status(500).json({ error: "Failed to update user_roles" });
        }

        res.json({ success: true, message: "Role assigned successfully" });

    } catch (error) {
        console.error("Assign role error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint to check triggers and schema
router.get("/debug-triggers", async (req, res) => {
    try {
        // Check triggers on users table
        const { data: triggers, error: triggerError } = await supabase
            .rpc('exec_sql', { sql_query: "SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'users'" });

        // Check columns of user_roles table
        const { data: columns, error: columnError } = await supabase
            .rpc('exec_sql', { sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_roles'" });

        res.json({
            triggers: triggers || triggerError,
            columns: columns || columnError
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
