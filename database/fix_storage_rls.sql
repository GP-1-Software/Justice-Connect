-- ===================================================================
-- حل مشكلة RLS في Storage
-- ===================================================================
-- المشكلة: new row violates row-level security policy
-- السبب: Bucket بدون Policies
-- الحل: إضافة Policies للسماح بالرفع والقراءة
-- ===================================================================

-- الحل 1: Policies عامة (للتطوير)
-- ===================================================================

-- حذف Policies القديمة إن وجدت
DROP POLICY IF EXISTS "Allow public uploads to case-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from case-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from case-reports" ON storage.objects;

-- السماح للجميع بالرفع
CREATE POLICY "Allow public uploads to case-reports"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'case-reports');

-- السماح للجميع بالقراءة
CREATE POLICY "Allow public reads from case-reports"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'case-reports');

-- السماح للجميع بالحذف
CREATE POLICY "Allow public deletes from case-reports"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'case-reports');

-- ===================================================================
-- الحل 2: تعطيل RLS تماماً (للتطوير فقط - غير آمن!)
-- ===================================================================
-- فك التعليق عن السطر التالي إذا أردت تعطيل RLS تماماً
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ===================================================================
-- التحقق من النتيجة
-- ===================================================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%case-reports%';

-- ===================================================================
-- ملاحظات:
-- ===================================================================
-- 1. هذه Policies تسمح لأي شخص بالرفع والقراءة
-- 2. استخدمها للتطوير فقط
-- 3. في الإنتاج، استخدم Policies آمنة تتحقق من المستخدم
-- ===================================================================
