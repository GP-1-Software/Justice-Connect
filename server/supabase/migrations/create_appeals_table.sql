-- ============================================
-- Appeals System - نظام الاستئنافات
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- 1. Appeals Table (ملفات الاستئناف)
CREATE TABLE IF NOT EXISTS appeals (
    appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- الربط بالقضية الأصلية
    original_case_id INTEGER REFERENCES cases(case_id) ON DELETE CASCADE,
    original_decision_id UUID REFERENCES court_decisions(decision_id),
    
    -- رقم ملف الاستئناف
    appeal_number TEXT UNIQUE, -- APP-2025-0001
    
    -- معلومات الاستئناف
    appeal_type VARCHAR(50) NOT NULL, -- full_appeal, partial_appeal, cassation
    appeal_reasons TEXT NOT NULL, -- أسباب الاستئناف
    appeal_requests TEXT, -- طلبات المستأنف
    
    -- المستندات
    appeal_documents JSONB DEFAULT '[]', -- [{url, name, type}]
    
    -- مقدم الاستئناف
    submitted_by INTEGER REFERENCES users(user_id),
    submitted_by_type VARCHAR(20), -- lawyer, client
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- مرحلة الاستئناف (10 مراحل)
    appeal_stage VARCHAR(50) NOT NULL DEFAULT 'appeal_submitted'
        CHECK (appeal_stage IN (
            'appeal_submitted',           -- 1. تم تقديم الاستئناف
            'appeal_under_review',        -- 2. قيد المراجعة
            'appeal_update_required',     -- 3. مطلوب تعديل
            'appeal_accepted',            -- 4. تم قبول الاستئناف شكلياً
            'appeal_rejected',            -- 5. تم رفض الاستئناف
            'appeal_file_transferred',    -- 6. تم إحالة الملف لمحكمة الاستئناف
            'appeal_hearing_scheduled',   -- 7. تم تحديد جلسة استئناف
            'appeal_hearings_ongoing',    -- 8. جلسات استئناف جارية
            'appeal_decision_issued',     -- 9. صدر حكم الاستئناف
            'appeal_case_closed'          -- 10. انتهت القضية الاستئنافية
        )),
    
    -- تفاصيل المراجعة (قلم المحكمة)
    reviewed_by INTEGER REFERENCES users(user_id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    update_required_notes TEXT,
    update_response TEXT, -- رد المحامي على طلب التعديل
    update_submitted_at TIMESTAMPTZ, -- تاريخ تقديم التعديلات
    
    -- معلومات القبول
    accepted_at TIMESTAMPTZ,
    accepted_by INTEGER REFERENCES users(user_id),
    
    -- معلومات الإحالة
    transferred_to_court VARCHAR(100), -- اسم محكمة الاستئناف
    transferred_at TIMESTAMPTZ,
    appeal_court_case_number TEXT, -- رقم القضية في محكمة الاستئناف
    
    -- معلومات الجلسات
    first_hearing_date DATE,
    first_hearing_time TIME,
    hearing_room VARCHAR(50),
    assigned_judge VARCHAR(100),
    
    -- حكم الاستئناف
    appeal_decision_type VARCHAR(50), -- upheld, modified, overturned, remanded
    appeal_decision_summary TEXT,
    appeal_decision_date DATE,
    appeal_decision_file_url TEXT,
    
    -- الرسوم
    appeal_fees NUMERIC(10,2) DEFAULT 0,
    fees_paid BOOLEAN DEFAULT FALSE,
    fees_paid_at TIMESTAMPTZ,
    
    -- تتبع
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Appeal Stage History (سجل مراحل الاستئناف)
CREATE TABLE IF NOT EXISTS appeal_stages_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appeal_id UUID REFERENCES appeals(appeal_id) ON DELETE CASCADE,
    previous_stage VARCHAR(50),
    new_stage VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES users(user_id),
    changed_by_type VARCHAR(20),
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Appeal Hearings (جلسات الاستئناف)
CREATE TABLE IF NOT EXISTS appeal_hearings (
    hearing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appeal_id UUID REFERENCES appeals(appeal_id) ON DELETE CASCADE,
    hearing_number INTEGER DEFAULT 1,
    hearing_date DATE NOT NULL,
    hearing_time TIME,
    hearing_room VARCHAR(50),
    hearing_type VARCHAR(50), -- first, continuation, pleading, verdict
    hearing_notes TEXT,
    hearing_result TEXT, -- adjourned, completed, verdict_issued
    next_hearing_date DATE,
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appeals_original_case ON appeals(original_case_id);
CREATE INDEX IF NOT EXISTS idx_appeals_stage ON appeals(appeal_stage);
CREATE INDEX IF NOT EXISTS idx_appeals_submitted_by ON appeals(submitted_by);
CREATE INDEX IF NOT EXISTS idx_appeals_number ON appeals(appeal_number);
CREATE INDEX IF NOT EXISTS idx_appeal_history_appeal_id ON appeal_stages_history(appeal_id);
CREATE INDEX IF NOT EXISTS idx_appeal_hearings_appeal_id ON appeal_hearings(appeal_id);

-- RLS
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeal_stages_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeal_hearings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for service role - appeals" ON appeals;
CREATE POLICY "Allow all for service role - appeals" ON appeals FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for service role - appeal_history" ON appeal_stages_history;
CREATE POLICY "Allow all for service role - appeal_history" ON appeal_stages_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for service role - appeal_hearings" ON appeal_hearings;
CREATE POLICY "Allow all for service role - appeal_hearings" ON appeal_hearings FOR ALL USING (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_appeals_updated_at ON appeals;
CREATE TRIGGER update_appeals_updated_at 
    BEFORE UPDATE ON appeals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appeal_hearings_updated_at ON appeal_hearings;
CREATE TRIGGER update_appeal_hearings_updated_at 
    BEFORE UPDATE ON appeal_hearings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE appeals IS 'جدول ملفات الاستئناف';
COMMENT ON COLUMN appeals.appeal_stage IS 'مرحلة الاستئناف من 1-10';
COMMENT ON COLUMN appeals.appeal_decision_type IS 'upheld=تأييد الحكم, modified=تعديل, overturned=إلغاء, remanded=إعادة للمحكمة الأدنى';

-- ============================================
-- مراحل الاستئناف (10 مراحل):
-- ============================================
-- 1. appeal_submitted       - تم تقديم الاستئناف
-- 2. appeal_under_review    - قيد المراجعة في قلم المحكمة
-- 3. appeal_update_required - مطلوب تعديل من المحامي
-- 4. appeal_accepted        - تم قبول الاستئناف شكلياً
-- 5. appeal_rejected        - تم رفض الاستئناف
-- 6. appeal_file_transferred - تم إحالة الملف لمحكمة الاستئناف
-- 7. appeal_hearing_scheduled - تم تحديد جلسة استئناف
-- 8. appeal_hearings_ongoing - جلسات استئناف جارية
-- 9. appeal_decision_issued  - صدر حكم الاستئناف
-- 10. appeal_case_closed     - انتهت القضية الاستئنافية
-- ============================================
