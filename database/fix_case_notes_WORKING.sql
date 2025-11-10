-- ===================================================================
-- الحل النهائي الصحيح لمشكلة RLS
-- ===================================================================
-- المشكلة: RLS Policy تستخدم auth.uid() لكن الكود يستخدم user_id
-- الحل: نستخدم created_by_id بدلاً من auth.uid()
-- ===================================================================

-- 1. حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "case_notes_select_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_insert_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_update_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_delete_policy" ON case_notes;

-- 2. سياسة القراءة - يقدر يقرأ الملاحظات في قضاياه
CREATE POLICY "case_notes_select_policy"
ON case_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.case_id = case_notes.case_id
    AND (
      cases.client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
      OR
      cases.assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
    )
  )
);

-- 3. سياسة الإضافة - الطريقة الصحيحة
-- نتحقق من أن المستخدم يملك القضية أو محامي فيها
-- ونتحقق من أن created_by_id يطابق user_id الحالي
CREATE POLICY "case_notes_insert_policy"
ON case_notes FOR INSERT
WITH CHECK (
  -- التحقق من أن المستخدم له صلاحية على القضية
  EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.case_id = case_notes.case_id
    AND (
      -- العميل: يملك القضية وحالتها active
      (
        cases.client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
        AND cases.status = 'active'
        AND case_notes.created_by_type = 'client'
        AND case_notes.created_by_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
      )
      OR
      -- المحامي: مسند له القضية
      (
        cases.assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
        AND case_notes.created_by_type = 'lawyer'
        AND case_notes.created_by_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
      )
    )
  )
);

-- 4. سياسة التحديث - يقدر يحدث ملاحظاته فقط
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

-- 5. سياسة الحذف - يقدر يحذف ملاحظاته فقط
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
-- للاختبار بعد تشغيل الـ Script:
-- ===================================================================
-- 1. تأكد من أنك مسجل دخول في الواجهة
-- 2. افتح Console (F12) وشغّل:
--    const { data: { user } } = await supabase.auth.getUser();
--    console.log('Auth ID:', user?.id);
-- 3. في Supabase SQL Editor، شغّل:
--    SELECT user_id FROM users WHERE auth_id = 'AUTH_ID_FROM_CONSOLE';
-- 4. تأكد من أن user_id موجود
-- 5. جرب إضافة ملاحظة
-- ===================================================================
