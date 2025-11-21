-- Add replies column to support_tickets table for multi-turn conversation
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN support_tickets.replies IS 'Array of reply objects with sender_type, sender_id, message, and created_at';

-- Example structure:
-- [
--   {
--     "sender_type": "admin",
--     "sender_id": 1,
--     "sender_name": "أحمد محمد",
--     "message": "شكراً على تواصلك، سنقوم بحل المشكلة",
--     "created_at": "2024-01-01T10:00:00Z"
--   },
--   {
--     "sender_type": "client",
--     "sender_id": 5,
--     "sender_name": "علي أحمد",
--     "message": "شكراً لكم، في انتظار الحل",
--     "created_at": "2024-01-01T11:00:00Z"
--   }
-- ]
