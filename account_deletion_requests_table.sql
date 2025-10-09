-- Create account deletion requests table
CREATE TABLE account_deletion_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'lawyer')),
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by INTEGER REFERENCES admins(admin_id),
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_deletion_requests_user_id ON account_deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX idx_deletion_requests_requested_at ON account_deletion_requests(requested_at);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reviewed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deletion_requests_reviewed_at
BEFORE UPDATE ON account_deletion_requests
FOR EACH ROW
EXECUTE FUNCTION update_deletion_requests_updated_at();
