-- Migration: Add lawyer_response columns to court_clerk_filings
-- This allows storing the lawyer's response to update requests directly in the filing

-- Add lawyer_response column
ALTER TABLE court_clerk_filings 
ADD COLUMN IF NOT EXISTS lawyer_response TEXT;

-- Add lawyer_response_date column  
ALTER TABLE court_clerk_filings 
ADD COLUMN IF NOT EXISTS lawyer_response_date TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN court_clerk_filings.lawyer_response IS 'Lawyer response text when submitting updates';
COMMENT ON COLUMN court_clerk_filings.lawyer_response_date IS 'Date when lawyer submitted the response';

-- Optional: Expand event_type column in timeline_events to allow longer values
ALTER TABLE timeline_events ALTER COLUMN event_type TYPE varchar(50);

-- Optional: Add lawyer_response to filing_reviews check constraint
-- First drop the existing constraint
ALTER TABLE filing_reviews DROP CONSTRAINT IF EXISTS filing_reviews_review_action_check;

-- Add new constraint with lawyer_response included
ALTER TABLE filing_reviews ADD CONSTRAINT filing_reviews_review_action_check 
CHECK (review_action IN ('approved', 'rejected', 'requested_update', 'requested_documents', 'lawyer_response'));
