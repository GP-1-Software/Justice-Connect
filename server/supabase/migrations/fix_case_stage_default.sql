-- Fix case_stage default value to match new 14-stage system
-- Run this in Supabase SQL Editor

-- Change the default value from 'filing_submitted' to 'submitted'
ALTER TABLE cases ALTER COLUMN case_stage SET DEFAULT 'submitted';
