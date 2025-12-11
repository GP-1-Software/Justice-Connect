// ============================================
// Court Clerk Middleware - Authorization & Validation
// ============================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Middleware to verify if the user is a Court Clerk
 */
export const verifyCourtClerk = async (req, res, next) => {
    try {
        // Try to get user from Authorization header
        const authHeader = req.headers.authorization;
        let userData = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            // Try to parse as JSON (user data sent directly)
            try {
                userData = JSON.parse(atob(token));
            } catch {
                // Try to parse as base64 encoded JSON
                try {
                    userData = JSON.parse(Buffer.from(token, 'base64').toString());
                } catch {
                    // Token might be the user_id directly or another format
                    userData = null;
                }
            }
        }

        // Also check x-user-data header (can be JSON string or Base64 encoded)
        if (!userData && req.headers['x-user-data']) {
            try {
                // Try parsing as JSON directly first
                userData = JSON.parse(req.headers['x-user-data']);
            } catch {
                // If that fails, try base64 decoding
                try {
                    const decoded = Buffer.from(req.headers['x-user-data'], 'base64').toString('utf-8');
                    userData = JSON.parse(decoded);
                } catch {
                    userData = null;
                }
            }
        }

        const userId = userData?.user_id || req.body.clerk_id || req.query.clerk_id;
        const idNumber = userData?.id_number;

        if (!userId && !idNumber) {
            return res.status(401).json({ error: "Unauthorized: No user credentials provided" });
        }

        // Check if user has court_clerk role in user_roles table
        let roleQuery = supabase.from("user_roles").select("role");

        if (idNumber) {
            roleQuery = roleQuery.eq("id_number", idNumber);
        } else if (userId) {
            // Get id_number from users table first
            const { data: userIdData } = await supabase
                .from("users")
                .select("id_number")
                .eq("user_id", userId)
                .single();

            if (userIdData?.id_number) {
                roleQuery = roleQuery.eq("id_number", userIdData.id_number);
            }
        }

        roleQuery = roleQuery.eq("role", "court_clerk");

        const { data: roleData, error: roleError } = await roleQuery.single();

        if (roleError || !roleData) {
            return res.status(403).json({
                error: "Forbidden: User is not a Court Clerk",
                details: roleError?.message
            });
        }

        // Attach clerk info to request
        req.clerk = {
            user_id: userId,
            id_number: idNumber,
            ...userData
        };

        next();
    } catch (error) {
        console.error("Court Clerk verification error:", error);
        res.status(500).json({ error: "Authentication error", details: error.message });
    }
};

/**
 * Validate filing submission data
 */
export const validateFilingSubmission = (req, res, next) => {
    const {
        case_id,
        court_name,
        city,
        case_type,
        plaintiff_name,
        defendant_name,
        filing_summary,
        legal_requests
    } = req.body;

    const errors = [];

    if (!case_id) errors.push("case_id is required");
    if (!court_name || court_name.trim() === "") errors.push("court_name is required");
    if (!city || city.trim() === "") errors.push("city is required");
    if (!case_type || case_type.trim() === "") errors.push("case_type is required");
    if (!plaintiff_name || plaintiff_name.trim() === "") errors.push("plaintiff_name is required");
    if (!defendant_name || defendant_name.trim() === "") errors.push("defendant_name is required");
    if (!filing_summary || filing_summary.trim() === "") errors.push("filing_summary is required");
    if (!legal_requests || legal_requests.trim() === "") errors.push("legal_requests is required");

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors
        });
    }

    next();
};

/**
 * Validate review action data
 */
export const validateReviewAction = (req, res, next) => {
    const { filing_id, review_action } = req.body;

    const errors = [];
    const validActions = ['accepted', 'rejected', 'requested_update', 'requested_documents'];

    if (!filing_id) errors.push("filing_id is required");
    if (!review_action) {
        errors.push("review_action is required");
    } else if (!validActions.includes(review_action)) {
        errors.push(`review_action must be one of: ${validActions.join(', ')}`);
    }

    // Additional validation based on action
    if (review_action === 'rejected' && !req.body.rejection_reason) {
        errors.push("rejection_reason is required when rejecting");
    }

    if (review_action === 'requested_update' && !req.body.requested_changes) {
        errors.push("requested_changes is required when requesting update");
    }

    if (review_action === 'requested_documents' && !req.body.requested_documents) {
        errors.push("requested_documents is required when requesting documents");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors
        });
    }

    next();
};

/**
 * Validate case registration data
 */
export const validateCaseRegistration = (req, res, next) => {
    const {
        registry_number,
        official_case_number,
        registration_date,
        court_fees
    } = req.body;

    // filing_id comes from URL params, not body
    const filing_id = req.params.filing_id;

    const errors = [];

    if (!filing_id) errors.push("filing_id is required");
    if (!registry_number || registry_number.trim() === "") errors.push("registry_number is required");
    if (!official_case_number || official_case_number.trim() === "") errors.push("official_case_number is required");
    if (!registration_date) errors.push("registration_date is required");
    if (court_fees !== undefined && court_fees !== '' && (isNaN(court_fees) || Number(court_fees) < 0)) {
        errors.push("court_fees must be a positive number");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors
        });
    }

    next();
};

/**
 * Validate service of process data
 */
export const validateServiceOfProcess = (req, res, next) => {
    const {
        case_id,
        service_method,
        defendant_name,
        attempt_date,
        attempt_result
    } = req.body;

    const errors = [];
    const validMethods = ['bailiff', 'mail', 'publication', 'electronic'];
    const validResults = ['served', 'not_served', 'refused', 'pending'];

    if (!case_id) errors.push("case_id is required");
    if (!service_method) {
        errors.push("service_method is required");
    } else if (!validMethods.includes(service_method)) {
        errors.push(`service_method must be one of: ${validMethods.join(', ')}`);
    }

    if (!defendant_name || defendant_name.trim() === "") errors.push("defendant_name is required");
    if (!attempt_date) errors.push("attempt_date is required");
    if (!attempt_result) {
        errors.push("attempt_result is required");
    } else if (!validResults.includes(attempt_result)) {
        errors.push(`attempt_result must be one of: ${validResults.join(', ')}`);
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors
        });
    }

    next();
};

/**
 * Validate hearing scheduling data
 */
export const validateHearingSchedule = (req, res, next) => {
    const {
        hearing_type,
        hearing_date,
        hearing_time
    } = req.body;

    // case_id comes from URL params
    const case_id = req.params.case_id;

    const errors = [];
    const validTypes = ['first_hearing', 'continuation', 'evidence', 'witness', 'final_hearing'];

    if (!case_id) errors.push("case_id is required");
    if (!hearing_type) {
        errors.push("hearing_type is required");
    } else if (!validTypes.includes(hearing_type)) {
        errors.push(`hearing_type must be one of: ${validTypes.join(', ')}`);
    }

    if (!hearing_date) errors.push("hearing_date is required");
    if (!hearing_time) errors.push("hearing_time is required");

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors
        });
    }

    next();
};

/**
 * Validate decision/judgment data
 */
export const validateDecision = (req, res, next) => {
    const {
        decision_type,
        decision_title,
        decision_summary,
        decision_date
    } = req.body;

    // case_id comes from URL params
    const case_id = req.params.case_id;

    const errors = [];
    const validTypes = ['preliminary', 'interlocutory', 'final_judgment', 'court_order'];

    if (!case_id) errors.push("case_id is required");
    if (!decision_type) {
        errors.push("decision_type is required");
    } else if (!validTypes.includes(decision_type)) {
        errors.push(`decision_type must be one of: ${validTypes.join(', ')}`);
    }

    if (!decision_title || decision_title.trim() === "") errors.push("decision_title is required");
    if (!decision_summary || decision_summary.trim() === "") errors.push("decision_summary is required");
    if (!decision_date) errors.push("decision_date is required");

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors
        });
    }

    next();
};

/**
 * Log clerk action to database
 */
export const logClerkAction = async (clerkId, actionType, actionDescription, actionDetails = {}) => {
    try {
        const { error } = await supabase
            .from("clerk_actions_log")
            .insert({
                performed_by: clerkId,
                action_type: actionType,
                action_description: actionDescription,
                action_details: actionDetails,
                case_id: actionDetails.case_id || null,
                filing_id: actionDetails.filing_id || null
            });

        if (error) {
            console.error("Error logging clerk action:", error);
        }
    } catch (error) {
        console.error("Error in logClerkAction:", error);
    }
};

/**
 * Update case stage and log history
 */
export const updateCaseStage = async (caseId, newStage, clerkId, reason = null) => {
    try {
        // Get current stage
        const { data: currentCase, error: fetchError } = await supabase
            .from("cases")
            .select("case_stage")
            .eq("case_id", caseId)
            .single();

        if (fetchError) {
            console.error("Error fetching current stage:", fetchError);
            return { success: false, error: fetchError };
        }

        const previousStage = currentCase?.case_stage;

        // Update case stage
        const { error: updateError } = await supabase
            .from("cases")
            .update({ case_stage: newStage, updated_at: new Date() })
            .eq("case_id", caseId);

        if (updateError) {
            console.error("Error updating case stage:", updateError);
            return { success: false, error: updateError };
        }

        // Log stage change in history
        const { error: historyError } = await supabase
            .from("case_stages_history")
            .insert({
                case_id: caseId,
                previous_stage: previousStage,
                new_stage: newStage,
                stage_reason: reason,
                changed_by: clerkId,
                changed_by_type: 'court_clerk'
            });

        if (historyError) {
            console.error("Error logging stage history:", historyError);
        }

        return { success: true, previousStage, newStage };

    } catch (error) {
        console.error("Error in updateCaseStage:", error);
        return { success: false, error };
    }
};
