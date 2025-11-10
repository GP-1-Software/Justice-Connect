-- ===================================================================
-- إرجاع عمود lawyer_id إلى جدول case_notes
-- ===================================================================

-- 1. إضافة عمود lawyer_id
ALTER TABLE case_notes ADD COLUMN IF NOT EXISTS lawyer_id INTEGER;

-- 2. إضافة Foreign Key Constraint
ALTER TABLE case_notes 
DROP CONSTRAINT IF EXISTS case_notes_lawyer_id_fkey;

ALTER TABLE case_notes 
ADD CONSTRAINT case_notes_lawyer_id_fkey 
FOREIGN KEY (lawyer_id) 
REFERENCES lawyers(lawyer_id) 
ON DELETE SET NULL;

-- 3. إنشاء Index للأداء
CREATE INDEX IF NOT EXISTS idx_case_notes_lawyer_id 
ON case_notes(lawyer_id);

-- 4. تحديث البيانات الموجودة
-- نملأ lawyer_id من created_by_id للملاحظات اللي من المحامين
UPDATE case_notes 
SET lawyer_id = created_by_id 
WHERE created_by_type = 'lawyer' 
AND lawyer_id IS NULL;

-- 5. التحقق من النتيجة
SELECT 
  'Columns after adding lawyer_id' as info,
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'case_notes'
ORDER BY ordinal_position;

-- ===================================================================
-- الآن الجدول يحتوي على:
-- ✅ lawyer_id (للتوافق مع الكود القديم)
-- ✅ created_by_type و created_by_id (للنظام الجديد)
-- ✅ is_shared (للمشاركة)
-- ===================================================================
