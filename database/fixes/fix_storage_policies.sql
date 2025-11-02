-- ============================================
-- Storage Policies for case-documents bucket
-- ============================================

-- الخطوة 1: إنشاء bucket إذا لم يكن موجوداً
-- (نفذ هذا من Storage UI في Supabase Dashboard)
-- Bucket name: case-documents
-- Public: false (أو true حسب الحاجة)

-- ============================================
-- الخطوة 2: إضافة Policies للـ Storage
-- ============================================

-- Policy 1: السماح بالرفع (INSERT)
CREATE POLICY "Allow authenticated uploads to case-documents"
ON storage.objects
FOR INSERT
TO authenticated, anon
WITH CHECK (
  bucket_id = 'case-documents'
);

-- Policy 2: السماح بالقراءة (SELECT)
CREATE POLICY "Allow public read access to case-documents"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (
  bucket_id = 'case-documents'
);

-- Policy 3: السماح بالتحديث (UPDATE)
CREATE POLICY "Allow authenticated updates to case-documents"
ON storage.objects
FOR UPDATE
TO authenticated, anon
USING (
  bucket_id = 'case-documents'
);

-- Policy 4: السماح بالحذف (DELETE)
CREATE POLICY "Allow authenticated deletes from case-documents"
ON storage.objects
FOR DELETE
TO authenticated, anon
USING (
  bucket_id = 'case-documents'
);

-- ============================================
-- ملاحظات مهمة:
-- ============================================
-- 1. تأكد من إنشاء bucket اسمه "case-documents" أولاً
-- 2. يمكنك تشديد الصلاحيات لاحقاً حسب الحاجة
-- 3. حالياً السماح للجميع للتجربة
-- ============================================
