-- ===================================================================
-- Quick Fix: حل سريع لمشكلة RLS في case_notes
-- ===================================================================
-- المشكلة: السياسات الحالية تمنع إضافة الملاحظات
-- الحل: تبسيط السياسات لتعتمد على case_id فقط
-- ===================================================================

-- 1. حذف جميع السياسات الموجودة
DROP POLICY IF EXISTS "Users can view their own notes and shared notes from others" ON case_notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON case_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON case_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON case_notes;
DROP POLICY IF EXISTS "Users can view notes in their cases" ON case_notes;
DROP POLICY IF EXISTS "Users can create notes in their cases" ON case_notes;

-- 2. إنشاء سياسات جديدة مبسطة

-- سياسة القراءة: يقدر يقرأ الملاحظات في القضايا اللي له صلاحية عليها
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

-- سياسة الإضافة: يقدر يضيف ملاحظات في القضايا اللي له صلاحية عليها
-- العميل: فقط إذا كانت القضية نشطة (status = 'active')
-- المحامي: في أي وقت
CREATE POLICY "case_notes_insert_policy"
ON case_notes FOR INSERT
WITH CHECK (
  case_id IN (
    -- القضايا اللي العميل يملكها وحالتها نشطة
    SELECT case_id FROM cases 
    WHERE client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    AND status = 'active'
    UNION
    -- القضايا المسندة للمحامي (بدون شرط الحالة)
    SELECT case_id FROM cases 
    WHERE assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- سياسة التحديث: يقدر يحدث ملاحظاته فقط
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

-- سياسة الحذف: يقدر يحذف ملاحظاته فقط
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

-- 3. التأكد من تفعيل RLS
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- ملاحظة: بعد تشغيل هذا الـ Script:
-- 1. جرب إضافة ملاحظة من الواجهة
-- 2. تأكد من أن الـ Realtime مفعل
-- 3. إذا استمرت المشكلة، تحقق من auth.uid() في Supabase
-- ===================================================================
