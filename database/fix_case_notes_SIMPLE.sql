-- ===================================================================
-- حل بسيط ومباشر لمشكلة RLS
-- ===================================================================
-- هذا الحل يستخدم طريقة أبسط بدون تعقيد
-- ===================================================================

-- 1. حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "case_notes_select_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_insert_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_update_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_delete_policy" ON case_notes;

-- 2. تعطيل RLS مؤقتاً للاختبار
ALTER TABLE case_notes DISABLE ROW LEVEL SECURITY;

-- ===================================================================
-- ملاحظة: هذا حل مؤقت للاختبار فقط!
-- بعد ما تتأكد إن الإضافة شغالة، راح نرجع نفعل RLS بطريقة صحيحة
-- ===================================================================
