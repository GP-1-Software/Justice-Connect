import express from "express";
import { createClient } from "@supabase/supabase-js";
import { sendLoginNotification, sendSignupNotificationToAdmins } from '../services/emailService.js';

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
        let { data: roles, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("id_number", cleanIdNumber);

        if (rolesError) {
            console.error("Error fetching roles:", rolesError);
            return res.status(500).json({ error: "Database error" });
        }

        // Fallback: If not found in user_roles, check individual tables directly
        if (!roles || roles.length === 0) {
            // Check users table (clients)
            const { data: clientData } = await supabase
                .from("users")
                .select("*")
                .eq("id_number", cleanIdNumber)
                .single();

            if (clientData) {
                roles = [{ role: 'client' }];
            }

            // Check lawyers table
            if (!roles || roles.length === 0) {
                const { data: lawyerData } = await supabase
                    .from("lawyers")
                    .select("*")
                    .eq("id_number", cleanIdNumber)
                    .single();

                if (lawyerData) {
                    roles = [{ role: 'lawyer' }];
                }
            }

            // Check admins table
            if (!roles || roles.length === 0) {
                const { data: adminData } = await supabase
                    .from("admins")
                    .select("*")
                    .eq("id_number", cleanIdNumber)
                    .single();

                if (adminData) {
                    roles = [{ role: adminData.role || 'admin' }];
                }
            }
        }

        if (!roles || roles.length === 0) {
            return res.status(401).json({ error: "المستخدم غير موجود" });
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
            return res.status(401).json({ error: "رقم الهوية أو كلمة المرور غير صحيحة" });
        }

        // 3. Check account status
        if (user.account_status === 'banned') {
            return res.status(403).json({
                error: "تم تعليق حسابك. للاستفسار يرجى التواصل مع الدعم الفني:\nالبريد الإلكتروني: ali.odeh.pss@gmail.com \nالهاتف: 0592891676-972+",
                banned: true,
                ban_reason: user.ban_reason || null
            });
        }

        // 3.1 Check if user is pending approval
        if (user.account_status === 'pending') {
            return res.status(403).json({
                error: "حسابك قيد المراجعة من قبل الإدارة. سيتم إشعارك عند الموافقة على حسابك. شكراً لصبرك!",
                pending: true
            });
        }

        // 3.2 Check if user is rejected
        if (user.account_status === 'rejected') {
            return res.status(403).json({
                error: "تم رفض طلب تسجيلك. للاستفسار يرجى التواصل مع الدعم الفني:\nالبريد الإلكتروني: ali.odeh.pss@gmail.com \nالهاتف: 0592891676-972+",
                rejected: true,
                rejection_reason: user.rejection_reason || null
            });
        }

        // 4. Return success with available roles
        // For admins, use the actual role from admins table (could be 'admin' or 'super_admin')
        const actualRole = (validRole === 'admin' && user.role) ? user.role : validRole;

        // Note: Email notification is sent from frontend after role selection

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

// Send Login Email Notification (called after role selection)
router.post("/send-login-email", async (req, res) => {
    try {
        const { user, role } = req.body;

        if (!user || !role) {
            return res.status(400).json({ error: "Missing user or role" });
        }

        // Send login notification email
        sendLoginNotification(user, role).catch(err => {
            console.error('Failed to send login email:', err);
        });

        res.json({ success: true, message: "Email notification triggered" });

    } catch (error) {
        console.error("Send login email error:", error);
        res.status(500).json({ error: error.message });
    }
});


// Send Signup Notification to Admins (called after successful signup)
router.post("/send-signup-notification", async (req, res) => {
    try {
        const { user, userType } = req.body;

        if (!user) {
            return res.status(400).json({ error: "Missing user data" });
        }

        // Send signup notification to admins (admin_id 1 and 4)
        sendSignupNotificationToAdmins(user, userType || 'client').catch(err => {
            console.error('Failed to send signup notification to admins:', err);
        });

        res.json({ success: true, message: "Signup notification triggered" });

    } catch (error) {
        console.error("Send signup notification error:", error);
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
