-- ===================================================================
-- حذف جميع Policies القديمة والخاطئة
-- ===================================================================
-- هذا الـ Script يحذف كل Policies القديمة ويضيف فقط الصحيحة
-- ===================================================================

-- 1. حذف جميع Policies (القديمة والجديدة)
DROP POLICY IF EXISTS "Lawyers can delete their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers can insert their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers can update their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers can view their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers manage own case notes" ON case_notes;
DROP POLICY IF EXISTS "case_notes_delete_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_insert_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_select_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_update_policy" ON case_notes;

-- 2. سياسة القراءة (SELECT)
-- يقدر يقرأ الملاحظات في القضايا اللي له صلاحية عليها
CREATE POLICY "case_notes_select_policy"
ON case_notes FOR SELECT
USING (
  case_id IN (
    -- القضايا اللي العميل يملكها
    SELECT case_id FROM cases 
    WHERE client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    UNION
    -- القضايا المسندة للمحامي
    SELECT case_id FROM cases 
    WHERE assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- 3. سياسة الإضافة (INSERT)
-- العميل: فقط في القضايا النشطة (status = 'active')
-- المحامي: في كل القضايا المسندة له
CREATE POLICY "case_notes_insert_policy"
ON case_notes FOR INSERT
WITH CHECK (
  case_id IN (
    -- القضايا اللي العميل يملكها وحالتها active
    SELECT case_id FROM cases 
    WHERE client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    AND status = 'active'
    UNION
    -- القضايا المسندة للمحامي (بدون شرط الحالة)
    SELECT case_id FROM cases 
    WHERE assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- 4. سياسة التحديث (UPDATE)
-- يقدر يحدث ملاحظاته فقط
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

-- 5. سياسة الحذف (DELETE)
-- يقدر يحذف ملاحظاته فقط
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

-- 6. تفعيل RLS
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- تحقق من النتيجة:
-- ===================================================================
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'case_notes';
-- يجب أن تشوف فقط 4 policies:
-- 1. case_notes_select_policy (SELECT)
-- 2. case_notes_insert_policy (INSERT)
-- 3. case_notes_update_policy (UPDATE)
-- 4. case_notes_delete_policy (DELETE)
-- ===================================================================
