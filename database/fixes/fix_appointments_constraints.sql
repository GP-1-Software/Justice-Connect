-- ============================================
-- Fix Appointments Table Constraints
-- ============================================
-- Created: Nov 1, 2025
-- Purpose: Remove or update check constraints that block appointment creation

-- ============================================
-- Step 1: Check existing constraints
-- ============================================
-- Run this first to see what constraints exist:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'appointments'::regclass AND contype = 'c';

-- ============================================
-- Step 2: Drop the problematic constraint
-- ============================================
-- This constraint is blocking appointments because it expects specific values
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_appointment_type_check;

-- ============================================
-- Step 3: Recreate constraint with correct values (Optional)
-- ============================================
-- If you want to keep validation, add the constraint with the correct values
-- Based on your lawyer_services table, the appointment_type should match service_name

-- Option A: No constraint (most flexible - recommended for now)
-- Just leave it without constraint

-- Option B: Add constraint with common values
-- Uncomment if you want to enforce specific values:
/*
ALTER TABLE appointments 
ADD CONSTRAINT appointments_appointment_type_check 
CHECK (
  appointment_type IN (
    'استشارة قانونية',
    'مراجعة قضية',
    'مراجعة مستندات',
    'مكالمة فيديو',
    'مقابلة شخصية',
    'مكالمة هاتفية',
    'consultation',
    'case_review',
    'document_review',
    'video_call',
    'in_person',
    'phone_call'
  )
);
*/

-- ============================================
-- Step 4: Check meeting_method constraint
-- ============================================
-- Also check if meeting_method has a constraint
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_meeting_method_check;

-- Optionally recreate with correct values:
/*
ALTER TABLE appointments 
ADD CONSTRAINT appointments_meeting_method_check 
CHECK (
  meeting_method IN (
    'video_call',
    'in_person',
    'phone_call',
    'مكالمة فيديو',
    'مقابلة شخصية',
    'مكالمة هاتفية'
  )
);
*/

-- ============================================
-- Step 5: Check status constraint
-- ============================================
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Recreate with all possible statuses:
ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (
  status IN (
    'scheduled',
    'confirmed',
    'pending',
    'completed',
    'cancelled',
    'rescheduled',
    'no_show'
  )
);

-- ============================================
-- Verification Query
-- ============================================
-- Check all constraints after changes:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'appointments'::regclass AND contype = 'c';

-- Test insert:
/*
INSERT INTO appointments (
  client_id, 
  lawyer_id, 
  appointment_date, 
  appointment_time, 
  duration_minutes, 
  appointment_type, 
  meeting_method, 
  status, 
  price
) VALUES (
  1,
  5,
  '2025-11-05',
  '15:00:00',
  180,
  'مكالمة فيديو',  -- This should now work
  'video_call',
  'scheduled',
  700
);
*/
