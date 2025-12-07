-- ============================================
-- Court Clerk System - Database Schema
-- ============================================

-- 1. Court Clerk Filings (اللوائح المقدمة)
CREATE TABLE IF NOT EXISTS court_clerk_filings (
    filing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER REFERENCES cases(case_id) ON DELETE CASCADE,
    lawyer_id INTEGER REFERENCES lawyers(lawyer_id),
    client_id INTEGER REFERENCES users(user_id),
    
    -- Filing Details
    filing_number TEXT UNIQUE NOT NULL, -- رقم اللائحة الداخلي
    court_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    case_type VARCHAR(100) NOT NULL,
    
    -- Parties Information
    plaintiff_name TEXT NOT NULL, -- المدعي
    defendant_name TEXT NOT NULL, -- المدعى عليه
    plaintiff_id_number TEXT,
    defendant_id_number TEXT,
    
    -- Filing Content
    filing_summary TEXT NOT NULL, -- ملخص اللائحة
    legal_requests TEXT NOT NULL, -- الطلبات
    jurisdiction_info TEXT, -- الاختصاص القضائي
    
    -- Status & Stage
    filing_status VARCHAR(50) NOT NULL DEFAULT 'submitted' 
        CHECK (filing_status IN ('submitted', 'under_review', 'rejected', 'requested_update', 'ready_for_registration', 'registered')),
    
    -- Review Info
    reviewed_by INTEGER REFERENCES users(user_id), -- court_clerk user_id
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Registration Info
    registry_number TEXT UNIQUE, -- رقم القيد
    official_case_number TEXT UNIQUE, -- رقم الدعوى الرسمي
    registration_date DATE,
    court_fees NUMERIC(10, 2),
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_filings_case_id ON court_clerk_filings(case_id);
CREATE INDEX idx_filings_lawyer_id ON court_clerk_filings(lawyer_id);
CREATE INDEX idx_filings_status ON court_clerk_filings(filing_status);
CREATE INDEX idx_filings_submitted_at ON court_clerk_filings(submitted_at DESC);

-- 2. Filing Attachments (مرفقات اللائحة)
CREATE TABLE IF NOT EXISTS filing_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_id UUID REFERENCES court_clerk_filings(filing_id) ON DELETE CASCADE,
    
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- pdf, docx, image
    file_size BIGINT NOT NULL,
    attachment_type VARCHAR(100), -- وكالة، هوية، عقد، لائحة، بينة
    
    uploaded_by INTEGER NOT NULL,
    uploaded_by_type VARCHAR(20) NOT NULL CHECK (uploaded_by_type IN ('lawyer', 'court_clerk')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_filing_attachments_filing_id ON filing_attachments(filing_id);

-- 3. Filing Reviews (مراجعات الكاتب)
CREATE TABLE IF NOT EXISTS filing_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_id UUID REFERENCES court_clerk_filings(filing_id) ON DELETE CASCADE,
    
    reviewed_by INTEGER REFERENCES users(user_id) NOT NULL, -- court_clerk
    review_action VARCHAR(50) NOT NULL 
        CHECK (review_action IN ('accepted', 'rejected', 'requested_update', 'requested_documents')),
    
    review_notes TEXT,
    rejection_reason TEXT,
    requested_changes TEXT, -- التعديلات المطلوبة
    requested_documents TEXT, -- المستندات المطلوبة
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_filing_reviews_filing_id ON filing_reviews(filing_id);
CREATE INDEX idx_filing_reviews_clerk ON filing_reviews(reviewed_by);

-- 4. Service of Process (التبليغات)
CREATE TABLE IF NOT EXISTS service_of_process (
    service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER REFERENCES cases(case_id) ON DELETE CASCADE,
    filing_id UUID REFERENCES court_clerk_filings(filing_id),
    
    -- Service Details
    service_method VARCHAR(50) NOT NULL 
        CHECK (service_method IN ('bailiff', 'mail', 'publication', 'electronic')), -- محضر، بريد، نشر، إلكتروني
    
    defendant_name TEXT NOT NULL,
    defendant_address TEXT,
    defendant_phone TEXT,
    
    -- Service Attempts
    attempt_date DATE NOT NULL,
    attempt_result VARCHAR(50) NOT NULL 
        CHECK (attempt_result IN ('served', 'not_served', 'refused', 'pending')),
    
    -- Proof of Service
    proof_file_url TEXT,
    service_notes TEXT,
    
    -- Tracking
    created_by INTEGER REFERENCES users(user_id) NOT NULL, -- court_clerk
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_case_id ON service_of_process(case_id);
CREATE INDEX idx_service_filing_id ON service_of_process(filing_id);

-- 5. Court Hearings (الجلسات)
CREATE TABLE IF NOT EXISTS court_hearings (
    hearing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER REFERENCES cases(case_id) ON DELETE CASCADE,
    
    -- Hearing Details
    hearing_number INTEGER NOT NULL, -- رقم الجلسة (1، 2، 3...)
    hearing_type VARCHAR(50) NOT NULL 
        CHECK (hearing_type IN ('first_hearing', 'continuation', 'evidence', 'witness', 'final_hearing')),
    
    hearing_date DATE NOT NULL,
    hearing_time TIME NOT NULL,
    
    -- Status
    hearing_status VARCHAR(50) NOT NULL DEFAULT 'scheduled'
        CHECK (hearing_status IN ('scheduled', 'postponed', 'held', 'cancelled')),
    
    -- Results
    hearing_summary TEXT, -- ملخص الجلسة
    hearing_minutes_url TEXT, -- رابط محضر الجلسة PDF
    judge_notes TEXT, -- ملاحظات القاضي
    
    -- Next Hearing
    next_hearing_date DATE,
    postponement_reason TEXT,
    
    -- Tracking
    created_by INTEGER REFERENCES users(user_id) NOT NULL, -- court_clerk
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hearings_case_id ON court_hearings(case_id);
CREATE INDEX idx_hearings_date ON court_hearings(hearing_date);
CREATE INDEX idx_hearings_status ON court_hearings(hearing_status);

-- 6. Court Decisions (القرارات والأحكام)
CREATE TABLE IF NOT EXISTS court_decisions (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER REFERENCES cases(case_id) ON DELETE CASCADE,
    
    -- Decision Details
    decision_type VARCHAR(50) NOT NULL 
        CHECK (decision_type IN ('preliminary', 'interlocutory', 'final_judgment', 'court_order')),
    -- تمهيدي، قرار بالاستمرار، حكم نهائي، أمر محكمة
    
    decision_title TEXT NOT NULL,
    decision_summary TEXT NOT NULL,
    decision_file_url TEXT, -- ملف الحكم PDF
    
    -- Judgment Details
    ruling TEXT, -- منطوق الحكم
    in_favor_of VARCHAR(50), -- plaintiff / defendant / partial
    is_appealable BOOLEAN DEFAULT true, -- قابل للاستئناف؟
    appeal_deadline DATE, -- آخر موعد للاستئناف
    
    -- Dates
    decision_date DATE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Tracking
    created_by INTEGER REFERENCES users(user_id) NOT NULL, -- court_clerk or judge
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decisions_case_id ON court_decisions(case_id);
CREATE INDEX idx_decisions_type ON court_decisions(decision_type);
CREATE INDEX idx_decisions_date ON court_decisions(decision_date DESC);

-- 7. Case Stages History (سجل المراحل)
CREATE TABLE IF NOT EXISTS case_stages_history (
    stage_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER REFERENCES cases(case_id) ON DELETE CASCADE,
    
    -- Stage Info
    previous_stage VARCHAR(100),
    new_stage VARCHAR(100) NOT NULL,
    stage_reason TEXT, -- سبب الانتقال
    
    -- Changed By
    changed_by INTEGER REFERENCES users(user_id) NOT NULL,
    changed_by_type VARCHAR(20) NOT NULL CHECK (changed_by_type IN ('court_clerk', 'lawyer', 'admin', 'system')),
    
    -- Timestamps
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stages_history_case_id ON case_stages_history(case_id);
CREATE INDEX idx_stages_history_changed_at ON case_stages_history(changed_at DESC);

-- 8. Clerk Actions Log (سجل إجراءات الكاتب)
CREATE TABLE IF NOT EXISTS clerk_actions_log (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER REFERENCES cases(case_id),
    filing_id UUID REFERENCES court_clerk_filings(filing_id),
    
    -- Action Details
    action_type VARCHAR(100) NOT NULL,
    -- 'review_filing', 'accept_filing', 'reject_filing', 'request_update', 
    -- 'register_case', 'add_service', 'schedule_hearing', 'issue_decision'
    
    action_description TEXT NOT NULL,
    action_details JSONB, -- تفاصيل إضافية
    
    -- Performed By
    performed_by INTEGER REFERENCES users(user_id) NOT NULL, -- court_clerk
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clerk_actions_case_id ON clerk_actions_log(case_id);
CREATE INDEX idx_clerk_actions_filing_id ON clerk_actions_log(filing_id);
CREATE INDEX idx_clerk_actions_clerk ON clerk_actions_log(performed_by);
CREATE INDEX idx_clerk_actions_date ON clerk_actions_log(performed_at DESC);

-- 9. Update cases table to include case_stage
-- (إذا مش موجود)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'case_stage'
    ) THEN
        ALTER TABLE cases ADD COLUMN case_stage VARCHAR(100) DEFAULT 'filing_submitted'
            CHECK (case_stage IN (
                'filing_submitted',
                'under_review',
                'rejected',
                'requested_update',
                'ready_for_registration',
                'registered',
                'under_service',
                'awaiting_reply',
                'first_hearing_scheduled',
                'in_hearing',
                'decision_issued',
                'appeal_window',
                'closed'
            ));
    END IF;
END $$;

-- 10. Enable Row Level Security (RLS) - لكن خلي الـ policies فاضية
-- لأن الحماية في الـ Backend
ALTER TABLE court_clerk_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE filing_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE filing_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_of_process ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_stages_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE clerk_actions_log ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for service role
-- (Backend will handle authorization)
CREATE POLICY "Allow all for service role - filings" ON court_clerk_filings FOR ALL USING (true);
CREATE POLICY "Allow all for service role - attachments" ON filing_attachments FOR ALL USING (true);
CREATE POLICY "Allow all for service role - reviews" ON filing_reviews FOR ALL USING (true);
CREATE POLICY "Allow all for service role - service" ON service_of_process FOR ALL USING (true);
CREATE POLICY "Allow all for service role - hearings" ON court_hearings FOR ALL USING (true);
CREATE POLICY "Allow all for service role - decisions" ON court_decisions FOR ALL USING (true);
CREATE POLICY "Allow all for service role - stages" ON case_stages_history FOR ALL USING (true);
CREATE POLICY "Allow all for service role - actions" ON clerk_actions_log FOR ALL USING (true);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_filings_updated_at BEFORE UPDATE ON court_clerk_filings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_updated_at BEFORE UPDATE ON service_of_process
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hearings_updated_at BEFORE UPDATE ON court_hearings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON court_decisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate filing number
CREATE OR REPLACE FUNCTION generate_filing_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    filing_num TEXT;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(filing_number FROM 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM court_clerk_filings
    WHERE filing_number LIKE year_part || '%';
    
    filing_num := year_part || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN filing_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Initial Data / Views (Optional)
-- ============================================

-- View for Clerk Dashboard Statistics
CREATE OR REPLACE VIEW clerk_dashboard_stats AS
SELECT 
    COUNT(CASE WHEN filing_status = 'submitted' THEN 1 END) AS new_filings,
    COUNT(CASE WHEN filing_status = 'under_review' THEN 1 END) AS under_review,
    COUNT(CASE WHEN filing_status = 'ready_for_registration' THEN 1 END) AS ready_for_registration,
    (SELECT COUNT(*) FROM service_of_process WHERE attempt_result = 'pending') AS pending_service,
    (SELECT COUNT(*) FROM court_hearings WHERE hearing_date = CURRENT_DATE AND hearing_status = 'scheduled') AS hearings_today,
    (SELECT COUNT(*) FROM court_clerk_filings WHERE filing_status = 'requested_update') AS pending_updates
FROM court_clerk_filings;

COMMENT ON TABLE court_clerk_filings IS 'جدول اللوائح المقدمة إلكترونياً من المحامين';
COMMENT ON TABLE filing_reviews IS 'جدول مراجعات قلم المحكمة للوائح';
COMMENT ON TABLE service_of_process IS 'جدول التبليغات القضائية';
COMMENT ON TABLE court_hearings IS 'جدول الجلسات القضائية';
COMMENT ON TABLE court_decisions IS 'جدول القرارات والأحكام';
COMMENT ON TABLE case_stages_history IS 'سجل تاريخ مراحل القضية';
COMMENT ON TABLE clerk_actions_log IS 'سجل جميع إجراءات قلم المحكمة';
