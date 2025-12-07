-- ============================================
-- Court Case Stages Migration
-- تحديث مراحل القضية إلى 14 مرحلة
-- ============================================

-- 0. حذف الـ VIEW القديم أولاً لتجنب مشاكل الأعمدة
DROP VIEW IF EXISTS clerk_dashboard_stats CASCADE;

-- 1. إزالة القيود القديمة أولاً (بدون DO block)
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_case_stage_check;
ALTER TABLE court_clerk_filings DROP CONSTRAINT IF EXISTS court_clerk_filings_filing_status_check;

-- 2. تحديث القيم القديمة للتوافق (قبل إضافة القيود الجديدة)
UPDATE cases SET case_stage = 'submitted' WHERE case_stage = 'filing_submitted';
UPDATE cases SET case_stage = 'service_in_progress' WHERE case_stage = 'under_service';
UPDATE cases SET case_stage = 'service_completed' WHERE case_stage = 'served';
UPDATE cases SET case_stage = 'first_hearing_scheduled' WHERE case_stage = 'first_hearing';
UPDATE cases SET case_stage = 'hearings_ongoing' WHERE case_stage IN ('in_hearing', 'in_hearings');
UPDATE cases SET case_stage = 'judgment_issued' WHERE case_stage = 'decision_issued';
UPDATE cases SET case_stage = 'fully_executed' WHERE case_stage IN ('closed', 'executed');
UPDATE cases SET case_stage = 'update_required' WHERE case_stage = 'requested_update';

UPDATE court_clerk_filings SET filing_status = 'update_required' WHERE filing_status = 'requested_update';

-- 3. إضافة القيود الجديدة بعد تحديث البيانات
ALTER TABLE cases ADD CONSTRAINT cases_case_stage_check 
    CHECK (case_stage IN (
        'submitted',
        'under_review',
        'update_required',
        'ready_for_registration',
        'registered',
        'service_in_progress',
        'service_completed',
        'awaiting_response',
        'first_hearing_scheduled',
        'hearings_ongoing',
        'judgment_issued',
        'appeal_period',
        'in_execution',
        'fully_executed'
    ));

ALTER TABLE court_clerk_filings ADD CONSTRAINT court_clerk_filings_filing_status_check 
    CHECK (filing_status IN (
        'submitted',
        'under_review',
        'rejected',
        'update_required',
        'ready_for_registration',
        'registered'
    ));

-- 4. إضافة أعمدة جديدة لـ cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cases ADD COLUMN IF NOT EXISTS response_deadline DATE; -- موعد انتهاء الرد
ALTER TABLE cases ADD COLUMN IF NOT EXISTS appeal_deadline DATE; -- موعد انتهاء الاستئناف
ALTER TABLE cases ADD COLUMN IF NOT EXISTS official_case_number TEXT; -- رقم الدعوى الرسمي

-- 4. إنشاء جدول إجراءات القضية (للأزرار الإضافية)
CREATE TABLE IF NOT EXISTS case_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER REFERENCES cases(case_id) ON DELETE CASCADE,
    
    -- تفاصيل الإجراء
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN (
        'upload_required_documents',   -- رفع المستندات المطلوبة
        'contact_court_clerk',         -- مراسلة قلم المحكمة
        'download_registration_receipt', -- تحميل إيصال التسجيل
        'track_service_status',        -- متابعة حالة التبليغ
        'request_service_speedup',     -- طلب تسريع التبليغ
        'remind_defendant',            -- تذكير المدعى عليه
        'upload_defense_memo',         -- رفع مذكرة دفاعية
        'upload_new_documents',        -- رفع مستندات جديدة
        'download_hearing_minutes',    -- تحميل محضر الجلسة
        'request_postponement',        -- طلب تأجيل الجلسة
        'download_judgment',           -- تحميل الحكم
        'submit_appeal',               -- تقديم استئناف
        'open_execution_file',         -- فتح ملف تنفيذ
        'submit_execution_request',    -- رفع طلب تنفيذي
        'track_execution',             -- متابعة التنفيذ
        'download_execution_notice',   -- تحميل إشعار التنفيذ
        'close_case'                   -- إغلاق القضية
    )),
    
    -- البيانات المرفقة
    action_data JSONB DEFAULT '{}',
    file_url TEXT,
    notes TEXT,
    
    -- من قام بالإجراء
    performed_by UUID NOT NULL,
    performed_by_type VARCHAR(20) NOT NULL CHECK (performed_by_type IN ('lawyer', 'court_clerk', 'client')),
    
    -- الحالة
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    
    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_case_actions_case_id ON case_actions(case_id);
CREATE INDEX idx_case_actions_type ON case_actions(action_type);
CREATE INDEX idx_case_actions_status ON case_actions(status);

-- 5. تحديث جدول case_stages_history
ALTER TABLE case_stages_history ADD COLUMN IF NOT EXISTS stage_metadata JSONB DEFAULT '{}';
ALTER TABLE case_stages_history ADD COLUMN IF NOT EXISTS auto_triggered BOOLEAN DEFAULT false;

-- السماح بـ NULL للـ changed_by لدعم التحديثات التلقائية
ALTER TABLE case_stages_history ALTER COLUMN changed_by DROP NOT NULL;

-- إزالة الـ foreign key constraint إذا كان موجوداً ليسمح بـ NULL
ALTER TABLE case_stages_history DROP CONSTRAINT IF EXISTS case_stages_history_changed_by_fkey;

-- 6. إنشاء function لتحديث المرحلة تلقائياً
CREATE OR REPLACE FUNCTION update_case_stage_with_history()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INTEGER;
    v_user_type TEXT;
BEGIN
    -- تسجيل التغيير في السجل
    IF OLD.case_stage IS DISTINCT FROM NEW.case_stage THEN
        -- محاولة الحصول على معرف المستخدم الحالي
        BEGIN
            v_user_id := current_setting('app.current_user_id', true)::INTEGER;
            -- التحقق من أن المستخدم موجود
            IF v_user_id IS NOT NULL AND v_user_id > 0 THEN
                PERFORM 1 FROM users WHERE user_id = v_user_id;
                IF NOT FOUND THEN
                    v_user_id := NULL;
                END IF;
            ELSE
                v_user_id := NULL;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_user_id := NULL;
        END;
        
        v_user_type := COALESCE(current_setting('app.current_user_type', true), 'system');
        
        -- إدخال السجل
        INSERT INTO case_stages_history (
            case_id,
            previous_stage,
            new_stage,
            stage_reason,
            changed_by,
            changed_by_type,
            auto_triggered
        ) VALUES (
            NEW.case_id,
            OLD.case_stage,
            NEW.case_stage,
            'Stage automatically updated',
            v_user_id,
            v_user_type,
            true
        );
        
        -- تحديث وقت المرحلة
        NEW.stage_updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للتحديث التلقائي
DROP TRIGGER IF EXISTS case_stage_change_trigger ON cases;
CREATE TRIGGER case_stage_change_trigger
    BEFORE UPDATE OF case_stage ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_case_stage_with_history();

-- 7. Function لحساب العد التنازلي
CREATE OR REPLACE FUNCTION get_countdown_days(deadline_date DATE)
RETURNS INTEGER AS $$
BEGIN
    IF deadline_date IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN GREATEST(0, deadline_date - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- 8. View محسن لإحصائيات لوحة التحكم
CREATE OR REPLACE VIEW clerk_dashboard_stats AS
SELECT 
    COUNT(CASE WHEN filing_status = 'submitted' THEN 1 END) AS new_filings,
    COUNT(CASE WHEN filing_status = 'under_review' THEN 1 END) AS under_review,
    COUNT(CASE WHEN filing_status = 'update_required' THEN 1 END) AS update_required,
    COUNT(CASE WHEN filing_status = 'ready_for_registration' THEN 1 END) AS ready_for_registration,
    COUNT(CASE WHEN filing_status = 'registered' THEN 1 END) AS registered,
    (SELECT COUNT(*) FROM service_of_process WHERE attempt_result = 'pending') AS pending_service,
    (SELECT COUNT(*) FROM court_hearings WHERE hearing_date = CURRENT_DATE AND hearing_status = 'scheduled') AS hearings_today,
    (SELECT COUNT(*) FROM cases WHERE case_stage = 'appeal_period' AND appeal_deadline >= CURRENT_DATE) AS in_appeal_period
FROM court_clerk_filings;

-- 9. إضافة RLS للجدول الجديد
ALTER TABLE case_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role - case_actions" ON case_actions;
CREATE POLICY "Allow all for service role - case_actions" ON case_actions FOR ALL USING (true);

-- 10. Trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_case_actions_updated_at ON case_actions;
CREATE TRIGGER update_case_actions_updated_at BEFORE UPDATE ON case_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE case_actions IS 'جدول إجراءات المحامي على القضية (رفع مستندات، طلبات، إلخ)';
