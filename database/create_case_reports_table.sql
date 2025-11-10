-- ===================================================================
-- إنشاء جدول case_reports لحفظ سجل التقارير المطبوعة
-- ===================================================================

-- 1. إنشاء الجدول
CREATE TABLE IF NOT EXISTS case_reports (
  report_id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
  generated_by INTEGER NOT NULL,
  generated_by_type VARCHAR(10) NOT NULL CHECK (generated_by_type IN ('client', 'lawyer')),
  report_title VARCHAR(150),
  report_description TEXT,
  report_type VARCHAR(50) DEFAULT 'full',
  file_url TEXT NOT NULL,
  file_size INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إنشاء Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_case_reports_case_id ON case_reports(case_id);
CREATE INDEX IF NOT EXISTS idx_case_reports_generated_by ON case_reports(generated_by_type, generated_by);
CREATE INDEX IF NOT EXISTS idx_case_reports_generated_at ON case_reports(generated_at DESC);

-- 3. تفعيل RLS
ALTER TABLE case_reports ENABLE ROW LEVEL SECURITY;

-- 4. حذف Policies القديمة إن وجدت
DROP POLICY IF EXISTS "case_reports_select_policy" ON case_reports;
DROP POLICY IF EXISTS "case_reports_insert_policy" ON case_reports;
DROP POLICY IF EXISTS "case_reports_delete_policy" ON case_reports;

-- 5. سياسة القراءة
-- يقدر يقرأ التقارير للقضايا اللي له صلاحية عليها
CREATE POLICY "case_reports_select_policy"
ON case_reports FOR SELECT
USING (
  case_id IN (
    SELECT case_id FROM cases 
    WHERE client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    UNION
    SELECT case_id FROM cases 
    WHERE assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- 6. سياسة الإضافة
-- يقدر يضيف تقارير للقضايا اللي له صلاحية عليها
CREATE POLICY "case_reports_insert_policy"
ON case_reports FOR INSERT
WITH CHECK (
  case_id IN (
    SELECT case_id FROM cases 
    WHERE client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    UNION
    SELECT case_id FROM cases 
    WHERE assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- 7. سياسة الحذف
-- يقدر يحذف تقاريره فقط
CREATE POLICY "case_reports_delete_policy"
ON case_reports FOR DELETE
USING (
  (
    generated_by_type = 'client' AND 
    generated_by = (SELECT user_id FROM users WHERE auth_id = auth.uid())
  )
  OR
  (
    generated_by_type = 'lawyer' AND 
    generated_by = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- ===================================================================
-- إعداد Supabase Storage Bucket
-- ===================================================================
-- ملاحظة: هذا يتم من Dashboard → Storage → Create Bucket
-- اسم الـ Bucket: case-reports
-- Public: false (خاص)
-- File size limit: 10 MB
-- Allowed MIME types: application/pdf

-- ===================================================================
-- التحقق من النتيجة
-- ===================================================================
SELECT 
  'Table created successfully' as status,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'case_reports'
ORDER BY ordinal_position;

SELECT 
  'Policies created successfully' as status,
  policyname, 
  cmd 
FROM pg_policies 
WHERE tablename = 'case_reports'
ORDER BY cmd;
