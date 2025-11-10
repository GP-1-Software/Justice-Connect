-- SQL Script to create initial timeline events for existing cases
-- Run this in Supabase SQL Editor to populate timeline for existing cases

-- Create a function to add initial timeline event for a case
CREATE OR REPLACE FUNCTION create_initial_timeline_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert initial timeline event when case is created
  INSERT INTO timeline_events (
    case_id,
    event_type,
    author_id,
    author_type,
    title,
    description,
    visibility,
    created_at
  ) VALUES (
    NEW.case_id,
    'status_change',
    NEW.client_id,
    'client',
    'تم إنشاء القضية',
    'تم إنشاء القضية: ' || NEW.title,
    'all',
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create timeline event on case creation
DROP TRIGGER IF EXISTS create_case_timeline_event ON cases;
CREATE TRIGGER create_case_timeline_event
  AFTER INSERT ON cases
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_timeline_event();

-- For existing cases without timeline events, create initial events
INSERT INTO timeline_events (
  case_id,
  event_type,
  author_id,
  author_type,
  title,
  description,
  visibility,
  created_at
)
SELECT 
  c.case_id,
  'status_change',
  c.client_id,
  'client',
  'تم إنشاء القضية',
  'تم إنشاء القضية: ' || c.title,
  'all',
  c.created_at
FROM cases c
WHERE NOT EXISTS (
  SELECT 1 FROM timeline_events te 
  WHERE te.case_id = c.case_id 
  AND te.event_type = 'status_change'
  AND te.title = 'تم إنشاء القضية'
);

-- Create timeline events for existing file uploads
INSERT INTO timeline_events (
  case_id,
  event_type,
  author_id,
  author_type,
  title,
  description,
  visibility,
  created_at
)
SELECT 
  cf.case_id,
  'file_upload',
  cf.uploaded_by,
  cf.uploader_type,
  'تم رفع ملف جديد',
  'تم رفع الملف: ' || cf.file_name,
  'all',
  cf.created_at
FROM case_files cf
WHERE NOT EXISTS (
  SELECT 1 FROM timeline_events te 
  WHERE te.case_id = cf.case_id 
  AND te.event_type = 'file_upload'
  AND te.description LIKE '%' || cf.file_name || '%'
);

-- Create timeline events for completed tasks
INSERT INTO timeline_events (
  case_id,
  event_type,
  author_id,
  author_type,
  title,
  description,
  visibility,
  created_at
)
SELECT 
  ct.case_id,
  'task',
  ct.lawyer_id,
  'lawyer',
  'تم إكمال مهمة',
  'تم إكمال المهمة: ' || ct.title,
  'all',
  COALESCE(ct.updated_at, ct.created_at)
FROM case_tasks ct
WHERE ct.is_completed = true
AND NOT EXISTS (
  SELECT 1 FROM timeline_events te 
  WHERE te.case_id = ct.case_id 
  AND te.event_type = 'task'
  AND te.description LIKE '%' || ct.title || '%'
);

-- Create timeline events for case notes
INSERT INTO timeline_events (
  case_id,
  event_type,
  author_id,
  author_type,
  title,
  description,
  visibility,
  created_at
)
SELECT 
  cn.case_id,
  'note',
  cn.lawyer_id,
  'lawyer',
  'تمت إضافة ملاحظة',
  LEFT(cn.content, 100) || CASE WHEN LENGTH(cn.content) > 100 THEN '...' ELSE '' END,
  'all',
  cn.created_at
FROM case_notes cn
WHERE NOT EXISTS (
  SELECT 1 FROM timeline_events te 
  WHERE te.case_id = cn.case_id 
  AND te.event_type = 'note'
  AND te.created_at = cn.created_at
);

-- Create timeline events for status changes
INSERT INTO timeline_events (
  case_id,
  event_type,
  author_id,
  author_type,
  title,
  description,
  visibility,
  created_at
)
SELECT 
  c.case_id,
  'status_change',
  c.assigned_lawyer_id,
  'lawyer',
  'تم تغيير حالة القضية',
  'تم تغيير حالة القضية إلى: ' || 
    CASE c.status
      WHEN 'pending' THEN 'قيد المراجعة'
      WHEN 'active' THEN 'نشطة'
      WHEN 'closed' THEN 'مغلقة'
      WHEN 'rejected' THEN 'مرفوضة'
      ELSE c.status
    END,
  'all',
  c.updated_at
FROM cases c
WHERE c.updated_at IS NOT NULL 
AND c.updated_at > c.created_at
AND NOT EXISTS (
  SELECT 1 FROM timeline_events te 
  WHERE te.case_id = c.case_id 
  AND te.event_type = 'status_change'
  AND te.created_at = c.updated_at
);

COMMENT ON FUNCTION create_initial_timeline_event() IS 'Automatically creates a timeline event when a new case is created';
