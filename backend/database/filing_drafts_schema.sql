-- =============================================
-- Filing Drafts Table
-- For saving incomplete filings as drafts
-- =============================================

CREATE TABLE IF NOT EXISTS filing_drafts (
    draft_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lawyer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Court Information
    court_name VARCHAR(255),
    city VARCHAR(100),
    court_type VARCHAR(100),
    
    -- Case Information
    filing_type VARCHAR(100),
    case_type VARCHAR(100),
    claim_value DECIMAL(15,2),
    relationship VARCHAR(255),
    case_subject TEXT,
    legal_requests TEXT,
    
    -- Plaintiff Information
    plaintiff_name VARCHAR(255),
    plaintiff_id_number VARCHAR(50),
    plaintiff_nationality VARCHAR(100),
    plaintiff_capacity VARCHAR(100),
    plaintiff_representative VARCHAR(255),
    plaintiff_address TEXT,
    plaintiff_phone VARCHAR(50),
    plaintiff_email VARCHAR(255),
    email_notifications BOOLEAN DEFAULT false,
    
    -- Defendant Information
    defendant_type VARCHAR(50),
    defendant_name VARCHAR(255),
    defendant_id_number VARCHAR(50),
    defendant_address TEXT,
    
    -- Attachments (stored as JSON)
    attachments_json JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookup by lawyer
CREATE INDEX IF NOT EXISTS idx_filing_drafts_lawyer_id ON filing_drafts(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_filing_drafts_updated_at ON filing_drafts(updated_at DESC);

-- RLS Policies
ALTER TABLE filing_drafts ENABLE ROW LEVEL SECURITY;

-- Lawyers can only see their own drafts
CREATE POLICY "Lawyers can view own drafts"
    ON filing_drafts
    FOR SELECT
    USING (auth.uid() = lawyer_id);

CREATE POLICY "Lawyers can insert own drafts"
    ON filing_drafts
    FOR INSERT
    WITH CHECK (auth.uid() = lawyer_id);

CREATE POLICY "Lawyers can update own drafts"
    ON filing_drafts
    FOR UPDATE
    USING (auth.uid() = lawyer_id);

CREATE POLICY "Lawyers can delete own drafts"
    ON filing_drafts
    FOR DELETE
    USING (auth.uid() = lawyer_id);

-- Service role can do everything
CREATE POLICY "Service role full access to drafts"
    ON filing_drafts
    FOR ALL
    USING (auth.role() = 'service_role');
