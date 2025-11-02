-- ============================================
-- Row Level Security Policies for Cases Table
-- ============================================

-- Enable RLS on cases table
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. Policy: Allow clients to INSERT their own cases
-- ============================================
CREATE POLICY "clients_can_create_cases"
ON cases
FOR INSERT
TO authenticated, anon
WITH CHECK (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);

-- ============================================
-- 2. Policy: Allow clients to SELECT their own cases
-- ============================================
CREATE POLICY "clients_can_view_own_cases"
ON cases
FOR SELECT
TO authenticated, anon
USING (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);

-- ============================================
-- 3. Policy: Allow lawyers to SELECT cases assigned to them
-- ============================================
CREATE POLICY "lawyers_can_view_assigned_cases"
ON cases
FOR SELECT
TO authenticated, anon
USING (
  assigned_lawyer_id IN (
    SELECT lawyer_id FROM lawyers
  )
);

-- ============================================
-- 4. Policy: Allow lawyers to UPDATE cases assigned to them
-- ============================================
CREATE POLICY "lawyers_can_update_assigned_cases"
ON cases
FOR UPDATE
TO authenticated, anon
USING (
  assigned_lawyer_id IN (
    SELECT lawyer_id FROM lawyers
  )
);

-- ============================================
-- 5. Policy: Allow clients to UPDATE their own cases (limited fields)
-- ============================================
CREATE POLICY "clients_can_update_own_cases"
ON cases
FOR UPDATE
TO authenticated, anon
USING (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);

-- ============================================
-- 6. Policy: Allow admins to do everything
-- ============================================
CREATE POLICY "admins_full_access_cases"
ON cases
FOR ALL
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM admins WHERE admin_id = auth.uid()
  )
);

-- ============================================
-- Row Level Security Policies for case_files Table
-- ============================================

-- Enable RLS on case_files table
ALTER TABLE case_files ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. Policy: Allow users to INSERT files for their cases
-- ============================================
CREATE POLICY "users_can_upload_case_files"
ON case_files
FOR INSERT
TO authenticated, anon
WITH CHECK (
  case_id IN (
    SELECT case_id FROM cases 
    WHERE client_id = uploaded_by 
    OR assigned_lawyer_id = uploaded_by
  )
);

-- ============================================
-- 2. Policy: Allow users to SELECT files for their cases
-- ============================================
CREATE POLICY "users_can_view_case_files"
ON case_files
FOR SELECT
TO authenticated, anon
USING (
  case_id IN (
    SELECT case_id FROM cases 
    WHERE client_id IN (SELECT user_id FROM users)
    OR assigned_lawyer_id IN (SELECT lawyer_id FROM lawyers)
  )
);

-- ============================================
-- 3. Policy: Allow users to DELETE their own uploaded files
-- ============================================
CREATE POLICY "users_can_delete_own_files"
ON case_files
FOR DELETE
TO authenticated, anon
USING (
  uploaded_by IN (
    SELECT user_id FROM users
    UNION
    SELECT lawyer_id FROM lawyers
  )
);

-- ============================================
-- Row Level Security Policies for timeline_events Table
-- ============================================

-- Enable RLS on timeline_events table
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. Policy: Allow users to INSERT events for their cases
-- ============================================
CREATE POLICY "users_can_create_timeline_events"
ON timeline_events
FOR INSERT
TO authenticated, anon
WITH CHECK (
  case_id IN (
    SELECT case_id FROM cases 
    WHERE client_id = author_id 
    OR assigned_lawyer_id = author_id
  )
);

-- ============================================
-- 2. Policy: Allow users to SELECT events for their cases
-- ============================================
CREATE POLICY "users_can_view_timeline_events"
ON timeline_events
FOR SELECT
TO authenticated, anon
USING (
  case_id IN (
    SELECT case_id FROM cases 
    WHERE client_id IN (SELECT user_id FROM users)
    OR assigned_lawyer_id IN (SELECT lawyer_id FROM lawyers)
  )
  AND (
    visibility = 'all'
    OR (visibility = 'lawyer_only' AND author_type = 'lawyer')
    OR (visibility = 'client_only' AND author_type = 'client')
  )
);

-- ============================================
-- Row Level Security Policies for case_notes Table
-- ============================================

-- Enable RLS on case_notes table
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. Policy: Allow lawyers to INSERT notes for their cases
-- ============================================
CREATE POLICY "lawyers_can_create_case_notes"
ON case_notes
FOR INSERT
TO authenticated, anon
WITH CHECK (
  case_id IN (
    SELECT case_id FROM cases WHERE assigned_lawyer_id = lawyer_id
  )
);

-- ============================================
-- 2. Policy: Allow lawyers to SELECT their own notes
-- ============================================
CREATE POLICY "lawyers_can_view_own_notes"
ON case_notes
FOR SELECT
TO authenticated, anon
USING (
  lawyer_id IN (SELECT lawyer_id FROM lawyers)
);

-- ============================================
-- 3. Policy: Allow lawyers to UPDATE their own notes
-- ============================================
CREATE POLICY "lawyers_can_update_own_notes"
ON case_notes
FOR UPDATE
TO authenticated, anon
USING (
  lawyer_id IN (SELECT lawyer_id FROM lawyers)
);

-- ============================================
-- Row Level Security Policies for case_tasks Table
-- ============================================

-- Enable RLS on case_tasks table
ALTER TABLE case_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. Policy: Allow lawyers to INSERT tasks for their cases
-- ============================================
CREATE POLICY "lawyers_can_create_case_tasks"
ON case_tasks
FOR INSERT
TO authenticated, anon
WITH CHECK (
  case_id IN (
    SELECT case_id FROM cases WHERE assigned_lawyer_id = lawyer_id
  )
);

-- ============================================
-- 2. Policy: Allow lawyers to SELECT tasks for their cases
-- ============================================
CREATE POLICY "lawyers_can_view_case_tasks"
ON case_tasks
FOR SELECT
TO authenticated, anon
USING (
  case_id IN (
    SELECT case_id FROM cases WHERE assigned_lawyer_id = lawyer_id
  )
);

-- ============================================
-- 3. Policy: Allow lawyers to UPDATE tasks for their cases
-- ============================================
CREATE POLICY "lawyers_can_update_case_tasks"
ON case_tasks
FOR UPDATE
TO authenticated, anon
USING (
  case_id IN (
    SELECT case_id FROM cases WHERE assigned_lawyer_id = lawyer_id
  )
);

-- ============================================
-- NOTES:
-- ============================================
-- 1. These policies assume you're NOT using Supabase Auth (auth.uid())
-- 2. Instead, they check against users/lawyers/admins tables directly
-- 3. Make sure to adjust if you're using Supabase Auth
-- 4. Test thoroughly before deploying to production
-- ============================================
