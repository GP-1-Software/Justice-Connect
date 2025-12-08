-- =====================================================
-- Fix notifications table to support court_clerk user_type
-- =====================================================

-- Remove old constraint and add new one with court_clerk
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_user_type_check 
    CHECK (user_type IN ('client', 'lawyer', 'admin', 'court_clerk'));

-- Add priority and action_url columns if they don't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'bell';

-- Create index for court_clerk notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
