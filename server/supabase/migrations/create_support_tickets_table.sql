-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  ticket_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  lawyer_id INTEGER REFERENCES lawyers(lawyer_id),
  submitter_type VARCHAR NOT NULL CHECK (submitter_type IN ('client', 'lawyer')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replies JSONB DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Users can view their own tickets
-- 1. Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT
  USING (
    (auth.email() IN (SELECT email FROM users WHERE user_id = support_tickets.user_id))
    OR
    (auth.email() IN (SELECT email FROM lawyers WHERE lawyer_id = support_tickets.lawyer_id))
  );

-- 2. Users can insert their own tickets
CREATE POLICY "Users can insert own tickets" ON support_tickets
  FOR INSERT
  WITH CHECK (
    (auth.email() IN (SELECT email FROM users WHERE user_id = support_tickets.user_id))
    OR
    (auth.email() IN (SELECT email FROM lawyers WHERE lawyer_id = support_tickets.lawyer_id))
  );

-- 3. Admins can view all tickets
-- Assuming admins are in a separate table or have a specific role claim. 
-- Based on existing code, admins seem to be in 'admins' table.
-- However, RLS usually works with auth.uid(). 
-- If admins are authenticated users, we need a policy for them.
-- For now, I will add a policy that allows access if the user is an admin.
-- Note: This depends on how admin auth is handled. 
-- If admins use the same auth system, we can check against the admins table.

CREATE POLICY "Admins can view all tickets" ON support_tickets
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admins WHERE email = auth.email())
  );

CREATE POLICY "Admins can update tickets" ON support_tickets
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE email = auth.email())
  );
