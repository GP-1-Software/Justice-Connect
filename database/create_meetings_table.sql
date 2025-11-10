-- Create meetings table for video/audio calls
CREATE TABLE IF NOT EXISTS meetings (
  meeting_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type VARCHAR(20) NOT NULL CHECK (meeting_type IN ('appointment', 'case')),
  related_appointment_id uuid NULL REFERENCES appointments(id) ON DELETE CASCADE,
  related_case_id INTEGER NULL REFERENCES cases(case_id) ON DELETE CASCADE,
  
  meeting_link TEXT NOT NULL,
  meeting_provider VARCHAR(50) DEFAULT 'jitsi',
  meeting_status VARCHAR(20) DEFAULT 'pending'
    CHECK (meeting_status IN ('pending','confirmed','completed','cancelled')),
  
  scheduled_date DATE,
  scheduled_time TIME WITHOUT TIME ZONE,
  
  created_by_role VARCHAR(20) CHECK (created_by_role IN ('client','lawyer')),
  created_by_id INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meetings_appointment ON meetings(related_appointment_id);
CREATE INDEX IF NOT EXISTS idx_meetings_case ON meetings(related_case_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(meeting_status);
CREATE INDEX IF NOT EXISTS idx_meetings_type ON meetings(meeting_type);

-- Enable Row Level Security
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view meetings related to their appointments or cases
CREATE POLICY "Clients can view their meetings"
  ON meetings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = meetings.related_appointment_id
      AND appointments.client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM cases
      WHERE cases.case_id = meetings.related_case_id
      AND cases.client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Policy: Lawyers can view meetings related to their appointments or cases
CREATE POLICY "Lawyers can view their meetings"
  ON meetings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = meetings.related_appointment_id
      AND appointments.lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM cases
      WHERE cases.case_id = meetings.related_case_id
      AND cases.assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
    )
  );

-- Policy: Lawyers can create meetings for their cases/appointments
CREATE POLICY "Lawyers can create meetings"
  ON meetings
  FOR INSERT
  WITH CHECK (
    created_by_role = 'lawyer'
    AND created_by_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.id = related_appointment_id
        AND appointments.lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM cases
        WHERE cases.case_id = related_case_id
        AND cases.assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
      )
    )
  );

-- Policy: Clients can create meetings for their appointments (when confirmed)
CREATE POLICY "Clients can create meetings for confirmed appointments"
  ON meetings
  FOR INSERT
  WITH CHECK (
    created_by_role = 'client'
    AND created_by_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = related_appointment_id
      AND appointments.client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
      AND appointments.status = 'confirmed'
    )
  );

-- Policy: Lawyers can update meetings
CREATE POLICY "Lawyers can update meetings"
  ON meetings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = meetings.related_appointment_id
      AND appointments.lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM cases
      WHERE cases.case_id = meetings.related_case_id
      AND cases.assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
    )
  );

-- Policy: Clients can update their meetings
CREATE POLICY "Clients can update their meetings"
  ON meetings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = meetings.related_appointment_id
      AND appointments.client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM cases
      WHERE cases.case_id = meetings.related_case_id
      AND cases.client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meetings_updated_at();

-- Enable Realtime for meetings table
-- Note: You need to enable this manually in Supabase Dashboard:
-- Database → Replication → Enable Realtime for 'meetings' table

