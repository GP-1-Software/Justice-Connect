-- ===================================================================
-- الحل النهائي لمشكلة RLS في case_notes
-- ===================================================================
-- هذا الـ Script يحل المشكلة 100%
-- تأكد من تشغيله في Supabase SQL Editor
-- ===================================================================

-- 1. حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Users can view their own notes and shared notes from others" ON case_notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON case_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON case_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON case_notes;
DROP POLICY IF EXISTS "Users can view notes in their cases" ON case_notes;
DROP POLICY IF EXISTS "Users can create notes in their cases" ON case_notes;
DROP POLICY IF EXISTS "case_notes_select_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_insert_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_update_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_delete_policy" ON case_notes;

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
-- ملاحظة مهمة:
-- ===================================================================
-- بعد تشغيل هذا الـ Script:
-- 1. تأكد من أن القضية حالتها 'active' (مش 'accepted')
-- 2. فعّل Realtime: Database → Replication → case_notes
-- 3. جرب إضافة ملاحظة في الواجهة
-- ===================================================================
