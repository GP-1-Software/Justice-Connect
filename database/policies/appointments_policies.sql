-- ============================================
-- Row Level Security Policies for Appointments Table
-- ============================================
-- Created: Nov 1, 2025
-- Purpose: Allow clients and lawyers to manage appointments

-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policy 1: Clients can create appointments
-- ============================================
-- Allow clients to insert appointments for themselves
CREATE POLICY "clients_can_create_appointments" 
ON appointments 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);

-- ============================================
-- Policy 2: Clients can view their own appointments
-- ============================================
CREATE POLICY "clients_can_view_own_appointments" 
ON appointments 
FOR SELECT 
TO anon, authenticated
USING (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);

-- ============================================
-- Policy 3: Lawyers can view their appointments
-- ============================================
CREATE POLICY "lawyers_can_view_their_appointments" 
ON appointments 
FOR SELECT 
TO anon, authenticated
USING (
  lawyer_id IN (
    SELECT lawyer_id FROM lawyers
  )
);

-- ============================================
-- Policy 4: Clients can update their own appointments
-- ============================================
-- Allow clients to update status, reschedule, etc.
CREATE POLICY "clients_can_update_own_appointments" 
ON appointments 
FOR UPDATE 
TO anon, authenticated
USING (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);

-- ============================================
-- Policy 5: Lawyers can update their appointments
-- ============================================
-- Allow lawyers to update status, notes, etc.
CREATE POLICY "lawyers_can_update_their_appointments" 
ON appointments 
FOR UPDATE 
TO anon, authenticated
USING (
  lawyer_id IN (
    SELECT lawyer_id FROM lawyers
  )
);

-- ============================================
-- Policy 6: Clients can delete their own appointments
-- ============================================
CREATE POLICY "clients_can_delete_own_appointments" 
ON appointments 
FOR DELETE 
TO anon, authenticated
USING (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);

-- ============================================
-- Policy 7: Admins have full access
-- ============================================
CREATE POLICY "admins_full_access_appointments" 
ON appointments 
FOR ALL 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins WHERE admin_id = auth.uid()
  )
);

-- ============================================
-- Verification Queries (Optional - Run to check)
-- ============================================
-- Check if RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'appointments';

-- View all policies
-- SELECT * FROM pg_policies WHERE tablename = 'appointments';
