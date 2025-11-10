-- ===================================================================
-- حذف عمود lawyer_id القديم وإصلاح الجدول
-- ===================================================================

-- 1. حذف عمود lawyer_id القديم
ALTER TABLE case_notes DROP COLUMN IF EXISTS lawyer_id;

-- 2. حذف جميع Policies القديمة
DROP POLICY IF EXISTS "Lawyers can delete their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers can insert their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers can update their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers can view their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers manage own case notes" ON case_notes;
DROP POLICY IF EXISTS "case_notes_delete_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_insert_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_select_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_update_policy" ON case_notes;

-- 3. إضافة Policies الجديدة الصحيحة

-- سياسة القراءة
CREATE POLICY "case_notes_select_policy"
ON case_notes FOR SELECT
USING (
  case_id IN (
    SELECT case_id FROM cases 
    WHERE client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    UNION
    SELECT case_id FROM cases 
    WHERE assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- سياسة الإضافة
CREATE POLICY "case_notes_insert_policy"
ON case_notes FOR INSERT
WITH CHECK (
  case_id IN (
    SELECT case_id FROM cases 
    WHERE client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    AND status = 'active'
    UNION
    SELECT case_id FROM cases 
    WHERE assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- سياسة التحديث
CREATE POLICY "case_notes_update_policy"
ON case_notes FOR UPDATE
USING (
  (
    created_by_type = 'client' AND 
    created_by_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
  )
  OR
  (
    created_by_type = 'lawyer' AND 
    created_by_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- سياسة الحذف
CREATE POLICY "case_notes_delete_policy"
ON case_notes FOR DELETE
USING (
  (
    created_by_type = 'client' AND 
    created_by_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
  )
  OR
  (
    created_by_type = 'lawyer' AND 
    created_by_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- 4. تفعيل RLS
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- 5. التحقق من النتيجة
SELECT 
  'Columns after cleanup' as info,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'case_notes'
ORDER BY ordinal_position;

SELECT 
  'Policies after cleanup' as info,
  policyname, 
  cmd 
FROM pg_policies 
WHERE tablename = 'case_notes'
ORDER BY cmd;

-- ===================================================================
-- يجب أن تشوف:
-- ✅ 8 أعمدة فقط (بدون lawyer_id)
-- ✅ 4 policies فقط
-- ===================================================================
