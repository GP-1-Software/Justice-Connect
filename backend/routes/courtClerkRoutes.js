// ============================================
// Court Clerk Routes - API Endpoints
// ============================================

import express from "express";
import { createClient } from "@supabase/supabase-js";
import {
    verifyCourtClerk,
    validateFilingSubmission,
    validateReviewAction,
    validateCaseRegistration,
    validateServiceOfProcess,
    validateHearingSchedule,
    validateDecision,
    logClerkAction,
    updateCaseStage
} from "../middleware/courtClerkMiddleware.js";
import {
    createNotification,
    NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITY
} from "../services/notificationService.js";

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// 1. DASHBOARD & STATISTICS
// ============================================

/**
 * GET /api/court-clerk/dashboard
 * Get dashboard statistics for court clerk
 */
router.get("/dashboard", verifyCourtClerk, async (req, res) => {
    try {
        // Use the pre-built view
        const { data: stats, error } = await supabase
            .from("clerk_dashboard_stats")
            .select("*")
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            error: "Failed to fetch dashboard statistics",
            details: error.message
        });
    }
});

// ============================================
// 2. INBOX - استقبال اللوائح
// ============================================

/**
 * POST /api/court-clerk/filings/submit
 * Submit a new filing from lawyer
 * Creates a Case automatically and links it to the filing
 */
router.post("/filings/submit", async (req, res) => {
    try {
        const {
            lawyerId,
            clientId = null,
            caseId = null, // NEW: If provided, link to existing case instead of creating new
            selectedCourt,
            city,
            courtType,
            filingType,
            caseType,
            claimValue,
            relationship,
            caseSubject,
            legalRequests,
            plaintiffName,
            plaintiffId,
            plaintiffNationality,
            plaintiffCapacity,
            plaintiffRepresentative,
            plaintiffAddress,
            plaintiffPhone,
            plaintiffEmail,
            emailNotifications,
            defendantType,
            defendantName,
            defendantIdOrReg,
            defendantAddress,
            attachments = []
        } = req.body;

        // Generate filing number and case number
        const timestamp = Date.now();
        const filingNumber = `FILING-${timestamp}`;
        const caseNumber = `CASE-${timestamp}`;

        // Find client by id_number (plaintiff's ID)
        let foundClientId = clientId;
        if (!foundClientId && plaintiffId) {
            const { data: clientData } = await supabase
                .from("users")
                .select("user_id")
                .eq("id_number", plaintiffId)
                .single();

            if (clientData) {
                foundClientId = clientData.user_id;
                console.log(`Found client with id_number ${plaintiffId}: user_id = ${foundClientId}`);
            }
        }

        let targetCase;

        // Check if we're linking to an existing case or creating new
        if (caseId) {
            // EXISTING CASE: Update the case to link it to court system
            console.log(`Linking filing to existing case: ${caseId}`);

            const { data: existingCase, error: fetchError } = await supabase
                .from("cases")
                .select("*")
                .eq("case_id", caseId)
                .single();

            if (fetchError || !existingCase) {
                throw new Error("القضية غير موجودة");
            }

            // Update the existing case with court information
            const { data: updatedCase, error: updateError } = await supabase
                .from("cases")
                .update({
                    court_name: selectedCourt,
                    case_stage: 'submitted', // Start the court stages
                    updated_at: new Date()
                })
                .eq("case_id", caseId)
                .select()
                .single();

            if (updateError) {
                console.error("Case update error:", updateError);
                throw new Error("فشل في تحديث القضية");
            }

            targetCase = updatedCase;
            console.log(`Updated existing case ${caseId} to case_stage: submitted`);

        } else {
            // NEW CASE: Create a new case
            const { data: newCase, error: caseError } = await supabase
                .from("cases")
                .insert({
                    assigned_lawyer_id: lawyerId,
                    client_id: foundClientId,
                    title: caseSubject || `دعوى ${caseType}`,
                    case_type: caseType,
                    description: legalRequests,
                    status: 'pending',
                    priority: 'normal',
                    court_name: selectedCourt,
                    case_number: caseNumber,
                    client_id_number: plaintiffId,
                    case_stage: 'submitted'
                })
                .select()
                .single();

            if (caseError) {
                console.error("Case creation error:", caseError);
                throw new Error("فشل في إنشاء القضية");
            }

            targetCase = newCase;
        }

        // 2. Insert filing with case_id
        const { data: filing, error: filingError } = await supabase
            .from("court_clerk_filings")
            .insert({
                filing_number: filingNumber,
                lawyer_id: lawyerId,
                case_id: targetCase.case_id, // Link to the case (new or existing)
                client_id: clientId,
                court_name: selectedCourt,
                city: city,
                case_type: caseType,
                plaintiff_name: plaintiffName,
                defendant_name: defendantName,
                plaintiff_id_number: plaintiffId,
                defendant_id_number: defendantIdOrReg,
                filing_summary: caseSubject,
                legal_requests: legalRequests,
                jurisdiction_info: `${city} - ${courtType}`,
                filing_status: 'submitted',
                submitted_at: new Date()
            })
            .select()
            .single();

        if (filingError) throw filingError;

        // 3. Add Timeline Event for the case
        try {
            await supabase.from("timeline_events").insert({
                case_id: targetCase.case_id,
                event_type: 'filing_submitted',
                title: caseId ? 'تم تقديم الدعوى رسمياً' : 'تم تقديم لائحة الدعوى',
                description: caseId
                    ? `تم تقديم القضية رسمياً إلى ${selectedCourt} - رقم اللائحة: ${filingNumber}`
                    : `تم تقديم لائحة الدعوى إلى ${selectedCourt} - رقم اللائحة: ${filingNumber}`,
                created_by_id: lawyerId,
                created_by_type: 'lawyer'
            });
        } catch (timelineError) {
            console.error("Timeline error (non-blocking):", timelineError);
        }

        // 4. Insert attachments if any
        if (attachments && attachments.length > 0) {
            const attachmentRecords = attachments.map(att => ({
                filing_id: filing.filing_id,
                file_name: att.originalName,
                file_url: att.publicUrl || '',
                file_type: att.fileType || 'application/octet-stream',
                file_size: att.fileSize || 0,
                attachment_type: 'filing_document',
                uploaded_by: lawyerId,
                uploaded_by_type: 'lawyer'
            }));

            const { error: attachError } = await supabase
                .from("filing_attachments")
                .insert(attachmentRecords);

            if (attachError) console.error("Attachment error:", attachError);
        }

        // 5. Send notification to court clerk
        try {
            const { data: clerks } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", "court_clerk")
                .limit(1);

            if (clerks && clerks.length > 0) {
                await createNotification({
                    userId: clerks[0].user_id,
                    userType: 'court_clerk',
                    title: 'لائحة جديدة تنتظر المراجعة',
                    message: `تم تقديم لائحة جديدة برقم ${filingNumber}`,
                    type: NOTIFICATION_TYPES.FILING_RECEIVED,
                    relatedId: null, // UUID - stored in actionUrl instead
                    relatedType: 'filing',
                    priority: NOTIFICATION_PRIORITY.NORMAL,
                    actionUrl: `/court-clerk/filings/${filing.filing_id}`
                });
            }
        } catch (notifError) {
            console.error("Notification error (non-blocking):", notifError);
        }

        // 6. Send notification to lawyer
        try {
            await createNotification({
                userId: lawyerId,
                userType: 'lawyer',
                title: 'تم تقديم الدعوى بنجاح',
                message: `تم تقديم لائحة الدعوى برقم ${filingNumber} - رقم القضية: ${caseNumber}`,
                type: NOTIFICATION_TYPES.FILING_RECEIVED,
                relatedId: null, // UUID - stored in actionUrl instead
                relatedType: 'case',
                priority: NOTIFICATION_PRIORITY.NORMAL,
                actionUrl: `/lawyer/cases/${targetCase.case_id}`
            });
        } catch (notifError) {
            console.error("Lawyer notification error (non-blocking):", notifError);
        }

        // 7. Send notification to client if found
        if (foundClientId) {
            try {
                await createNotification({
                    userId: foundClientId,
                    userType: 'client',
                    title: 'تم تقديم دعوى باسمك',
                    message: `قام محاميك بتقديم دعوى قضائية باسمك إلى ${selectedCourt}`,
                    type: NOTIFICATION_TYPES.FILING_RECEIVED,
                    relatedId: null, // UUID - stored in actionUrl instead
                    relatedType: 'case',
                    priority: NOTIFICATION_PRIORITY.HIGH,
                    actionUrl: `/client/cases/${targetCase.case_id}`
                });
            } catch (notifError) {
                console.error("Client notification error (non-blocking):", notifError);
            }
        }

        res.json({
            success: true,
            message: caseId ? "تم تقديم الدعوى رسمياً للمحكمة" : "تم تقديم الدعوى بنجاح",
            data: {
                filing,
                case: targetCase,
                filingNumber,
                caseNumber: targetCase.case_number || caseNumber
            }
        });

    } catch (error) {
        console.error("Error submitting filing:", error);
        res.status(500).json({
            error: "Failed to submit filing",
            details: error.message
        });
    }
});

/**
 * POST /api/court-clerk/filings/draft
 * Save a filing as draft
 */
router.post("/filings/draft", async (req, res) => {
    try {
        const {
            draftId = null, // For updating existing draft
            lawyerId,
            selectedCourt,
            city,
            courtType,
            filingType,
            caseType,
            claimValue,
            relationship,
            caseSubject,
            legalRequests,
            plaintiffName,
            plaintiffId,
            plaintiffNationality,
            plaintiffCapacity,
            plaintiffRepresentative,
            plaintiffAddress,
            plaintiffPhone,
            plaintiffEmail,
            emailNotifications,
            defendantType,
            defendantName,
            defendantIdOrReg,
            defendantAddress,
            attachments = []
        } = req.body;

        const draftData = {
            lawyer_id: lawyerId,
            court_name: selectedCourt,
            city: city,
            court_type: courtType,
            filing_type: filingType,
            case_type: caseType,
            claim_value: claimValue,
            relationship: relationship,
            case_subject: caseSubject,
            legal_requests: legalRequests,
            plaintiff_name: plaintiffName,
            plaintiff_id_number: plaintiffId,
            plaintiff_nationality: plaintiffNationality,
            plaintiff_capacity: plaintiffCapacity,
            plaintiff_representative: plaintiffRepresentative,
            plaintiff_address: plaintiffAddress,
            plaintiff_phone: plaintiffPhone,
            plaintiff_email: plaintiffEmail,
            email_notifications: emailNotifications,
            defendant_type: defendantType,
            defendant_name: defendantName,
            defendant_id_number: defendantIdOrReg,
            defendant_address: defendantAddress,
            attachments_json: JSON.stringify(attachments),
            updated_at: new Date()
        };

        let draft;

        if (draftId) {
            // Update existing draft
            const { data, error } = await supabase
                .from("filing_drafts")
                .update(draftData)
                .eq("draft_id", draftId)
                .eq("lawyer_id", lawyerId)
                .select()
                .single();

            if (error) throw error;
            draft = data;
        } else {
            // Create new draft
            const { data, error } = await supabase
                .from("filing_drafts")
                .insert({
                    ...draftData,
                    created_at: new Date()
                })
                .select()
                .single();

            if (error) throw error;
            draft = data;
        }

        res.json({
            success: true,
            message: "تم حفظ المسودة بنجاح",
            data: draft
        });

    } catch (error) {
        console.error("Error saving draft:", error);
        res.status(500).json({
            error: "Failed to save draft",
            details: error.message
        });
    }
});

/**
 * GET /api/court-clerk/filings/drafts
 * Get all drafts for a lawyer
 */
router.get("/filings/drafts", async (req, res) => {
    try {
        // Get lawyer ID from auth header
        const userDataHeader = req.headers['x-user-data'];
        if (!userDataHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let userData;
        try {
            const decoded = Buffer.from(userDataHeader, 'base64').toString('utf-8');
            userData = JSON.parse(decoded);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid user data' });
        }

        const lawyerId = userData.lawyer_id || userData.user_id || userData.id;

        const { data: drafts, error } = await supabase
            .from("filing_drafts")
            .select("*")
            .eq("lawyer_id", lawyerId)
            .order("updated_at", { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: drafts || []
        });

    } catch (error) {
        console.error("Error fetching drafts:", error);
        res.status(500).json({
            error: "Failed to fetch drafts",
            details: error.message
        });
    }
});

/**
 * DELETE /api/court-clerk/filings/drafts/:draftId
 * Delete a draft
 */
router.delete("/filings/drafts/:draftId", async (req, res) => {
    try {
        const { draftId } = req.params;

        // Get lawyer ID from auth header
        const userDataHeader = req.headers['x-user-data'];
        if (!userDataHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let userData;
        try {
            const decoded = Buffer.from(userDataHeader, 'base64').toString('utf-8');
            userData = JSON.parse(decoded);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid user data' });
        }

        const lawyerId = userData.lawyer_id || userData.user_id || userData.id;

        const { error } = await supabase
            .from("filing_drafts")
            .delete()
            .eq("draft_id", draftId)
            .eq("lawyer_id", lawyerId);

        if (error) throw error;

        res.json({
            success: true,
            message: "تم حذف المسودة بنجاح"
        });

    } catch (error) {
        console.error("Error deleting draft:", error);
        res.status(500).json({
            error: "Failed to delete draft",
            details: error.message
        });
    }
});

/**
 * GET /api/court-clerk/filings
 * Get all filings with filters (Inbox page)
 */
router.get("/filings", verifyCourtClerk, async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;

        let query = supabase
            .from("court_clerk_filings")
            .select("*", { count: "exact" })
            .order("submitted_at", { ascending: false });

        // Filter by status
        if (status) {
            query = query.eq("filing_status", status);
        }

        // Search functionality
        if (search) {
            query = query.or(`filing_number.ilike.%${search}%,plaintiff_name.ilike.%${search}%,defendant_name.ilike.%${search}%`);
        }

        // Pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data: filings, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: filings || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0
            }
        });

    } catch (error) {
        console.error("Error fetching filings:", error);
        res.status(500).json({
            error: "Failed to fetch filings",
            details: error.message
        });
    }
});

/**
 * GET /api/court-clerk/filings/:filing_id
 * Get single filing details with attachments
 */
router.get("/filings/:filing_id", verifyCourtClerk, async (req, res) => {
    try {
        const { filing_id } = req.params;

        // Get filing details - use explicit foreign key names to avoid ambiguity
        const { data: filing, error: filingError } = await supabase
            .from("court_clerk_filings")
            .select(`
                *,
                reviews:filing_reviews(*)
            `)
            .eq("filing_id", filing_id)
            .single();

        if (filingError) throw filingError;

        // Get attachments
        const { data: attachments, error: attachError } = await supabase
            .from("filing_attachments")
            .select("*")
            .eq("filing_id", filing_id)
            .order("created_at", { ascending: false });

        if (attachError) throw attachError;

        // Get lawyer timeline events (documents, memos, notes)
        let lawyerEvents = [];
        if (filing?.case_id) {
            const { data: events, error: eventsError } = await supabase
                .from("timeline_events")
                .select("*")
                .eq("case_id", filing.case_id)
                .eq("author_type", "lawyer")
                .in("event_type", ["document", "postpone"])
                .order("created_at", { ascending: false });

            if (!eventsError && events) {
                lawyerEvents = events;
            }
        }

        res.json({
            success: true,
            data: {
                ...filing,
                attachments,
                lawyerEvents
            }
        });

    } catch (error) {
        console.error("Error fetching filing details:", error);
        res.status(500).json({
            error: "Failed to fetch filing details",
            details: error.message
        });
    }
});

// ============================================
// 3. REVIEW - مراجعة اللوائح
// ============================================

/**
 * POST /api/court-clerk/filings/:filing_id/review
 * Review a filing (accept, reject, request update, request documents)
 */
router.post("/filings/:filing_id/review", verifyCourtClerk, validateReviewAction, async (req, res) => {
    try {
        const { filing_id } = req.params;
        const { review_action, review_notes, rejection_reason, requested_changes, requested_documents } = req.body;
        const clerkId = req.clerk.user_id;

        // Update filing status
        let newFilingStatus = 'under_review';
        if (review_action === 'accepted') {
            newFilingStatus = 'ready_for_registration';
        } else if (review_action === 'rejected') {
            newFilingStatus = 'rejected';
        } else if (review_action === 'requested_update') {
            newFilingStatus = 'update_required'; // Updated to new stage name
        }

        const { data: updatedFiling, error: updateError } = await supabase
            .from("court_clerk_filings")
            .update({
                filing_status: newFilingStatus,
                reviewed_by: clerkId,
                reviewed_at: new Date(),
                review_notes,
                rejection_reason: review_action === 'rejected' ? rejection_reason : null,
                requested_changes: review_action === 'requested_update' ? requested_changes : null,
                requested_documents: review_action === 'requested_documents' ? requested_documents : null
            })
            .eq("filing_id", filing_id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Insert review record
        const { error: reviewError } = await supabase
            .from("filing_reviews")
            .insert({
                filing_id,
                reviewed_by: clerkId,
                review_action,
                review_notes,
                rejection_reason,
                requested_changes,
                requested_documents
            });

        if (reviewError) throw reviewError;

        // Update case stage (only for non-rejection - rejected cases stay in submitted/under_review)
        if (updatedFiling.case_id && review_action !== 'rejected') {
            let newStage = 'under_review';
            if (review_action === 'accepted') newStage = 'ready_for_registration';
            else if (review_action === 'requested_update' || review_action === 'requested_documents') newStage = 'update_required';

            await updateCaseStage(updatedFiling.case_id, newStage, clerkId, `Filing ${review_action}`);
        }

        // Add timeline event for tracking
        if (updatedFiling.case_id) {
            let timelineTitle = '';
            let timelineDescription = '';

            if (review_action === 'accepted') {
                timelineTitle = 'تم قبول اللائحة';
                timelineDescription = 'تمت مراجعة اللائحة وقبولها - جاهزة للتسجيل الرسمي';
            } else if (review_action === 'rejected') {
                timelineTitle = 'تم رفض اللائحة';
                timelineDescription = `تم رفض اللائحة. السبب: ${rejection_reason || 'غير محدد'}`;
            } else if (review_action === 'requested_update') {
                timelineTitle = 'مطلوب تحديثات على اللائحة';
                timelineDescription = review_notes || requested_changes || 'يرجى مراجعة ملاحظات كاتب المحكمة';
            }

            try {
                await supabase.from("timeline_events").insert({
                    case_id: updatedFiling.case_id,
                    event_type: `filing_${review_action}`,
                    title: timelineTitle,
                    description: timelineDescription,
                    created_by_id: clerkId,
                    created_by_type: 'court_clerk'
                });
            } catch (timelineError) {
                console.error("Timeline error (non-blocking):", timelineError);
            }
        }

        // Log action
        await logClerkAction(clerkId, 'review_filing', `Reviewed filing: ${review_action}`, {
            filing_id,
            case_id: updatedFiling.case_id,
            review_action
        });

        // Send notification to lawyer based on review action
        const filing = updatedFiling;
        let notificationTitle = '';
        let notificationMessage = '';
        let notificationType = NOTIFICATION_TYPES.FILING_UNDER_REVIEW;

        if (review_action === 'accepted') {
            notificationType = NOTIFICATION_TYPES.FILING_ACCEPTED;
            notificationTitle = 'تم قبول اللائحة';
            notificationMessage = `تم قبول اللائحة رقم ${filing.filing_number} وهي جاهزة للتسجيل الرسمي`;
        } else if (review_action === 'rejected') {
            notificationType = NOTIFICATION_TYPES.FILING_REJECTED;
            notificationTitle = 'تم رفض اللائحة';
            notificationMessage = `تم رفض اللائحة رقم ${filing.filing_number}. السبب: ${rejection_reason}`;
        } else if (review_action === 'requested_update') {
            notificationType = NOTIFICATION_TYPES.FILING_UPDATE_REQUESTED;
            notificationTitle = 'مطلوب تحديث اللائحة';
            notificationMessage = `يرجى تحديث اللائحة رقم ${filing.filing_number} حسب الملاحظات المرفقة`;
        } else if (review_action === 'requested_documents') {
            notificationType = NOTIFICATION_TYPES.FILING_UPDATE_REQUESTED;
            notificationTitle = 'مطلوب مستندات إضافية';
            notificationMessage = `يرجى إرفاق المستندات المطلوبة للائحة رقم ${filing.filing_number}`;
        }

        // Send notification to lawyer
        if (filing.lawyer_id) {
            // Set priority based on action type
            let notificationPriority = NOTIFICATION_PRIORITY.NORMAL;
            if (review_action === 'rejected') {
                notificationPriority = NOTIFICATION_PRIORITY.HIGH;
            } else if (review_action === 'requested_update' || review_action === 'requested_documents') {
                notificationPriority = NOTIFICATION_PRIORITY.HIGH;
            }

            await createNotification({
                userId: filing.lawyer_id,
                userType: 'lawyer',
                title: notificationTitle,
                message: notificationMessage,
                type: notificationType,
                relatedId: null, // UUID - stored in actionUrl instead
                relatedType: 'filing',
                priority: notificationPriority,
                actionUrl: `/lawyer/filings/${filing_id}`
            });
        }

        res.json({
            success: true,
            message: `Filing ${review_action} successfully`,
            data: updatedFiling
        });

    } catch (error) {
        console.error("Error reviewing filing:", error);
        res.status(500).json({
            error: "Failed to review filing",
            details: error.message
        });
    }
});

// ============================================
// 4. CASE REGISTRATION - تسجيل الدعوى
// ============================================

/**
 * POST /api/court-clerk/filings/:filing_id/register
 * Register a case officially (assign case number, registry number, fees)
 */
router.post("/filings/:filing_id/register", verifyCourtClerk, validateCaseRegistration, async (req, res) => {
    try {
        const { filing_id } = req.params;
        const { registry_number, official_case_number, registration_date, court_fees } = req.body;
        const clerkId = req.clerk.user_id;

        // Update filing with registration info
        const { data: updatedFiling, error: updateError } = await supabase
            .from("court_clerk_filings")
            .update({
                filing_status: 'registered',
                registry_number,
                official_case_number,
                registration_date,
                court_fees
            })
            .eq("filing_id", filing_id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Update case with official case number and status
        if (updatedFiling.case_id) {
            const { error: caseError } = await supabase
                .from("cases")
                .update({
                    case_number: official_case_number,
                    status: 'active', // Case becomes active after registration
                    updated_at: new Date()
                })
                .eq("case_id", updatedFiling.case_id);

            if (caseError) throw caseError;

            // Update case stage to 'registered'
            await updateCaseStage(updatedFiling.case_id, 'registered', clerkId, 'Case officially registered');

            // Add timeline event
            const { error: timelineError } = await supabase
                .from("timeline_events")
                .insert({
                    case_id: updatedFiling.case_id,
                    event_type: 'case_registered',
                    author_id: clerkId,
                    author_type: 'court_clerk',
                    title: 'تم تسجيل الدعوى رسميًا',
                    description: `تم تسجيل الدعوى برقم قيد: ${registry_number} ورقم دعوى: ${official_case_number}`,
                    visibility: 'all'
                });

            if (timelineError) console.error("Timeline error:", timelineError);
        }

        // Create invoice for court fees if fees > 0
        if (court_fees > 0 && updatedFiling.case_id) {
            const invoiceNumber = `INV-${Date.now()}`;

            const { error: invoiceError } = await supabase
                .from("invoices")
                .insert({
                    invoice_number: invoiceNumber,
                    lawyer_id: updatedFiling.lawyer_id,
                    client_id: updatedFiling.client_id,
                    case_id: updatedFiling.case_id,
                    subtotal: court_fees,
                    total_amount: court_fees,
                    status: 'pending',
                    issue_date: new Date(),
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    notes: `رسوم تسجيل الدعوى رقم ${official_case_number}`
                });

            if (invoiceError) console.error("Invoice creation error:", invoiceError);
        }

        // Log action
        await logClerkAction(clerkId, 'register_case', `Registered case: ${official_case_number}`, {
            filing_id,
            case_id: updatedFiling.case_id,
            registry_number,
            official_case_number
        });

        // Send notification to lawyer
        if (updatedFiling.lawyer_id) {
            await createNotification({
                userId: updatedFiling.lawyer_id,
                userType: 'lawyer',
                title: 'تم تسجيل الدعوى رسميًا',
                message: `تم تسجيل الدعوى برقم قيد ${registry_number} ورقم دعوى ${official_case_number}`,
                type: NOTIFICATION_TYPES.CASE_REGISTERED,
                relatedId: null, // UUID - stored in actionUrl instead
                relatedType: 'case',
                priority: NOTIFICATION_PRIORITY.HIGH,
                actionUrl: `/lawyer/cases/${updatedFiling.case_id}`
            });
        }

        // Send notification to client
        if (updatedFiling.client_id) {
            await createNotification({
                userId: updatedFiling.client_id,
                userType: 'client',
                title: 'تم تسجيل دعواك رسميًا',
                message: `تم تسجيل دعواك برقم ${official_case_number}. يمكنك متابعة التفاصيل مع محاميك`,
                type: NOTIFICATION_TYPES.CASE_REGISTERED,
                relatedId: null, // UUID - stored in actionUrl instead
                relatedType: 'case',
                priority: NOTIFICATION_PRIORITY.HIGH,
                actionUrl: `/client/cases/${updatedFiling.case_id}`
            });
        }

        res.json({
            success: true,
            message: "Case registered successfully",
            data: updatedFiling
        });

    } catch (error) {
        console.error("Error registering case:", error);
        res.status(500).json({
            error: "Failed to register case",
            details: error.message
        });
    }
});

// ============================================
// 5. SERVICE OF PROCESS - التبليغات
// ============================================

/**
 * GET /api/court-clerk/cases/:case_id/services
 * Get all service attempts for a case
 */
router.get("/cases/:case_id/services", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id } = req.params;

        const { data: services, error } = await supabase
            .from("service_of_process")
            .select("*")
            .eq("case_id", case_id)
            .order("attempt_date", { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: services
        });

    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({
            error: "Failed to fetch service records",
            details: error.message
        });
    }
});

/**
 * POST /api/court-clerk/cases/:case_id/services
 * Add service of process record
 */
router.post("/cases/:case_id/services", verifyCourtClerk, validateServiceOfProcess, async (req, res) => {
    try {
        const { case_id } = req.params;
        const {
            service_method,
            defendant_name,
            defendant_address,
            defendant_phone,
            attempt_date,
            attempt_result,
            proof_file_url,
            service_notes,
            filing_id
        } = req.body;
        const clerkId = req.clerk.user_id;

        const { data: service, error } = await supabase
            .from("service_of_process")
            .insert({
                case_id,
                filing_id,
                service_method,
                defendant_name,
                defendant_address,
                defendant_phone,
                attempt_date,
                attempt_result,
                proof_file_url,
                service_notes,
                created_by: clerkId
            })
            .select()
            .single();

        if (error) throw error;

        // Update case stage based on service result
        // When first service is added, move to pending_service stage
        await updateCaseStage(case_id, 'pending_service', clerkId, 'تم إضافة تبليغ جديد');

        // If this service is already served, check if all services are completed
        if (attempt_result === 'served') {
            const { data: allServices } = await supabase
                .from("service_of_process")
                .select("attempt_result")
                .eq("case_id", case_id);

            const allServed = allServices?.every(s => s.attempt_result === 'served');
            if (allServed) {
                await updateCaseStage(case_id, 'service_completed', clerkId, 'تم تبليغ جميع الأطراف');
            }
        }

        // Add timeline event
        const { error: timelineError } = await supabase
            .from("timeline_events")
            .insert({
                case_id,
                event_type: 'service_logged',
                author_id: clerkId,
                author_type: 'court_clerk',
                title: 'تسجيل محاولة تبليغ',
                description: `محاولة تبليغ ${defendant_name} - النتيجة: ${attempt_result}`,
                visibility: 'all'
            });

        if (timelineError) console.error("Timeline error:", timelineError);

        // Log action
        await logClerkAction(clerkId, 'add_service', `Service attempt recorded: ${attempt_result}`, {
            case_id,
            service_id: service.service_id
        });

        // ============================================
        // NOTIFY DEFENDANT - تبليغ المدعى عليه
        // ============================================
        try {
            // Get filing to find defendant ID number
            const { data: filing } = await supabase
                .from("court_clerk_filings")
                .select("defendant_id_number, defendant_name, filing_summary, case_id, plaintiff_name")
                .eq("case_id", case_id)
                .single();

            // Find defendant user by id_number
            if (filing?.defendant_id_number) {
                const { data: defendantUser } = await supabase
                    .from("users")
                    .select("user_id")
                    .eq("id_number", filing.defendant_id_number)
                    .single();

                if (defendantUser) {
                    // Check if we already sent a notification for this case
                    const { data: existingNotification } = await supabase
                        .from("notifications")
                        .select("notification_id")
                        .eq("user_id", defendantUser.user_id)
                        .eq("related_id", parseInt(case_id))
                        .eq("type", NOTIFICATION_TYPES.DEFENDANT_NOTIFIED)
                        .single();

                    // Only send notification if we haven't already
                    if (!existingNotification) {
                        await createNotification({
                            userId: defendantUser.user_id,
                            userType: 'client',
                            title: 'تم رفع دعوى قضائية ضدك',
                            message: `تم تسجيل دعوى قضائية ضدك من ${filing.plaintiff_name || 'مدعي'}. الموضوع: ${filing.filing_summary || 'غير محدد'}. يرجى مراجعة التفاصيل.`,
                            type: NOTIFICATION_TYPES.DEFENDANT_NOTIFIED,
                            relatedId: parseInt(case_id),
                            relatedType: 'case',
                            priority: NOTIFICATION_PRIORITY.HIGH,
                            actionUrl: `/client/cases-against-me/${case_id}`
                        });
                        console.log(`✅ Sent notification to defendant user_id: ${defendantUser.user_id}`);
                    } else {
                        console.log(`ℹ️ Defendant already notified for case ${case_id}`);
                    }
                } else {
                    console.log(`ℹ️ Defendant with id_number ${filing.defendant_id_number} not registered in system`);
                }
            }
        } catch (notifError) {
            // Non-blocking - don't fail the service creation if notification fails
            console.error("Defendant notification error (non-blocking):", notifError);
        }

        res.json({
            success: true,
            message: "Service record added successfully",
            data: service
        });

    } catch (error) {
        console.error("Error adding service record:", error);
        res.status(500).json({
            error: "Failed to add service record",
            details: error.message
        });
    }
});

/**
 * PUT /api/court-clerk/cases/:case_id/services/:service_id
 * Update a service record (e.g., update attempt_result from pending to served)
 */
router.put("/cases/:case_id/services/:service_id", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id, service_id } = req.params;
        const {
            attempt_result,
            attempt_date,
            proof_file_url,
            service_notes
        } = req.body;
        const clerkId = req.clerk.user_id;

        // Update the service record
        const { data: service, error } = await supabase
            .from("service_of_process")
            .update({
                attempt_result,
                attempt_date,
                proof_file_url,
                service_notes,
                updated_at: new Date()
            })
            .eq("service_id", service_id)
            .eq("case_id", case_id)
            .select()
            .single();

        if (error) throw error;

        // Check if all services are now served
        if (attempt_result === 'served') {
            const { data: allServices } = await supabase
                .from("service_of_process")
                .select("attempt_result")
                .eq("case_id", case_id);

            const allServed = allServices?.every(s => s.attempt_result === 'served');
            if (allServed) {
                await updateCaseStage(case_id, 'service_completed', clerkId, 'تم تبليغ جميع الأطراف');
            }
        }

        // Add timeline event
        await supabase.from("timeline_events").insert({
            case_id,
            event_type: 'service_updated',
            author_id: clerkId,
            author_type: 'court_clerk',
            title: 'تحديث حالة التبليغ',
            description: `تم تحديث حالة التبليغ إلى: ${attempt_result === 'served' ? 'تم التبليغ' : attempt_result === 'not_served' ? 'لم يتم' : attempt_result === 'refused' ? 'رُفض' : 'قيد التبليغ'}`,
            visibility: 'all'
        });

        // Log action
        await logClerkAction(clerkId, 'update_service', `Service updated: ${attempt_result}`, {
            case_id,
            service_id
        });

        res.json({
            success: true,
            message: "Service record updated successfully",
            data: service
        });

    } catch (error) {
        console.error("Error updating service record:", error);
        res.status(500).json({
            error: "Failed to update service record",
            details: error.message
        });
    }
});

// ============================================
// 6. HEARINGS - الجلسات
// ============================================

/**
 * GET /api/court-clerk/cases/:case_id/hearings
 * Get all hearings for a case
 */
router.get("/cases/:case_id/hearings", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id } = req.params;

        const { data: hearings, error } = await supabase
            .from("court_hearings")
            .select("*")
            .eq("case_id", case_id)
            .order("hearing_date", { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: hearings
        });

    } catch (error) {
        console.error("Error fetching hearings:", error);
        res.status(500).json({
            error: "Failed to fetch hearings",
            details: error.message
        });
    }
});

/**
 * POST /api/court-clerk/cases/:case_id/hearings
 * Schedule a new hearing
 */
router.post("/cases/:case_id/hearings", verifyCourtClerk, validateHearingSchedule, async (req, res) => {
    try {
        const { case_id } = req.params;
        const {
            hearing_type,
            hearing_date,
            hearing_time,
            hearing_summary,
            judge_notes
        } = req.body;
        const clerkId = req.clerk.user_id;

        // Get hearing number (count + 1)
        const { count, error: countError } = await supabase
            .from("court_hearings")
            .select("*", { count: 'exact', head: true })
            .eq("case_id", case_id);

        if (countError) throw countError;

        const hearing_number = (count || 0) + 1;

        const { data: hearing, error } = await supabase
            .from("court_hearings")
            .insert({
                case_id,
                hearing_number,
                hearing_type,
                hearing_date,
                hearing_time,
                hearing_summary,
                judge_notes,
                hearing_status: 'scheduled',
                created_by: clerkId
            })
            .select()
            .single();

        if (error) throw error;

        // Update case stage
        const newStage = hearing_number === 1 ? 'first_hearing_scheduled' : 'hearings_ongoing';
        await updateCaseStage(case_id, newStage, clerkId, `تم تحديد الجلسة رقم ${hearing_number}`);

        // Add timeline event
        const { error: timelineError } = await supabase
            .from("timeline_events")
            .insert({
                case_id,
                event_type: 'hearing_scheduled',
                author_id: clerkId,
                author_type: 'court_clerk',
                title: `تحديد الجلسة رقم ${hearing_number}`,
                description: `تم تحديد جلسة ${hearing_type} بتاريخ ${hearing_date} الساعة ${hearing_time}`,
                visibility: 'all'
            });

        if (timelineError) console.error("Timeline error:", timelineError);

        // Log action
        await logClerkAction(clerkId, 'schedule_hearing', `Hearing ${hearing_number} scheduled`, {
            case_id,
            hearing_id: hearing.hearing_id
        });

        // Get case details to find lawyer and client
        const { data: caseData } = await supabase
            .from("cases")
            .select("assigned_lawyer_id, client_id")
            .eq("case_id", case_id)
            .single();

        // Send notification to lawyer
        if (caseData?.assigned_lawyer_id) {
            await createNotification({
                userId: caseData.assigned_lawyer_id,
                userType: 'lawyer',
                title: 'تم تحديد موعد جلسة',
                message: `تم تحديد جلسة ${hearing_type} بتاريخ ${hearing_date} الساعة ${hearing_time}`,
                type: NOTIFICATION_TYPES.HEARING_SCHEDULED,
                relatedId: null, // UUID - stored in actionUrl instead
                relatedType: 'hearing',
                priority: NOTIFICATION_PRIORITY.HIGH,
                actionUrl: `/lawyer/cases/${case_id}`
            });
        }

        // Send notification to client
        if (caseData?.client_id) {
            await createNotification({
                userId: caseData.client_id,
                userType: 'client',
                title: 'موعد جلسة جديد',
                message: `تم تحديد موعد جلسة بتاريخ ${hearing_date} الساعة ${hearing_time}`,
                type: NOTIFICATION_TYPES.HEARING_SCHEDULED,
                relatedId: null, // UUID - stored in actionUrl instead
                relatedType: 'hearing',
                priority: NOTIFICATION_PRIORITY.HIGH,
                actionUrl: `/client/cases/${case_id}`
            });
        }

        res.json({
            success: true,
            message: "Hearing scheduled successfully",
            data: hearing
        });

    } catch (error) {
        console.error("Error scheduling hearing:", error);
        res.status(500).json({
            error: "Failed to schedule hearing",
            details: error.message
        });
    }
});

/**
 * PUT /api/court-clerk/hearings/:hearing_id
 * Update hearing (postpone, cancel, mark as held)
 */
router.put("/hearings/:hearing_id", verifyCourtClerk, async (req, res) => {
    try {
        const { hearing_id } = req.params;
        const {
            hearing_status,
            hearing_summary,
            hearing_minutes_url,
            judge_notes,
            next_hearing_date,
            postponement_reason
        } = req.body;
        const clerkId = req.clerk.user_id;

        const { data: hearing, error } = await supabase
            .from("court_hearings")
            .update({
                hearing_status,
                hearing_summary,
                hearing_minutes_url,
                judge_notes,
                next_hearing_date,
                postponement_reason
            })
            .eq("hearing_id", hearing_id)
            .select()
            .single();

        if (error) throw error;

        // Log action
        await logClerkAction(clerkId, 'update_hearing', `Hearing updated: ${hearing_status}`, {
            case_id: hearing.case_id,
            hearing_id
        });

        res.json({
            success: true,
            message: "Hearing updated successfully",
            data: hearing
        });

    } catch (error) {
        console.error("Error updating hearing:", error);
        res.status(500).json({
            error: "Failed to update hearing",
            details: error.message
        });
    }
});

// ============================================
// 7. DECISIONS & JUDGMENTS - القرارات والأحكام
// ============================================

/**
 * GET /api/court-clerk/cases/:case_id/decisions
 * Get all decisions for a case
 */
router.get("/cases/:case_id/decisions", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id } = req.params;

        const { data: decisions, error } = await supabase
            .from("court_decisions")
            .select("*")
            .eq("case_id", case_id)
            .order("decision_date", { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: decisions
        });

    } catch (error) {
        console.error("Error fetching decisions:", error);
        res.status(500).json({
            error: "Failed to fetch decisions",
            details: error.message
        });
    }
});

/**
 * POST /api/court-clerk/cases/:case_id/decisions
 * Issue a decision or judgment
 */
router.post("/cases/:case_id/decisions", verifyCourtClerk, validateDecision, async (req, res) => {
    try {
        const case_id = parseInt(req.params.case_id);
        const {
            decision_type,
            decision_title,
            decision_summary,
            decision_file_url,
            ruling,
            in_favor_of,
            is_appealable,
            appeal_deadline,
            decision_date
        } = req.body;
        const clerkId = req.clerk.user_id;

        console.log(`📜 Issuing decision for case ${case_id}, type: ${decision_type}`);

        // First verify the case exists
        const { data: caseCheck, error: caseError } = await supabase
            .from("cases")
            .select("case_id, case_stage")
            .eq("case_id", case_id)
            .single();

        if (caseError || !caseCheck) {
            console.error("❌ Case not found:", case_id, caseError);
            return res.status(404).json({ error: "Case not found", details: caseError?.message });
        }

        console.log(`📋 Current case stage: ${caseCheck.case_stage}`);

        const { data: decision, error } = await supabase
            .from("court_decisions")
            .insert({
                case_id,
                decision_type,
                decision_title,
                decision_summary,
                decision_file_url: decision_file_url || null,
                ruling: ruling || null,
                in_favor_of: in_favor_of || null,
                is_appealable: is_appealable !== undefined ? is_appealable : true,
                appeal_deadline: appeal_deadline || null,
                decision_date,
                created_by: clerkId
            })
            .select()
            .single();

        if (error) {
            console.error("❌ Decision insert error:", error);
            throw error;
        }

        console.log(`✅ Decision created: ${decision.decision_id}`);

        // ============================================
        // تحديث مرحلة القضية حسب نوع القرار
        // ============================================
        // المنطق الصحيح:
        // 1. القرار التمهيدي (preliminary) → لا يغير المرحلة أبداً (تبقى hearings_ongoing)
        // 2. الحكم النهائي (final_judgment):
        //    - قابل للاستئناف → appeal_period
        //    - غير قابل للاستئناف → in_execution
        // 3. أنواع أخرى (procedural, court_order, appeal_decision):
        //    - إذا كان حكم استئناف نهائي → in_execution
        //    - وإلا → لا تغيير

        let newStage = null; // null يعني لا تغيير في المرحلة
        let stageChangeReason = '';

        if (decision_type === 'final_judgment') {
            // الحكم النهائي - يغير المرحلة دائماً
            if (is_appealable) {
                newStage = 'appeal_period';
                stageChangeReason = 'صدور حكم نهائي قابل للاستئناف';
            } else {
                newStage = 'in_execution';
                stageChangeReason = 'صدور حكم نهائي غير قابل للاستئناف';
            }
        } else if (decision_type === 'appeal_decision') {
            // قرار استئناف - إذا كان نهائي ينتقل للتنفيذ
            if (!is_appealable) {
                newStage = 'in_execution';
                stageChangeReason = 'صدور قرار استئناف نهائي';
            }
            // إذا كان قابل للاستئناف (استئناف ثاني) تبقى المرحلة كما هي
        } else if (decision_type === 'preliminary') {
            // القرار التمهيدي - لا يغير المرحلة أبداً
            // تبقى القضية في hearings_ongoing
            console.log(`📋 قرار تمهيدي - لن يتم تغيير المرحلة`);
            stageChangeReason = 'قرار تمهيدي - لا تغيير في المرحلة';
        }
        // أنواع أخرى (procedural, court_order) لا تغير المرحلة

        // تحديث المرحلة فقط إذا كان هناك مرحلة جديدة
        if (newStage) {
            console.log(`🔄 Updating case stage to: ${newStage}`);
            const stageResult = await updateCaseStage(case_id, newStage, clerkId, stageChangeReason);
            console.log(`📊 Stage update result:`, stageResult);
        } else {
            console.log(`📋 No stage change required for decision type: ${decision_type}`);
        }

        // Add timeline event
        const { error: timelineError } = await supabase
            .from("timeline_events")
            .insert({
                case_id,
                event_type: 'decision',
                author_id: clerkId,
                author_type: 'court_clerk',
                title: decision_title,
                description: decision_summary,
                visibility: 'all',
                files: decision_file_url ? [{ url: decision_file_url, type: 'decision' }] : null
            });

        if (timelineError) console.error("Timeline error:", timelineError);

        // Log action
        await logClerkAction(clerkId, 'issue_decision', `Decision issued: ${decision_type}`, {
            case_id,
            decision_id: decision.decision_id
        });

        // Get case details to find lawyer and client
        const { data: caseData } = await supabase
            .from("cases")
            .select("assigned_lawyer_id, client_id")
            .eq("case_id", case_id)
            .single();

        // Send notification to lawyer
        if (caseData?.assigned_lawyer_id) {
            await createNotification({
                userId: caseData.assigned_lawyer_id,
                userType: 'lawyer',
                title: 'صدر قرار محكمة',
                message: `صدر قرار محكمة: ${decision_title}`,
                type: NOTIFICATION_TYPES.DECISION_ISSUED,
                relatedId: null, // UUID - stored in actionUrl instead
                relatedType: 'decision',
                priority: NOTIFICATION_PRIORITY.URGENT,
                actionUrl: `/lawyer/cases/${case_id}`
            });
        }

        // Send notification to client
        if (caseData?.client_id) {
            await createNotification({
                userId: caseData.client_id,
                userType: 'client',
                title: 'صدر قرار بشأن دعواك',
                message: `صدر قرار بشأن دعواك. يرجى التواصل مع محاميك للتفاصيل`,
                type: NOTIFICATION_TYPES.DECISION_ISSUED,
                relatedId: null, // UUID - stored in actionUrl instead
                relatedType: 'decision',
                priority: NOTIFICATION_PRIORITY.URGENT,
                actionUrl: `/client/cases/${case_id}`
            });
        }

        res.json({
            success: true,
            message: "Decision issued successfully",
            data: decision
        });

    } catch (error) {
        console.error("Error issuing decision:", error);
        res.status(500).json({
            error: "Failed to issue decision",
            details: error.message
        });
    }
});

// ============================================
// 8. CASE MANAGEMENT
// ============================================

/**
 * GET /api/court-clerk/cases
 * Get all cases with filters
 */
router.get("/cases", verifyCourtClerk, async (req, res) => {
    try {
        const { stage, page = 1, limit = 20, search } = req.query;

        let query = supabase
            .from("cases")
            .select(`
                *,
                client:users(user_id, first_name, last_name, email),
                lawyer:lawyers(lawyer_id, first_name, last_name, email)
            `)
            .order("created_at", { ascending: false });

        if (stage) {
            query = query.eq("case_stage", stage);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,case_number.ilike.%${search}%`);
        }

        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data: cases, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: cases
        });

    } catch (error) {
        console.error("Error fetching cases:", error);
        res.status(500).json({
            error: "Failed to fetch cases",
            details: error.message
        });
    }
});

/**
 * GET /api/court-clerk/cases/:case_id
 * Get full case details
 */
router.get("/cases/:case_id", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id } = req.params;

        const { data: caseData, error } = await supabase
            .from("cases")
            .select(`
                *,
                client:users(*),
                lawyer:lawyers(*),
                filing:court_clerk_filings(*),
                hearings:court_hearings(*),
                services:service_of_process(*),
                decisions:court_decisions(*),
                timeline:timeline_events(*)
            `)
            .eq("case_id", case_id)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: caseData
        });

    } catch (error) {
        console.error("Error fetching case details:", error);
        res.status(500).json({
            error: "Failed to fetch case details",
            details: error.message
        });
    }
});

// ============================================
// 9. ACTIONS LOG
// ============================================

/**
 * GET /api/court-clerk/actions
 * Get clerk's action history
 */
router.get("/actions", verifyCourtClerk, async (req, res) => {
    try {
        const clerkId = req.clerk.user_id;
        const { page = 1, limit = 50 } = req.query;

        const offset = (page - 1) * limit;

        const { data: actions, error } = await supabase
            .from("clerk_actions_log")
            .select("*")
            .eq("performed_by", clerkId)
            .order("performed_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: actions
        });

    } catch (error) {
        console.error("Error fetching actions:", error);
        res.status(500).json({
            error: "Failed to fetch action history",
            details: error.message
        });
    }
});

// ============================================
// 10. CASE STAGE MANAGEMENT (14 Stages)
// ============================================

/**
 * All 14 case stages with their details
 */
const CASE_STAGES = {
    submitted: {
        label_ar: 'تم التقديم',
        label_en: 'Submitted',
        color: '#9e9e9e',
        order: 1
    },
    under_review: {
        label_ar: 'قيد المراجعة',
        label_en: 'Under Review',
        color: '#ff9800',
        order: 2
    },
    update_required: {
        label_ar: 'مطلوب تعديل',
        label_en: 'Update Required',
        color: '#ff5252',
        order: 3
    },
    ready_for_registration: {
        label_ar: 'جاهزة للتسجيل',
        label_en: 'Ready for Registration',
        color: '#64b5f6',
        order: 4
    },
    registered: {
        label_ar: 'مسجلة رسميًا',
        label_en: 'Officially Registered',
        color: '#2e7d32',
        order: 5
    },
    service_in_progress: {
        label_ar: 'قيد التبليغ',
        label_en: 'Service in Progress',
        color: '#1e88e5',
        order: 6
    },
    service_completed: {
        label_ar: 'تم التبليغ',
        label_en: 'Service Completed',
        color: '#43a047',
        order: 7
    },
    awaiting_response: {
        label_ar: 'بانتظار الرد',
        label_en: 'Awaiting Response',
        color: '#fb8c00',
        order: 8
    },
    first_hearing_scheduled: {
        label_ar: 'أول جلسة مجدولة',
        label_en: 'First Hearing Scheduled',
        color: '#1565c0',
        order: 9
    },
    hearings_ongoing: {
        label_ar: 'جلسات جارية',
        label_en: 'Hearings Ongoing',
        color: '#42a5f5',
        order: 10
    },
    judgment_issued: {
        label_ar: 'صدر الحكم',
        label_en: 'Judgment Issued',
        color: '#2e7d32',
        order: 11
    },
    appeal_period: {
        label_ar: 'فترة الاستئناف',
        label_en: 'Appeal Period',
        color: '#ffeb3b',
        order: 12,
        default_days: 30
    },
    in_execution: {
        label_ar: 'قيد التنفيذ',
        label_en: 'In Execution',
        color: '#7b1fa2',
        order: 13
    },
    fully_executed: {
        label_ar: 'منفذة بالكامل',
        label_en: 'Fully Executed',
        color: '#00e676',
        order: 14
    }
};

/**
 * GET /api/court-clerk/stages
 * Get all available case stages
 */
router.get("/stages", verifyCourtClerk, async (req, res) => {
    try {
        res.json({
            success: true,
            data: CASE_STAGES
        });
    } catch (error) {
        console.error("Error fetching stages:", error);
        res.status(500).json({
            error: "Failed to fetch stages",
            details: error.message
        });
    }
});

/**
 * PUT /api/court-clerk/cases/:case_id/stage
 * Update case stage with full tracking
 */
router.put("/cases/:case_id/stage", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id } = req.params;
        const { new_stage, reason, additional_data } = req.body;
        const clerkId = req.clerk.user_id;

        // Validate stage
        if (!CASE_STAGES[new_stage]) {
            return res.status(400).json({
                error: "Invalid stage",
                valid_stages: Object.keys(CASE_STAGES)
            });
        }

        // Get current case info
        const { data: currentCase, error: caseError } = await supabase
            .from("cases")
            .select("case_id, case_stage, lawyer_id, client_id, case_number")
            .eq("case_id", case_id)
            .single();

        if (caseError || !currentCase) {
            return res.status(404).json({ error: "Case not found" });
        }

        const previousStage = currentCase.case_stage;

        // Prepare update data
        let updateData = {
            case_stage: new_stage,
            stage_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Handle appeal period stage - set deadline
        if (new_stage === 'appeal_period') {
            const appealDays = additional_data?.appeal_days || 30;
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + appealDays);
            updateData.appeal_deadline = deadline.toISOString();
        }

        // Update case stage
        const { data: updatedCase, error: updateError } = await supabase
            .from("cases")
            .update(updateData)
            .eq("case_id", case_id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Log stage change in history
        const { error: historyError } = await supabase
            .from("case_stages_history")
            .insert({
                case_id,
                previous_stage: previousStage,
                new_stage,
                changed_by: clerkId,
                changed_by_type: 'court_clerk',
                reason: reason || `Stage updated to ${CASE_STAGES[new_stage].label_ar}`,
                metadata: additional_data || {}
            });

        if (historyError) {
            console.error("Error logging stage history:", historyError);
        }

        // Log clerk action
        await logClerkAction(supabase, {
            action_type: 'stage_update',
            performed_by: clerkId,
            case_id,
            details: {
                previous_stage: previousStage,
                new_stage,
                reason,
                stage_info: CASE_STAGES[new_stage]
            }
        });

        // Create notification for lawyer
        if (currentCase.lawyer_id) {
            await createNotification({
                userId: currentCase.lawyer_id,
                type: NOTIFICATION_TYPES.CASE_STAGE_UPDATE,
                title: 'تحديث مرحلة القضية',
                body: `تم تحديث مرحلة القضية ${currentCase.case_number || case_id} إلى: ${CASE_STAGES[new_stage].label_ar}`,
                priority: new_stage === 'update_required' ? NOTIFICATION_PRIORITY.HIGH : NOTIFICATION_PRIORITY.NORMAL,
                data: {
                    case_id,
                    new_stage,
                    previous_stage: previousStage
                }
            });
        }

        // Create notification for client (with modified stage name if needed)
        if (currentCase.client_id) {
            let clientStageLabel = CASE_STAGES[new_stage].label_ar;
            // Hide "update required" from client - show as "under review"
            if (new_stage === 'update_required') {
                clientStageLabel = 'قيد المراجعة';
            }

            await createNotification({
                userId: currentCase.client_id,
                type: NOTIFICATION_TYPES.CASE_STAGE_UPDATE,
                title: 'تحديث حالة قضيتك',
                body: `تم تحديث حالة قضيتك إلى: ${clientStageLabel}`,
                priority: NOTIFICATION_PRIORITY.NORMAL,
                data: {
                    case_id,
                    new_stage: new_stage === 'update_required' ? 'under_review' : new_stage
                }
            });
        }

        res.json({
            success: true,
            message: "Case stage updated successfully",
            data: {
                case_id,
                previous_stage: previousStage,
                new_stage,
                stage_info: CASE_STAGES[new_stage],
                updated_at: updateData.stage_updated_at
            }
        });

    } catch (error) {
        console.error("Error updating case stage:", error);
        res.status(500).json({
            error: "Failed to update case stage",
            details: error.message
        });
    }
});

/**
 * GET /api/court-clerk/cases/:case_id/stage-history
 * Get complete stage history for a case
 */
router.get("/cases/:case_id/stage-history", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id } = req.params;

        const { data: history, error } = await supabase
            .from("case_stages_history")
            .select(`
                *,
                clerk:users!changed_by(full_name)
            `)
            .eq("case_id", case_id)
            .order("changed_at", { ascending: false });

        if (error) throw error;

        // Add stage info to each history entry
        const enrichedHistory = history.map(entry => ({
            ...entry,
            previous_stage_info: CASE_STAGES[entry.previous_stage] || null,
            new_stage_info: CASE_STAGES[entry.new_stage] || null
        }));

        res.json({
            success: true,
            data: enrichedHistory
        });

    } catch (error) {
        console.error("Error fetching stage history:", error);
        res.status(500).json({
            error: "Failed to fetch stage history",
            details: error.message
        });
    }
});

// ============================================
// 11. EXECUTION MANAGEMENT
// ============================================

/**
 * POST /api/court-clerk/cases/:case_id/execution
 * Record execution action for a case
 */
router.post("/cases/:case_id/execution", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id } = req.params;
        const { action_type, description, amount_executed, remaining_amount, documents } = req.body;
        const clerkId = req.clerk.user_id;

        // Validate case exists and is in execution stage
        const { data: caseData, error: caseError } = await supabase
            .from("cases")
            .select("case_id, case_stage, lawyer_id, client_id")
            .eq("case_id", case_id)
            .single();

        if (caseError || !caseData) {
            return res.status(404).json({ error: "Case not found" });
        }

        if (caseData.case_stage !== 'in_execution' && caseData.case_stage !== 'judgment_issued') {
            return res.status(400).json({
                error: "Case must be in execution or judgment issued stage"
            });
        }

        // Insert execution action
        const { data: execution, error: insertError } = await supabase
            .from("execution_actions")
            .insert({
                case_id,
                action_type,
                description,
                amount_executed,
                remaining_amount,
                documents,
                performed_by: clerkId,
                performed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Update case stage to in_execution if not already
        if (caseData.case_stage !== 'in_execution') {
            await supabase
                .from("cases")
                .update({
                    case_stage: 'in_execution',
                    stage_updated_at: new Date().toISOString()
                })
                .eq("case_id", case_id);
        }

        // Check if fully executed
        if (remaining_amount === 0 || action_type === 'full_execution') {
            await supabase
                .from("cases")
                .update({
                    case_stage: 'fully_executed',
                    stage_updated_at: new Date().toISOString(),
                    execution_completed_at: new Date().toISOString()
                })
                .eq("case_id", case_id);
        }

        // Log action
        await logClerkAction(supabase, {
            action_type: 'execution_action',
            performed_by: clerkId,
            case_id,
            details: {
                execution_id: execution.id,
                action_type,
                amount_executed,
                remaining_amount
            }
        });

        // Notify lawyer
        if (caseData.lawyer_id) {
            await createNotification({
                userId: caseData.lawyer_id,
                type: NOTIFICATION_TYPES.EXECUTION_UPDATE,
                title: 'تحديث التنفيذ',
                body: `تم تسجيل إجراء تنفيذ جديد: ${description}`,
                priority: NOTIFICATION_PRIORITY.HIGH,
                data: { case_id, execution_id: execution.id }
            });
        }

        res.json({
            success: true,
            message: "Execution action recorded successfully",
            data: execution
        });

    } catch (error) {
        console.error("Error recording execution:", error);
        res.status(500).json({
            error: "Failed to record execution action",
            details: error.message
        });
    }
});

/**
 * GET /api/court-clerk/cases/:case_id/execution-history
 * Get all execution actions for a case
 */
router.get("/cases/:case_id/execution-history", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id } = req.params;

        const { data: executions, error } = await supabase
            .from("execution_actions")
            .select(`
                *,
                performer:users!performed_by(full_name)
            `)
            .eq("case_id", case_id)
            .order("performed_at", { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: executions
        });

    } catch (error) {
        console.error("Error fetching execution history:", error);
        res.status(500).json({
            error: "Failed to fetch execution history",
            details: error.message
        });
    }
});

// ============================================
// 12. APPEAL MANAGEMENT
// ============================================

/**
 * POST /api/court-clerk/cases/:case_id/appeal
 * Record an appeal for a case
 */
router.post("/cases/:case_id/appeal", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id } = req.params;
        const { appeal_type, appeal_grounds, appeal_documents } = req.body;
        const clerkId = req.clerk.user_id;

        // Validate case exists and is in appeal period
        const { data: caseData, error: caseError } = await supabase
            .from("cases")
            .select("case_id, case_stage, appeal_deadline, lawyer_id, client_id")
            .eq("case_id", case_id)
            .single();

        if (caseError || !caseData) {
            return res.status(404).json({ error: "Case not found" });
        }

        if (caseData.case_stage !== 'appeal_period' && caseData.case_stage !== 'judgment_issued') {
            return res.status(400).json({
                error: "Case must be in appeal period or judgment issued stage"
            });
        }

        // Check if appeal deadline has passed
        if (caseData.appeal_deadline && new Date(caseData.appeal_deadline) < new Date()) {
            return res.status(400).json({
                error: "Appeal deadline has passed"
            });
        }

        // Insert appeal record
        const { data: appeal, error: insertError } = await supabase
            .from("case_appeals")
            .insert({
                case_id,
                appeal_type,
                appeal_grounds,
                appeal_documents,
                submitted_by: clerkId,
                submitted_at: new Date().toISOString(),
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Log action
        await logClerkAction(supabase, {
            action_type: 'appeal_recorded',
            performed_by: clerkId,
            case_id,
            details: {
                appeal_id: appeal.id,
                appeal_type,
                appeal_grounds
            }
        });

        // Notify parties
        if (caseData.lawyer_id) {
            await createNotification({
                userId: caseData.lawyer_id,
                type: NOTIFICATION_TYPES.APPEAL_SUBMITTED,
                title: 'تم تسجيل استئناف',
                body: `تم تسجيل استئناف جديد للقضية`,
                priority: NOTIFICATION_PRIORITY.HIGH,
                data: { case_id, appeal_id: appeal.id }
            });
        }

        res.json({
            success: true,
            message: "Appeal recorded successfully",
            data: appeal
        });

    } catch (error) {
        console.error("Error recording appeal:", error);
        res.status(500).json({
            error: "Failed to record appeal",
            details: error.message
        });
    }
});

// ============================================
// LAWYER NOTIFICATION ENDPOINTS
// ============================================

/**
 * POST /api/court-clerk/notifications/document-uploaded
 * Notify court clerk when lawyer uploads documents
 */
router.post("/notifications/document-uploaded", async (req, res) => {
    try {
        const { case_id, filing_id, document_type, document_count, lawyer_name } = req.body;

        // Get all court clerks to notify from users table
        const { data: clerks } = await supabase
            .from("users")
            .select("user_id")
            .eq("user_type", "court_clerk");

        // Create notification for each clerk
        if (clerks && clerks.length > 0) {
            for (const clerk of clerks) {
                await createNotification({
                    userId: clerk.user_id,
                    userType: 'court_clerk',
                    title: 'مستندات جديدة من المحامي',
                    message: `قام المحامي ${lawyer_name || ''} برفع ${document_count} ${document_type}`,
                    type: NOTIFICATION_TYPES.CASE_UPDATED,
                    relatedId: null,
                    relatedType: 'case',
                    priority: NOTIFICATION_PRIORITY.NORMAL,
                    actionUrl: filing_id ? `/court-clerk/filings/${filing_id}` : `/court-clerk/cases/${case_id}`
                });
            }
        }

        res.json({ success: true, message: "Notification sent" });

    } catch (error) {
        console.error("Error sending document notification:", error);
        res.status(500).json({ error: "Failed to send notification", details: error.message });
    }
});

/**
 * POST /api/court-clerk/notifications/postpone-request
 * Notify court clerk when lawyer requests postponement
 */
router.post("/notifications/postpone-request", async (req, res) => {
    try {
        const { case_id, hearing_id, reason, hearing_date, lawyer_name } = req.body;

        // Get all court clerks to notify from users table
        const { data: clerks } = await supabase
            .from("users")
            .select("user_id")
            .eq("user_type", "court_clerk");

        // Create notification for each clerk
        if (clerks && clerks.length > 0) {
            for (const clerk of clerks) {
                await createNotification({
                    userId: clerk.user_id,
                    userType: 'court_clerk',
                    title: 'طلب تأجيل جلسة',
                    message: `المحامي ${lawyer_name || ''} يطلب تأجيل جلسة ${hearing_date ? new Date(hearing_date).toLocaleDateString('ar-EG') : ''}. السبب: ${reason?.substring(0, 50)}...`,
                    type: NOTIFICATION_TYPES.HEARING_SCHEDULED,
                    relatedId: null,
                    relatedType: 'hearing',
                    priority: NOTIFICATION_PRIORITY.HIGH,
                    actionUrl: `/court-clerk/hearings`
                });
            }
        }

        // Add to timeline
        if (case_id) {
            await supabase.from("timeline_events").insert({
                case_id,
                event_type: 'request',
                title: 'طلب تأجيل جلسة',
                description: `سبب التأجيل: ${reason}`,
                visibility: 'internal'
            });
        }

        res.json({ success: true, message: "Postponement request notification sent" });

    } catch (error) {
        console.error("Error sending postpone notification:", error);
        res.status(500).json({ error: "Failed to send notification", details: error.message });
    }
});

/**
 * GET /api/court-clerk/cases/:case_id/lawyer-documents
 * Get all documents uploaded by lawyer for a case (from filing_attachments)
 */
router.get("/cases/:case_id/lawyer-documents", verifyCourtClerk, async (req, res) => {
    try {
        const { case_id } = req.params;

        // Get filing_id for this case
        const { data: filing } = await supabase
            .from("court_clerk_filings")
            .select("filing_id")
            .eq("case_id", case_id)
            .single();

        if (!filing) {
            return res.json({ success: true, data: [] });
        }

        // Get attachments uploaded by lawyer
        const { data: attachments, error } = await supabase
            .from("filing_attachments")
            .select("*")
            .eq("filing_id", filing.filing_id)
            .in("attachment_type", ['defense_memo', 'new_document', 'update_response'])
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching attachments:", error);
            return res.json({ success: true, data: [] });
        }

        res.json({ success: true, data: attachments || [] });

    } catch (error) {
        console.error("Error fetching lawyer documents:", error);
        res.status(500).json({ error: "Failed to fetch documents", details: error.message });
    }
});

/**
 * GET /api/court-clerk/postpone-requests
 * Get all postponement requests from timeline_events
 */
router.get("/postpone-requests", verifyCourtClerk, async (req, res) => {
    try {
        // Get postponement requests from timeline_events
        const { data: requests, error } = await supabase
            .from("timeline_events")
            .select(`
                *,
                case:cases(case_id, case_number, title)
            `)
            .eq("event_type", "postpone")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching requests:", error);
            return res.json({ success: true, data: [] });
        }

        res.json({ success: true, data: requests || [] });

    } catch (error) {
        console.error("Error fetching postponement requests:", error);
        res.status(500).json({ error: "Failed to fetch requests", details: error.message });
    }
});

// ============================================
// COURT FEES SYSTEM - نظام الرسوم
// ============================================

/**
 * Generate unique fee invoice number
 */
const generateFeeInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `FEE-${year}-${timestamp}`;
};

/**
 * POST /api/court-clerk/fees/issue
 * Issue a fee invoice for a case
 */
router.post("/fees/issue", verifyCourtClerk, async (req, res) => {
    try {
        const {
            case_id,
            filing_id,
            registration_fee,
            stamp_fee,
            justice_fund_fee,
            notification_fee,
            other_fees,
            other_fees_description
        } = req.body;
        const clerkId = req.clerk.user_id;

        // Calculate total
        const total_amount = (
            parseFloat(registration_fee || 0) +
            parseFloat(stamp_fee || 0) +
            parseFloat(justice_fund_fee || 0) +
            parseFloat(notification_fee || 0) +
            parseFloat(other_fees || 0)
        );

        if (total_amount <= 0) {
            return res.status(400).json({ error: "إجمالي الرسوم يجب أن يكون أكبر من صفر" });
        }

        // Check if fee already exists for this case
        const { data: existingFee } = await supabase
            .from("court_fees")
            .select("fee_id, fee_status")
            .eq("case_id", case_id)
            .not("fee_status", "eq", "cancelled")
            .single();

        if (existingFee) {
            return res.status(400).json({ error: "يوجد فاتورة رسوم سابقة لهذه القضية" });
        }

        // Generate invoice number
        const fee_invoice_number = generateFeeInvoiceNumber();

        // Create fee invoice
        const { data: fee, error } = await supabase
            .from("court_fees")
            .insert({
                case_id,
                filing_id,
                fee_invoice_number,
                registration_fee: registration_fee || 0,
                stamp_fee: stamp_fee || 0,
                justice_fund_fee: justice_fund_fee || 0,
                notification_fee: notification_fee || 0,
                other_fees: other_fees || 0,
                other_fees_description,
                total_amount,
                fee_status: 'issued',
                issued_by: clerkId,
                issued_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;

        // Update case stage to awaiting_fees
        await supabase
            .from("cases")
            .update({ case_stage: 'awaiting_fees', updated_at: new Date() })
            .eq("case_id", case_id);

        // Add timeline event
        await supabase.from("timeline_events").insert({
            case_id,
            event_type: 'fee_issued',
            author_id: clerkId,
            author_type: 'court_clerk',
            title: 'تم إصدار فاتورة الرسوم',
            description: `إجمالي الرسوم المستحقة: ${total_amount} شيكل`,
            visibility: 'all'
        });

        // Get case details to notify lawyer and client
        const { data: caseData } = await supabase
            .from("cases")
            .select("assigned_lawyer_id, client_id, title")
            .eq("case_id", case_id)
            .single();

        // Notify lawyer
        if (caseData?.assigned_lawyer_id) {
            await createNotification({
                userId: caseData.assigned_lawyer_id,
                userType: 'lawyer',
                title: 'تم إصدار فاتورة الرسوم',
                message: `تم إصدار فاتورة رسوم بمبلغ ${total_amount} شيكل للقضية. يرجى إبلاغ الموكل لسداد الرسوم.`,
                type: NOTIFICATION_TYPES.FEE_ISSUED,
                relatedId: case_id,
                relatedType: 'fee',
                priority: NOTIFICATION_PRIORITY.HIGH,
                actionUrl: `/lawyer/cases/${case_id}`
            });
        }

        // Notify client
        if (caseData?.client_id) {
            await createNotification({
                userId: caseData.client_id,
                userType: 'client',
                title: 'رسوم المحكمة مستحقة الدفع',
                message: `تم إصدار فاتورة رسوم بمبلغ ${total_amount} شيكل. يرجى سداد الرسوم لاستكمال تسجيل الدعوى.`,
                type: NOTIFICATION_TYPES.FEE_ISSUED,
                relatedId: case_id,
                relatedType: 'fee',
                priority: NOTIFICATION_PRIORITY.URGENT,
                actionUrl: `/client/court-fees`
            });
        }

        // Log action
        await logClerkAction(clerkId, 'issue_fee', `Fee invoice issued: ${fee_invoice_number}`, {
            case_id,
            fee_id: fee.fee_id,
            total_amount
        });

        res.json({
            success: true,
            message: "تم إصدار فاتورة الرسوم بنجاح",
            data: fee
        });

    } catch (error) {
        console.error("Error issuing fee:", error);
        res.status(500).json({ error: "Failed to issue fee", details: error.message });
    }
});

/**
 * GET /api/court-clerk/fees
 * Get all fee invoices
 */
router.get("/fees", verifyCourtClerk, async (req, res) => {
    try {
        const { status } = req.query;

        let query = supabase
            .from("court_fees")
            .select(`
                *,
                case:cases(case_id, case_number, title, case_type),
                filing:court_clerk_filings(filing_number, plaintiff_name, defendant_name)
            `)
            .order("created_at", { ascending: false });

        if (status) {
            query = query.eq("fee_status", status);
        }

        const { data: fees, error } = await query;

        if (error) throw error;

        res.json({ success: true, data: fees || [] });

    } catch (error) {
        console.error("Error fetching fees:", error);
        res.status(500).json({ error: "Failed to fetch fees", details: error.message });
    }
});

/**
 * GET /api/court-clerk/fees/:fee_id
 * Get single fee details
 */
router.get("/fees/:fee_id", verifyCourtClerk, async (req, res) => {
    try {
        const { fee_id } = req.params;

        const { data: fee, error } = await supabase
            .from("court_fees")
            .select(`
                *,
                case:cases(case_id, case_number, title, case_type, assigned_lawyer_id, client_id),
                filing:court_clerk_filings(*)
            `)
            .eq("fee_id", fee_id)
            .single();

        if (error) throw error;

        res.json({ success: true, data: fee });

    } catch (error) {
        console.error("Error fetching fee:", error);
        res.status(500).json({ error: "Failed to fetch fee", details: error.message });
    }
});

/**
 * GET /api/court-clerk/cases/:case_id/fees
 * Get fee for a specific case
 */
router.get("/cases/:case_id/fees", verifyCourtClerk, async (req, res) => {
    try {
        const case_id = parseInt(req.params.case_id);

        const { data: fee, error } = await supabase
            .from("court_fees")
            .select("*")
            .eq("case_id", case_id)
            .not("fee_status", "eq", "cancelled")
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({ success: true, data: fee || null });

    } catch (error) {
        console.error("Error fetching case fee:", error);
        res.status(500).json({ error: "Failed to fetch fee", details: error.message });
    }
});

/**
 * POST /api/court-clerk/fees/:fee_id/confirm
 * Confirm payment (by court clerk)
 */
router.post("/fees/:fee_id/confirm", verifyCourtClerk, async (req, res) => {
    try {
        const { fee_id } = req.params;
        const { confirmation_notes } = req.body;
        const clerkId = req.clerk.user_id;

        // Get fee details
        const { data: fee, error: fetchError } = await supabase
            .from("court_fees")
            .select("*, case:cases(case_id, assigned_lawyer_id, client_id, title)")
            .eq("fee_id", fee_id)
            .single();

        if (fetchError) throw fetchError;

        if (fee.fee_status !== 'paid') {
            return res.status(400).json({ error: "لا يمكن اعتماد فاتورة لم يتم دفعها" });
        }

        // Update fee status to confirmed
        const { error: updateError } = await supabase
            .from("court_fees")
            .update({
                fee_status: 'confirmed',
                confirmed_by: clerkId,
                confirmed_at: new Date(),
                confirmation_notes,
                updated_at: new Date()
            })
            .eq("fee_id", fee_id);

        if (updateError) throw updateError;

        // Update case stage to ready_for_registration
        await supabase
            .from("cases")
            .update({ case_stage: 'ready_for_registration', updated_at: new Date() })
            .eq("case_id", fee.case_id);

        // Add timeline event
        await supabase.from("timeline_events").insert({
            case_id: fee.case_id,
            event_type: 'fee_confirmed',
            author_id: clerkId,
            author_type: 'court_clerk',
            title: 'تم اعتماد دفع الرسوم',
            description: 'تم التحقق من الدفع واعتماده. القضية جاهزة للتسجيل الرسمي.',
            visibility: 'all'
        });

        // Notify lawyer
        if (fee.case?.assigned_lawyer_id) {
            await createNotification({
                userId: fee.case.assigned_lawyer_id,
                userType: 'lawyer',
                title: 'تم اعتماد دفع الرسوم',
                message: 'تم اعتماد دفع الرسوم. القضية جاهزة للتسجيل الرسمي.',
                type: NOTIFICATION_TYPES.FEE_CONFIRMED,
                relatedId: fee.case_id,
                relatedType: 'fee',
                priority: NOTIFICATION_PRIORITY.NORMAL,
                actionUrl: `/lawyer/cases/${fee.case_id}`
            });
        }

        // Notify client
        if (fee.case?.client_id) {
            await createNotification({
                userId: fee.case.client_id,
                userType: 'client',
                title: 'تم اعتماد دفع الرسوم',
                message: 'تم اعتماد دفع رسوم الدعوى بنجاح. سيتم تسجيل الدعوى رسمياً.',
                type: NOTIFICATION_TYPES.FEE_CONFIRMED,
                relatedId: fee.case_id,
                relatedType: 'fee',
                priority: NOTIFICATION_PRIORITY.NORMAL,
                actionUrl: `/client/cases/${fee.case_id}`
            });
        }

        // Log action
        await logClerkAction(clerkId, 'confirm_fee_payment', `Fee payment confirmed: ${fee.fee_invoice_number}`, {
            fee_id,
            case_id: fee.case_id
        });

        res.json({
            success: true,
            message: "تم اعتماد الدفع بنجاح"
        });

    } catch (error) {
        console.error("Error confirming fee:", error);
        res.status(500).json({ error: "Failed to confirm fee", details: error.message });
    }
});

/**
 * GET /api/court-clerk/fees/pending-confirmation
 * Get fees awaiting confirmation
 */
router.get("/fees/pending-confirmation", verifyCourtClerk, async (req, res) => {
    try {
        const { data: fees, error } = await supabase
            .from("court_fees")
            .select(`
                *,
                case:cases(case_id, case_number, title),
                filing:court_clerk_filings(filing_number, plaintiff_name)
            `)
            .eq("fee_status", "paid")
            .order("paid_at", { ascending: true });

        if (error) throw error;

        res.json({ success: true, data: fees || [] });

    } catch (error) {
        console.error("Error fetching pending fees:", error);
        res.status(500).json({ error: "Failed to fetch fees", details: error.message });
    }
});

// ============================================
// PUBLIC ENDPOINTS FOR CLIENT FEE PAYMENT
// ============================================

/**
 * GET /api/court-clerk/public/fees/client/:client_id
 * Get all fees for a client (public - no auth required)
 */
router.get("/public/fees/client/:client_id", async (req, res) => {
    try {
        const client_id = req.params.client_id;

        // Get cases where client is involved
        const { data: cases } = await supabase
            .from("cases")
            .select("case_id")
            .eq("client_id", client_id);

        if (!cases || cases.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const caseIds = cases.map(c => c.case_id);

        // Get fees for these cases
        const { data: fees, error } = await supabase
            .from("court_fees")
            .select(`
                *,
                case:cases(case_id, case_number, title, case_type)
            `)
            .in("case_id", caseIds)
            .not("fee_status", "eq", "cancelled")
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json({ success: true, data: fees || [] });

    } catch (error) {
        console.error("Error fetching client fees:", error);
        res.status(500).json({ error: "Failed to fetch fees", details: error.message });
    }
});

/**
 * POST /api/court-clerk/public/fees/:fee_id/pay
 * Client submits payment (uploads receipt)
 */
router.post("/public/fees/:fee_id/pay", async (req, res) => {
    try {
        const { fee_id } = req.params;
        const {
            payment_reference,
            client_id
        } = req.body;

        // Get fee details
        const { data: fee, error: fetchError } = await supabase
            .from("court_fees")
            .select("*, case:cases(case_id, assigned_lawyer_id, client_id, title)")
            .eq("fee_id", fee_id)
            .single();

        if (fetchError) throw fetchError;

        if (!fee) {
            return res.status(404).json({ error: "لم يتم العثور على الفاتورة" });
        }

        if (fee.fee_status !== 'issued') {
            return res.status(400).json({ error: "هذه الفاتورة لا تحتاج للدفع" });
        }

        // Verify client owns this fee
        if (fee.case?.client_id !== client_id) {
            return res.status(403).json({ error: "غير مصرح لك بالوصول لهذه الفاتورة" });
        }

        // Update fee to paid status
        const { error: updateError } = await supabase
            .from("court_fees")
            .update({
                fee_status: 'paid',
                paid_at: new Date(),
                payment_reference: payment_reference || null,
                paid_by: client_id,
                updated_at: new Date()
            })
            .eq("fee_id", fee_id);

        if (updateError) throw updateError;

        // Add timeline event
        await supabase.from("timeline_events").insert({
            case_id: fee.case_id,
            event_type: 'fee_paid',
            author_id: client_id,
            author_type: 'client',
            title: 'تم دفع الرسوم',
            description: `تم دفع رسوم الدعوى بمبلغ ${fee.total_amount} شيكل. بانتظار اعتماد قلم المحكمة.`,
            visibility: 'all'
        });

        // Notify court clerks
        const { data: clerks } = await supabase
            .from("users")
            .select("user_id")
            .eq("user_type", "court_clerk");

        if (clerks && clerks.length > 0) {
            for (const clerk of clerks) {
                await createNotification({
                    userId: clerk.user_id,
                    userType: 'court_clerk',
                    title: 'تم دفع رسوم - بانتظار الاعتماد',
                    message: `تم دفع رسوم الدعوى رقم ${fee.case?.case_number || fee.case_id}. يرجى مراجعة الإيصال واعتماد الدفع.`,
                    type: NOTIFICATION_TYPES.FEE_PAID,
                    relatedId: fee.case_id,
                    relatedType: 'fee',
                    priority: NOTIFICATION_PRIORITY.HIGH,
                    actionUrl: `/court-clerk/fees`
                });
            }
        }

        // Notify lawyer
        if (fee.case?.assigned_lawyer_id) {
            await createNotification({
                userId: fee.case.assigned_lawyer_id,
                userType: 'lawyer',
                title: 'تم دفع رسوم الدعوى',
                message: 'تم دفع رسوم الدعوى من قبل الموكل. بانتظار اعتماد قلم المحكمة.',
                type: NOTIFICATION_TYPES.FEE_PAID,
                relatedId: fee.case_id,
                relatedType: 'fee',
                priority: NOTIFICATION_PRIORITY.NORMAL,
                actionUrl: `/lawyer/cases/${fee.case_id}`
            });
        }

        res.json({
            success: true,
            message: "تم تسجيل الدفع بنجاح. سيقوم قلم المحكمة بمراجعة واعتماد الدفع."
        });

    } catch (error) {
        console.error("Error processing fee payment:", error);
        res.status(500).json({ error: "Failed to process payment", details: error.message });
    }
});

/**
 * GET /api/court-clerk/public/fees/:fee_id
 * Get single fee details (for client view)
 */
router.get("/public/fees/:fee_id", async (req, res) => {
    try {
        const { fee_id } = req.params;

        const { data: fee, error } = await supabase
            .from("court_fees")
            .select(`
                *,
                case:cases(case_id, case_number, title, case_type)
            `)
            .eq("fee_id", fee_id)
            .single();

        if (error) throw error;

        res.json({ success: true, data: fee });

    } catch (error) {
        console.error("Error fetching fee:", error);
        res.status(500).json({ error: "Failed to fetch fee", details: error.message });
    }
});

// ============================================
// APPEALS MANAGEMENT - إدارة الاستئنافات
// ============================================

// مراحل الاستئناف (10 مراحل)
const APPEAL_STAGES = {
    appeal_submitted: { order: 1, label_ar: 'تم تقديم الاستئناف', label_en: 'Appeal Submitted' },
    appeal_under_review: { order: 2, label_ar: 'قيد المراجعة', label_en: 'Under Review' },
    appeal_update_required: { order: 3, label_ar: 'مطلوب تعديل', label_en: 'Update Required' },
    appeal_accepted: { order: 4, label_ar: 'تم قبول الاستئناف', label_en: 'Appeal Accepted' },
    appeal_rejected: { order: 5, label_ar: 'تم رفض الاستئناف', label_en: 'Appeal Rejected' },
    appeal_file_transferred: { order: 6, label_ar: 'تم إحالة الملف', label_en: 'File Transferred' },
    appeal_hearing_scheduled: { order: 7, label_ar: 'تم تحديد جلسة', label_en: 'Hearing Scheduled' },
    appeal_hearings_ongoing: { order: 8, label_ar: 'جلسات جارية', label_en: 'Hearings Ongoing' },
    appeal_decision_issued: { order: 9, label_ar: 'صدر حكم الاستئناف', label_en: 'Decision Issued' },
    appeal_case_closed: { order: 10, label_ar: 'انتهت القضية', label_en: 'Case Closed' }
};

// Helper: Generate Appeal Number
const generateAppealNumber = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase
        .from('appeals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`);

    const num = (count || 0) + 1;
    return `APP-${year}-${String(num).padStart(4, '0')}`;
};

// Helper: Update Appeal Stage
const updateAppealStage = async (appeal_id, new_stage, changed_by, reason = '') => {
    const { data: currentAppeal } = await supabase
        .from('appeals')
        .select('appeal_stage')
        .eq('appeal_id', appeal_id)
        .single();

    const previous_stage = currentAppeal?.appeal_stage;

    // Update appeal stage
    await supabase
        .from('appeals')
        .update({ appeal_stage: new_stage, updated_at: new Date() })
        .eq('appeal_id', appeal_id);

    // Log stage change
    await supabase.from('appeal_stages_history').insert({
        appeal_id,
        previous_stage,
        new_stage,
        changed_by,
        changed_by_type: 'court_clerk',
        reason
    });

    return { previous_stage, new_stage };
};

/**
 * POST /api/court-clerk/public/appeals/submit
 * المحامي يقدم استئناف (public endpoint)
 */
router.post("/public/appeals/submit", async (req, res) => {
    try {
        const {
            original_case_id,
            original_decision_id,
            appeal_type,
            appeal_reasons,
            appeal_requests,
            appeal_documents,
            submitted_by,
            submitted_by_type
        } = req.body;

        console.log(`📝 Submitting appeal for case ${original_case_id}`);

        // Validate case exists and is in appeal_period
        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select('case_id, case_stage, case_number, title, assigned_lawyer_id, client_id')
            .eq('case_id', original_case_id)
            .single();

        if (caseError || !caseData) {
            return res.status(404).json({ error: 'القضية غير موجودة' });
        }

        if (caseData.case_stage !== 'appeal_period') {
            return res.status(400).json({ error: 'لا يمكن تقديم استئناف - القضية ليست في فترة الاستئناف' });
        }

        // Check if appeal already exists
        const { data: existingAppeal } = await supabase
            .from('appeals')
            .select('appeal_id')
            .eq('original_case_id', original_case_id)
            .not('appeal_stage', 'in', '(appeal_rejected,appeal_case_closed)')
            .maybeSingle();

        if (existingAppeal) {
            return res.status(400).json({ error: 'يوجد استئناف مقدم مسبقاً لهذه القضية' });
        }

        // Generate appeal number
        const appeal_number = await generateAppealNumber();

        // Create appeal
        const { data: appeal, error: insertError } = await supabase
            .from('appeals')
            .insert({
                original_case_id,
                original_decision_id: original_decision_id || null,
                appeal_number,
                appeal_type,
                appeal_reasons,
                appeal_requests: appeal_requests || null,
                appeal_documents: appeal_documents || [],
                submitted_by,
                submitted_by_type,
                appeal_stage: 'appeal_submitted'
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Add timeline event to original case
        await supabase.from('timeline_events').insert({
            case_id: original_case_id,
            event_type: 'appeal_submitted',
            author_id: submitted_by,
            author_type: submitted_by_type,
            title: 'تم تقديم استئناف',
            description: `تم تقديم استئناف برقم ${appeal_number}`,
            visibility: 'all'
        });

        // Notify court clerks
        const { data: clerks } = await supabase
            .from('users')
            .select('user_id')
            .eq('user_type', 'court_clerk');

        if (clerks && clerks.length > 0) {
            for (const clerk of clerks) {
                await createNotification({
                    userId: clerk.user_id,
                    userType: 'court_clerk',
                    title: 'استئناف جديد',
                    message: `تم تقديم استئناف جديد للقضية ${caseData.case_number || original_case_id}`,
                    type: NOTIFICATION_TYPES.APPEAL_SUBMITTED,
                    relatedId: original_case_id,
                    relatedType: 'appeal',
                    priority: NOTIFICATION_PRIORITY.HIGH,
                    actionUrl: '/court-clerk/appeals'
                });
            }
        }

        console.log(`✅ Appeal created: ${appeal_number}`);

        res.json({
            success: true,
            message: 'تم تقديم الاستئناف بنجاح',
            data: appeal
        });

    } catch (error) {
        console.error('Error submitting appeal:', error);
        res.status(500).json({ error: 'فشل في تقديم الاستئناف', details: error.message });
    }
});

/**
 * GET /api/court-clerk/appeals
 * قائمة جميع الاستئنافات (قلم المحكمة)
 */
router.get("/appeals", verifyCourtClerk, async (req, res) => {
    try {
        const { stage, page = 1, limit = 20 } = req.query;

        let query = supabase
            .from('appeals')
            .select(`
                *,
                original_case:cases(
                    case_id, 
                    case_number, 
                    title, 
                    case_type, 
                    assigned_lawyer_id, 
                    client_id,
                    assigned_lawyer:lawyers(lawyer_id, first_name, last_name, email)
                ),
                submitter:users!appeals_submitted_by_fkey(user_id, first_name, last_name, email)
            `)
            .order('submitted_at', { ascending: false });

        if (stage) {
            query = query.eq('appeal_stage', stage);
        }

        const { data: appeals, error } = await query;

        if (error) throw error;

        // Count by stage
        const stats = {
            pending: appeals?.filter(a => a.appeal_stage === 'appeal_submitted').length || 0,
            under_review: appeals?.filter(a => a.appeal_stage === 'appeal_under_review').length || 0,
            update_required: appeals?.filter(a => a.appeal_stage === 'appeal_update_required').length || 0,
            accepted: appeals?.filter(a => a.appeal_stage === 'appeal_accepted').length || 0,
            rejected: appeals?.filter(a => a.appeal_stage === 'appeal_rejected').length || 0,
            ongoing: appeals?.filter(a => ['appeal_file_transferred', 'appeal_hearing_scheduled', 'appeal_hearings_ongoing'].includes(a.appeal_stage)).length || 0,
            completed: appeals?.filter(a => ['appeal_decision_issued', 'appeal_case_closed'].includes(a.appeal_stage)).length || 0
        };

        res.json({ success: true, data: appeals || [], stats });

    } catch (error) {
        console.error('Error fetching appeals:', error);
        res.status(500).json({ error: 'فشل في تحميل الاستئنافات', details: error.message });
    }
});

/**
 * GET /api/court-clerk/appeals/:appeal_id
 * تفاصيل استئناف واحد
 */
router.get("/appeals/:appeal_id", verifyCourtClerk, async (req, res) => {
    try {
        const { appeal_id } = req.params;

        const { data: appeal, error } = await supabase
            .from('appeals')
            .select(`
                *,
                original_case:cases(
                    *,
                    assigned_lawyer:lawyers(lawyer_id, first_name, last_name, email)
                ),
                original_decision:court_decisions(*),
                submitter:users!appeals_submitted_by_fkey(user_id, first_name, last_name, email),
                reviewer:users!appeals_reviewed_by_fkey(user_id, first_name, last_name)
            `)
            .eq('appeal_id', appeal_id)
            .single();

        if (error) throw error;

        // Get stage history
        const { data: history } = await supabase
            .from('appeal_stages_history')
            .select('*')
            .eq('appeal_id', appeal_id)
            .order('created_at', { ascending: false });

        // Get hearings
        const { data: hearings } = await supabase
            .from('appeal_hearings')
            .select('*')
            .eq('appeal_id', appeal_id)
            .order('hearing_date', { ascending: true });

        res.json({
            success: true,
            data: {
                ...appeal,
                stage_history: history || [],
                hearings: hearings || []
            }
        });

    } catch (error) {
        console.error('Error fetching appeal:', error);
        res.status(500).json({ error: 'فشل في تحميل تفاصيل الاستئناف', details: error.message });
    }
});

/**
 * POST /api/court-clerk/appeals/:appeal_id/review
 * مراجعة الاستئناف (قبول/رفض/طلب تعديل)
 */
router.post("/appeals/:appeal_id/review", verifyCourtClerk, async (req, res) => {
    try {
        const { appeal_id } = req.params;
        const { action, notes, rejection_reason, update_required_notes } = req.body;
        const clerkId = req.clerk.user_id;

        // Get appeal
        const { data: appeal, error: fetchError } = await supabase
            .from('appeals')
            .select('*, original_case:cases(case_id, case_number, assigned_lawyer_id, client_id)')
            .eq('appeal_id', appeal_id)
            .single();

        if (fetchError || !appeal) {
            return res.status(404).json({ error: 'الاستئناف غير موجود' });
        }

        let newStage = '';
        let notificationTitle = '';
        let notificationMessage = '';

        switch (action) {
            case 'start_review':
                newStage = 'appeal_under_review';
                notificationTitle = 'استئنافك قيد المراجعة';
                notificationMessage = 'جاري مراجعة استئنافك من قبل قلم المحكمة';
                break;

            case 'accept':
                newStage = 'appeal_accepted';
                notificationTitle = 'تم قبول استئنافك';
                notificationMessage = 'تم قبول استئنافك شكلياً وسيتم إحالته لمحكمة الاستئناف';
                await supabase.from('appeals').update({
                    accepted_at: new Date(),
                    accepted_by: clerkId
                }).eq('appeal_id', appeal_id);
                break;

            case 'reject':
                newStage = 'appeal_rejected';
                notificationTitle = 'تم رفض استئنافك';
                notificationMessage = `تم رفض استئنافك: ${rejection_reason}`;
                await supabase.from('appeals').update({
                    rejection_reason
                }).eq('appeal_id', appeal_id);
                // Update original case stage back to judgment_issued
                await supabase.from('cases').update({
                    case_stage: 'judgment_issued',
                    updated_at: new Date()
                }).eq('case_id', appeal.original_case_id);
                break;

            case 'request_update':
                newStage = 'appeal_update_required';
                notificationTitle = 'مطلوب تعديل على استئنافك';
                notificationMessage = update_required_notes;
                await supabase.from('appeals').update({
                    update_required_notes
                }).eq('appeal_id', appeal_id);
                break;

            default:
                return res.status(400).json({ error: 'إجراء غير صالح' });
        }

        // Update appeal stage
        await supabase.from('appeals').update({
            appeal_stage: newStage,
            reviewed_by: clerkId,
            reviewed_at: new Date(),
            review_notes: notes,
            updated_at: new Date()
        }).eq('appeal_id', appeal_id);

        // Log stage change
        await updateAppealStage(appeal_id, newStage, clerkId, notes || action);

        // Add timeline event
        await supabase.from('timeline_events').insert({
            case_id: appeal.original_case_id,
            event_type: `appeal_${action}`,
            author_id: clerkId,
            author_type: 'court_clerk',
            title: notificationTitle,
            description: notificationMessage,
            visibility: 'all'
        });

        // Notify lawyer
        if (appeal.original_case?.assigned_lawyer_id) {
            await createNotification({
                userId: appeal.original_case.assigned_lawyer_id,
                userType: 'lawyer',
                title: notificationTitle,
                message: notificationMessage,
                type: NOTIFICATION_TYPES.CASE_STAGE_UPDATE,
                relatedId: appeal.original_case_id,
                relatedType: 'appeal',
                priority: NOTIFICATION_PRIORITY.HIGH,
                actionUrl: `/lawyer/cases/${appeal.original_case_id}`
            });
        }

        // Log action
        await logClerkAction(clerkId, `appeal_${action}`, `Appeal ${action}: ${appeal.appeal_number}`, {
            appeal_id,
            original_case_id: appeal.original_case_id
        });

        res.json({
            success: true,
            message: 'تم تحديث حالة الاستئناف',
            data: { new_stage: newStage }
        });

    } catch (error) {
        console.error('Error reviewing appeal:', error);
        res.status(500).json({ error: 'فشل في مراجعة الاستئناف', details: error.message });
    }
});

/**
 * POST /api/court-clerk/appeals/:appeal_id/transfer
 * إحالة الاستئناف لمحكمة الاستئناف
 */
router.post("/appeals/:appeal_id/transfer", verifyCourtClerk, async (req, res) => {
    try {
        const { appeal_id } = req.params;
        const { transferred_to_court, appeal_court_case_number } = req.body;
        const clerkId = req.clerk.user_id;

        const { error } = await supabase
            .from('appeals')
            .update({
                appeal_stage: 'appeal_file_transferred',
                transferred_to_court,
                appeal_court_case_number,
                transferred_at: new Date(),
                updated_at: new Date()
            })
            .eq('appeal_id', appeal_id);

        if (error) throw error;

        await updateAppealStage(appeal_id, 'appeal_file_transferred', clerkId, `تم الإحالة إلى ${transferred_to_court}`);

        res.json({ success: true, message: 'تم إحالة الملف بنجاح' });

    } catch (error) {
        console.error('Error transferring appeal:', error);
        res.status(500).json({ error: 'فشل في إحالة الاستئناف', details: error.message });
    }
});

/**
 * POST /api/court-clerk/appeals/:appeal_id/schedule-hearing
 * جدولة جلسة استئناف
 */
router.post("/appeals/:appeal_id/schedule-hearing", verifyCourtClerk, async (req, res) => {
    try {
        const { appeal_id } = req.params;
        const { hearing_date, hearing_time, hearing_room, hearing_type, assigned_judge } = req.body;
        const clerkId = req.clerk.user_id;

        // Get appeal
        const { data: appeal } = await supabase
            .from('appeals')
            .select('*, original_case:cases(assigned_lawyer_id, client_id)')
            .eq('appeal_id', appeal_id)
            .single();

        // Count existing hearings
        const { count } = await supabase
            .from('appeal_hearings')
            .select('*', { count: 'exact', head: true })
            .eq('appeal_id', appeal_id);

        // Create hearing
        const { data: hearing, error } = await supabase
            .from('appeal_hearings')
            .insert({
                appeal_id,
                hearing_number: (count || 0) + 1,
                hearing_date,
                hearing_time,
                hearing_room,
                hearing_type: hearing_type || 'continuation',
                created_by: clerkId
            })
            .select()
            .single();

        if (error) throw error;

        // Update appeal stage and first hearing info
        const isFirstHearing = (count || 0) === 0;
        const updates = {
            appeal_stage: isFirstHearing ? 'appeal_hearing_scheduled' : 'appeal_hearings_ongoing',
            updated_at: new Date()
        };
        if (isFirstHearing) {
            updates.first_hearing_date = hearing_date;
            updates.first_hearing_time = hearing_time;
            updates.hearing_room = hearing_room;
            if (assigned_judge) updates.assigned_judge = assigned_judge;
        }

        await supabase.from('appeals').update(updates).eq('appeal_id', appeal_id);

        await updateAppealStage(appeal_id, updates.appeal_stage, clerkId, `جلسة بتاريخ ${hearing_date}`);

        // Notify lawyer
        if (appeal?.original_case?.assigned_lawyer_id) {
            await createNotification({
                userId: appeal.original_case.assigned_lawyer_id,
                userType: 'lawyer',
                title: 'جلسة استئناف مجدولة',
                message: `تم تحديد جلسة استئناف بتاريخ ${hearing_date}`,
                type: NOTIFICATION_TYPES.HEARING_SCHEDULED,
                relatedId: appeal.original_case_id,
                relatedType: 'appeal_hearing',
                priority: NOTIFICATION_PRIORITY.HIGH,
                actionUrl: `/lawyer/cases/${appeal.original_case_id}`
            });
        }

        res.json({ success: true, data: hearing });

    } catch (error) {
        console.error('Error scheduling appeal hearing:', error);
        res.status(500).json({ error: 'فشل في جدولة الجلسة', details: error.message });
    }
});

/**
 * POST /api/court-clerk/appeals/:appeal_id/decision
 * إصدار حكم الاستئناف
 */
router.post("/appeals/:appeal_id/decision", verifyCourtClerk, async (req, res) => {
    try {
        const { appeal_id } = req.params;
        const {
            appeal_decision_type, // upheld, modified, overturned, remanded
            appeal_decision_summary,
            appeal_decision_date,
            appeal_decision_file_url
        } = req.body;
        const clerkId = req.clerk.user_id;

        // Get appeal
        const { data: appeal } = await supabase
            .from('appeals')
            .select('*, original_case:cases(case_id, assigned_lawyer_id, client_id)')
            .eq('appeal_id', appeal_id)
            .single();

        // Update appeal with decision
        const { error } = await supabase
            .from('appeals')
            .update({
                appeal_stage: 'appeal_decision_issued',
                appeal_decision_type,
                appeal_decision_summary,
                appeal_decision_date,
                appeal_decision_file_url,
                updated_at: new Date()
            })
            .eq('appeal_id', appeal_id);

        if (error) throw error;

        await updateAppealStage(appeal_id, 'appeal_decision_issued', clerkId, `حكم الاستئناف: ${appeal_decision_type}`);

        // Update original case based on decision
        let originalCaseStage = 'in_execution'; // Default
        if (appeal_decision_type === 'remanded') {
            originalCaseStage = 'hearings_ongoing'; // إعادة للمحكمة الأدنى
        }

        await supabase.from('cases').update({
            case_stage: originalCaseStage,
            updated_at: new Date()
        }).eq('case_id', appeal.original_case_id);

        // Add timeline event
        const decisionLabels = {
            upheld: 'تأييد الحكم',
            modified: 'تعديل الحكم',
            overturned: 'إلغاء الحكم',
            remanded: 'إعادة للمحكمة الأدنى'
        };

        await supabase.from('timeline_events').insert({
            case_id: appeal.original_case_id,
            event_type: 'appeal_decision',
            author_id: clerkId,
            author_type: 'court_clerk',
            title: 'صدر حكم الاستئناف',
            description: `حكم الاستئناف: ${decisionLabels[appeal_decision_type] || appeal_decision_type}`,
            visibility: 'all'
        });

        // Notify lawyer and client
        if (appeal.original_case?.assigned_lawyer_id) {
            await createNotification({
                userId: appeal.original_case.assigned_lawyer_id,
                userType: 'lawyer',
                title: 'صدر حكم الاستئناف',
                message: `صدر حكم الاستئناف: ${decisionLabels[appeal_decision_type]}`,
                type: NOTIFICATION_TYPES.DECISION_ISSUED,
                relatedId: appeal.original_case_id,
                relatedType: 'appeal',
                priority: NOTIFICATION_PRIORITY.URGENT,
                actionUrl: `/lawyer/cases/${appeal.original_case_id}`
            });
        }

        res.json({ success: true, message: 'تم إصدار حكم الاستئناف' });

    } catch (error) {
        console.error('Error issuing appeal decision:', error);
        res.status(500).json({ error: 'فشل في إصدار الحكم', details: error.message });
    }
});

/**
 * POST /api/court-clerk/appeals/:appeal_id/close
 * إغلاق قضية الاستئناف وتحديث القضية الأساسية إلى "مُنفذة بالكامل"
 */
router.post("/appeals/:appeal_id/close", verifyCourtClerk, async (req, res) => {
    try {
        const { appeal_id } = req.params;
        const clerkId = req.clerk.user_id;

        // Get appeal info to get original case ID
        const { data: appeal, error: appealError } = await supabase
            .from('appeals')
            .select('original_case_id')
            .eq('appeal_id', appeal_id)
            .single();

        if (appealError) throw appealError;

        // Update appeal status to closed
        await supabase.from('appeals').update({
            appeal_stage: 'appeal_case_closed',
            updated_at: new Date()
        }).eq('appeal_id', appeal_id);

        // Update original case status to fully executed
        if (appeal.original_case_id) {
            // Get case details for notifications
            const { data: caseData } = await supabase
                .from('cases')
                .select('case_number, assigned_lawyer_id, client_id')
                .eq('case_id', appeal.original_case_id)
                .single();

            await supabase.from('cases').update({
                case_stage: 'fully_executed',
                updated_at: new Date()
            }).eq('case_id', appeal.original_case_id);

            // Add case stage history
            await supabase.from('case_stages_history').insert({
                case_id: appeal.original_case_id,
                old_stage: null, // We don't track old stage here
                new_stage: 'fully_executed',
                changed_by: clerkId,
                reason: 'تم إنهاء الاستئناف - القضية منفذة بالكامل',
                created_at: new Date()
            });

            // Send notifications to lawyer and client
            const notifications = [];

            if (caseData?.assigned_lawyer_id) {
                notifications.push({
                    user_id: caseData.assigned_lawyer_id,
                    title: 'انتهت القضية بالكامل',
                    message: `تم إغلاق الاستئناف والانتهاء من تنفيذ القضية ${caseData.case_number} بالكامل`,
                    type: NOTIFICATION_TYPES.CASE_COMPLETED,
                    relatedId: appeal.original_case_id,
                    relatedType: 'case',
                    priority: NOTIFICATION_PRIORITY.HIGH,
                    actionUrl: `/lawyer/cases/${appeal.original_case_id}`
                });
            }

            if (caseData?.client_id) {
                notifications.push({
                    user_id: caseData.client_id,
                    title: 'انتهت قضيتك بالكامل',
                    message: `تم إغلاق الاستئناف والانتهاء من تنفيذ القضية ${caseData.case_number} بالكامل`,
                    type: NOTIFICATION_TYPES.CASE_COMPLETED,
                    relatedId: appeal.original_case_id,
                    relatedType: 'case',
                    priority: NOTIFICATION_PRIORITY.HIGH,
                    actionUrl: `/client/cases/${appeal.original_case_id}`
                });
            }

            if (notifications.length > 0) {
                await supabase.from('notifications').insert(notifications);
            }
        }

        await updateAppealStage(appeal_id, 'appeal_case_closed', clerkId, 'تم إغلاق قضية الاستئناف');

        res.json({ success: true, message: 'تم إغلاق قضية الاستئناف وتحديث حالة القضية إلى مُنفذة بالكامل' });

    } catch (error) {
        console.error('Error closing appeal:', error);
        res.status(500).json({ error: 'فشل في إغلاق الاستئناف', details: error.message });
    }
});

/**
 * GET /api/court-clerk/public/appeals/case/:case_id
 * الحصول على استئناف قضية معينة (للمحامي)
 */
router.get("/public/appeals/case/:case_id", async (req, res) => {
    try {
        const case_id = parseInt(req.params.case_id);

        const { data: appeal, error } = await supabase
            .from('appeals')
            .select(`
                *,
                original_case:cases(case_id, case_number, title)
            `)
            .eq('original_case_id', case_id)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        // Get stage history and hearings if appeal exists
        let history = [];
        let hearings = [];
        if (appeal) {
            // Get stage history
            const { data: historyData } = await supabase
                .from('appeal_stages_history')
                .select('*')
                .eq('appeal_id', appeal.appeal_id)
                .order('created_at', { ascending: false });
            history = historyData || [];

            // Get hearings
            const { data: hearingsData } = await supabase
                .from('appeal_hearings')
                .select('*')
                .eq('appeal_id', appeal.appeal_id)
                .order('hearing_date', { ascending: true });
            hearings = hearingsData || [];
        }

        res.json({
            success: true,
            data: appeal ? { ...appeal, stage_history: history, hearings: hearings } : null
        });

    } catch (error) {
        console.error('Error fetching case appeal:', error);
        res.status(500).json({ error: 'فشل في تحميل الاستئناف', details: error.message });
    }
});

/**
 * GET /api/court-clerk/appeals/stages
 * الحصول على مراحل الاستئناف
 */
router.get("/appeals/stages", async (req, res) => {
    res.json({ success: true, data: APPEAL_STAGES });
});

/**
 * POST /api/court-clerk/public/appeals/:appeal_id/submit-update
 * تقديم التعديلات المطلوبة من المحامي
 */
router.post("/public/appeals/:appeal_id/submit-update", async (req, res) => {
    try {
        const appeal_id = req.params.appeal_id; // UUID string
        const { update_response, additional_documents } = req.body;

        // Decode user from header (Base64 encoded with TextEncoder)
        let user = {};
        const userDataHeader = req.headers['x-user-data'];
        if (userDataHeader) {
            try {
                // Decode Base64 that was encoded with TextEncoder
                const binString = atob(userDataHeader);
                const bytes = Uint8Array.from(binString, (c) => c.codePointAt(0));
                const decoded = new TextDecoder().decode(bytes);
                user = JSON.parse(decoded);
            } catch (e) {
                console.error('Error decoding user data:', e);
                // Fallback: try simple base64
                try {
                    user = JSON.parse(Buffer.from(userDataHeader, 'base64').toString('utf-8'));
                } catch {
                    user = {};
                }
            }
        }

        console.log('📝 Appeal update - User:', user);

        // Get user ID - could be user_id, lawyer_id, or client_id depending on user type
        const userId = user.user_id || user.lawyer_id || user.client_id;

        if (!update_response?.trim()) {
            return res.status(400).json({ error: 'يرجى إدخال الرد على طلب التعديل' });
        }

        // Get current appeal
        const { data: appeal, error: fetchError } = await supabase
            .from('appeals')
            .select('*')
            .eq('appeal_id', appeal_id)
            .single();

        if (fetchError || !appeal) {
            return res.status(404).json({ error: 'الاستئناف غير موجود' });
        }

        // Skip permission check - allow direct access
        console.log('📝 Appeal update - Processing without permission check');

        // Merge new documents with existing
        const existingDocs = appeal.appeal_documents || [];
        const newDocs = additional_documents || [];
        const allDocs = [...existingDocs, ...newDocs];

        // Update appeal - move back to submitted for review
        const { data: updatedAppeal, error: updateError } = await supabase
            .from('appeals')
            .update({
                appeal_stage: 'appeal_submitted',
                appeal_documents: allDocs,
                update_response: update_response,
                update_submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('appeal_id', appeal_id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Add to stage history
        await supabase.from('appeal_stages_history').insert({
            appeal_id,
            previous_stage: 'appeal_update_required',
            new_stage: 'appeal_submitted',
            changed_by: user.user_id,
            reason: 'تم تقديم التعديلات المطلوبة',
            notes: update_response.substring(0, 200)
        });

        res.json({
            success: true,
            message: 'تم تقديم التعديلات بنجاح وسيتم مراجعتها',
            data: updatedAppeal
        });

    } catch (error) {
        console.error('Error submitting appeal update:', error);
        res.status(500).json({ error: 'فشل في تقديم التعديلات', details: error.message });
    }
});

// ============================================
// PROFILE MANAGEMENT
// ============================================

/**
 * PUT /api/court-clerk/profile
 * Update court clerk profile information
 */
router.put("/profile", verifyCourtClerk, async (req, res) => {
    try {
        const { first_name, last_name, email, phone, city } = req.body;
        const clerkId = req.clerk.user_id;

        // Update user profile in database
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({
                first_name,
                last_name,
                email,
                phone,
                city,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', clerkId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'تم تحديث الملف الشخصي بنجاح',
            data: updatedUser
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'فشل في تحديث الملف الشخصي', details: error.message });
    }
});

export default router;
