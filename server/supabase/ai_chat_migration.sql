-- Migration to fix ai_conversations schema
-- Run this in Supabase SQL Editor to update existing table

-- Remove NOT NULL constraints from user_id columns
ALTER TABLE public.ai_conversations 
  ALTER COLUMN client_user_id DROP NOT NULL;

ALTER TABLE public.ai_conversations 
  ALTER COLUMN lawyer_user_id DROP NOT NULL;

-- Add constraint to ensure at least one user_id is provided
ALTER TABLE public.ai_conversations 
  ADD CONSTRAINT check_has_user 
  CHECK (client_user_id IS NOT NULL OR lawyer_user_id IS NOT NULL);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ai_conversations'
ORDER BY ordinal_position;
