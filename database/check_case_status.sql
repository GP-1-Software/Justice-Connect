-- ===================================================================
-- Script للتحقق من حالة القضية والمستخدم
-- ===================================================================
-- استخدم هذا الـ Script للتشخيص
-- ===================================================================

-- 1. التحقق من المستخدم الحالي
SELECT 
  'Current User' as info,
  auth.uid() as auth_id,
  (SELECT user_id FROM users WHERE auth_id = auth.uid()) as user_id;

-- 2. التحقق من القضايا للمستخدم الحالي
SELECT 
  case_id,
  title,
  status,
  client_id,
  assigned_lawyer_id,
  created_at
FROM cases 
WHERE client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
ORDER BY created_at DESC;

-- 3. التحقق من الملاحظات الموجودة
SELECT 
  note_id,
  case_id,
  created_by_type,
  created_by_id,
  is_shared,
  LEFT(content, 50) as content_preview,
  created_at
FROM case_notes
ORDER BY created_at DESC
LIMIT 10;

-- 4. التحقق من Policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'case_notes';

-- ===================================================================
-- ملاحظات:
-- ===================================================================
-- إذا كانت القضية status = 'pending' أو 'closed'
-- غيرها إلى 'active' باستخدام:
-- 
-- UPDATE cases 
-- SET status = 'active' 
-- WHERE case_id = YOUR_CASE_ID;
-- ===================================================================
