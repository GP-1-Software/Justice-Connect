-- ===================================================================
-- SQL Script: تحديث جدول case_notes لدعم الملاحظات من العميل والمحامي
-- ===================================================================
-- الوصف: إضافة أعمدة جديدة لتمكين كل من المحامي والعميل من إضافة ملاحظات
--         مع خيار المشاركة، وتطبيق Row Level Security
-- ===================================================================

-- 1. إضافة الأعمدة الجديدة
ALTER TABLE case_notes 
ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(20) DEFAULT 'lawyer',
ADD COLUMN IF NOT EXISTS created_by_id INTEGER,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- 2. جعل lawyer_id اختياري (nullable)
ALTER TABLE case_notes 
ALTER COLUMN lawyer_id DROP NOT NULL;

-- 3. إضافة indexes للأداء
CREATE INDEX IF NOT EXISTS idx_case_notes_created_by 
ON case_notes(created_by_type, created_by_id);

CREATE INDEX IF NOT EXISTS idx_case_notes_shared 
ON case_notes(is_shared);

CREATE INDEX IF NOT EXISTS idx_case_notes_case_id 
ON case_notes(case_id);

-- 4. تحديث البيانات الموجودة (الملاحظات القديمة من المحامين)
UPDATE case_notes 
SET 
  created_by_type = 'lawyer',
  created_by_id = lawyer_id,
  is_shared = true  -- الملاحظات القديمة تكون مشتركة بشكل افتراضي
WHERE created_by_type IS NULL AND lawyer_id IS NOT NULL;

-- 5. حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Users can view their own notes and shared notes from others" ON case_notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON case_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON case_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON case_notes;
DROP POLICY IF EXISTS "Users can view notes in their cases" ON case_notes;
DROP POLICY IF EXISTS "Users can create notes in their cases" ON case_notes;

-- 6. إنشاء السياسات الجديدة (Row Level Security)

-- سياسة القراءة: الكل يقدر يقرأ الملاحظات في القضايا اللي له صلاحية عليها
CREATE POLICY "Users can view notes in their cases"
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
CREATE POLICY "Users can create notes in their cases"
ON case_notes FOR INSERT
WITH CHECK (
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

-- سياسة التحديث: يقدر يحدث ملاحظاته فقط
CREATE POLICY "Users can update their own notes"
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
CREATE POLICY "Users can delete their own notes"
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

-- 7. تفعيل Row Level Security
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- 8. إضافة تعليقات للتوثيق
COMMENT ON COLUMN case_notes.created_by_type IS 'نوع المستخدم الذي أنشأ الملاحظة: lawyer أو client';
COMMENT ON COLUMN case_notes.created_by_id IS 'معرف المستخدم (user_id للعميل أو lawyer_id للمحامي)';
COMMENT ON COLUMN case_notes.is_shared IS 'هل الملاحظة مشتركة مع الطرف الآخر (true) أم خاصة (false)';

-- 9. إنشاء function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_case_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. إنشاء trigger لتحديث updated_at
DROP TRIGGER IF EXISTS update_case_notes_updated_at_trigger ON case_notes;
CREATE TRIGGER update_case_notes_updated_at_trigger
  BEFORE UPDATE ON case_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_case_notes_updated_at();

-- ===================================================================
-- ملاحظات مهمة:
-- ===================================================================
-- 1. بعد تشغيل هذا الـ Script، اذهب إلى Supabase Dashboard
-- 2. Database → Replication → Enable realtime for case_notes table
-- 3. Enable all events: INSERT, UPDATE, DELETE
-- 4. تأكد من أن RLS مفعل وأن الـ Policies شغالة
-- ===================================================================
