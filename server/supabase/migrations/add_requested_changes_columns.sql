-- ============================================
-- Add requested_changes and requested_documents columns
-- to court_clerk_filings table
-- ============================================

-- Add requested_changes column
ALTER TABLE court_clerk_filings 
ADD COLUMN IF NOT EXISTS requested_changes TEXT;

-- Add requested_documents column
ALTER TABLE court_clerk_filings 
ADD COLUMN IF NOT EXISTS requested_documents TEXT;

-- Add comment
COMMENT ON COLUMN court_clerk_filings.requested_changes IS 'التعديلات المطلوبة من قلم المحكمة';
COMMENT ON COLUMN court_clerk_filings.requested_documents IS 'المستندات المطلوبة من قلم المحكمة';

-- Fix filing_status check constraint to include update_required
ALTER TABLE court_clerk_filings 
DROP CONSTRAINT IF EXISTS court_clerk_filings_filing_status_check;

ALTER TABLE court_clerk_filings 
ADD CONSTRAINT court_clerk_filings_filing_status_check 
CHECK (filing_status IN ('submitted', 'under_review', 'rejected', 'update_required', 'ready_for_registration', 'registered'));
