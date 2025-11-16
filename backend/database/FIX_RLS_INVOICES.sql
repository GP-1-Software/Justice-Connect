-- =====================================================
-- حل مشكلة عدم ظهور الفواتير
-- =====================================================
-- المشكلة: RLS policies تستخدم current_setting الذي لا يتم تعيينه

-- =====================================================
-- الحل المؤقت: تعطيل RLS
-- =====================================================

-- تعطيل RLS على الجداول
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- ملاحظة مهمة:
-- =====================================================
-- هذا حل مؤقت لتشغيل النظام
-- في الإنتاج، يجب:
-- 1. استخدام Supabase Auth بدلاً من localStorage
-- 2. إعادة تفعيل RLS
-- 3. تحديث الـ policies لتستخدم auth.uid()

-- =====================================================
-- الحل الدائم (للمستقبل):
-- =====================================================

-- عندما تستخدم Supabase Auth:
/*
-- حذف الـ policies القديمة
DROP POLICY IF EXISTS "Lawyers can view their invoices" ON invoices;
DROP POLICY IF EXISTS "Clients can view their invoices" ON invoices;
DROP POLICY IF EXISTS "Lawyers can create invoices" ON invoices;
DROP POLICY IF EXISTS "Lawyers can update their unpaid invoices" ON invoices;
DROP POLICY IF EXISTS "Lawyers can delete their unpaid invoices" ON invoices;

-- إعادة تفعيل RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- إنشاء policies جديدة تستخدم Supabase Auth
CREATE POLICY "Lawyers can view their invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lawyers
      WHERE lawyers.lawyer_id = invoices.lawyer_id
        AND lawyers.user_id = auth.uid()::INTEGER
    )
  );

CREATE POLICY "Clients can view their invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = invoices.client_id
        AND users.id = auth.uid()
    )
  );

CREATE POLICY "Lawyers can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lawyers
      WHERE lawyers.lawyer_id = invoices.lawyer_id
        AND lawyers.user_id = auth.uid()::INTEGER
    )
  );
*/

-- =====================================================
-- للتحقق من نجاح الحل:
-- =====================================================

-- تحقق من حالة RLS:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('invoices', 'invoice_items', 'payments', 'notifications');

-- يجب أن يظهر rowsecurity = false

-- اختبار الـ queries:
-- SELECT * FROM invoices LIMIT 5;
-- SELECT * FROM invoice_items LIMIT 5;
