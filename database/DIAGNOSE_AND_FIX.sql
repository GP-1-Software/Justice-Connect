-- ===================================================================
-- Script للتشخيص والإصلاح الشامل
-- ===================================================================
-- هذا الـ Script يفحص كل شيء ويصلح المشاكل
-- ===================================================================

-- الخطوة 1: تحقق من المستخدمين في جدول users
-- ===================================================================
SELECT 
  'Users in database' as info,
  user_id,
  auth_id,
  email,
  first_name,
  last_name
FROM users
ORDER BY user_id;

-- الخطوة 2: تحقق من القضايا
-- ===================================================================
SELECT 
  'Cases in database' as info,
  case_id,
  title,
  status,
  client_id,
  assigned_lawyer_id
FROM cases
ORDER BY case_id;

-- الخطوة 3: تحقق من هيكل جدول case_notes
-- ===================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'case_notes'
ORDER BY ordinal_position;

-- ===================================================================
-- إذا كان جدول case_notes لسا فيه عمود lawyer_id القديم:
-- ===================================================================
-- لازم نحذفه ونضيف الأعمدة الجديدة

-- تحقق من وجود عمود lawyer_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'case_notes' 
    AND column_name = 'lawyer_id'
  ) THEN
    RAISE NOTICE 'عمود lawyer_id موجود - لازم نحذفه!';
    
    -- حذف عمود lawyer_id القديم
    ALTER TABLE case_notes DROP COLUMN IF EXISTS lawyer_id;
    
    RAISE NOTICE 'تم حذف عمود lawyer_id';
  ELSE
    RAISE NOTICE 'عمود lawyer_id غير موجود - كل شيء تمام';
  END IF;
END $$;

-- تحقق من وجود الأعمدة الجديدة
DO $$
BEGIN
  -- إضافة created_by_type إذا مش موجود
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'case_notes' 
    AND column_name = 'created_by_type'
  ) THEN
    ALTER TABLE case_notes ADD COLUMN created_by_type VARCHAR(10);
    RAISE NOTICE 'تم إضافة عمود created_by_type';
  END IF;
  
  -- إضافة created_by_id إذا مش موجود
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'case_notes' 
    AND column_name = 'created_by_id'
  ) THEN
    ALTER TABLE case_notes ADD COLUMN created_by_id INTEGER;
    RAISE NOTICE 'تم إضافة عمود created_by_id';
  END IF;
  
  -- إضافة is_shared إذا مش موجود
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'case_notes' 
    AND column_name = 'is_shared'
  ) THEN
    ALTER TABLE case_notes ADD COLUMN is_shared BOOLEAN DEFAULT false;
    RAISE NOTICE 'تم إضافة عمود is_shared';
  END IF;
END $$;

-- ===================================================================
-- الآن نحذف جميع Policies القديمة
-- ===================================================================
DROP POLICY IF EXISTS "Lawyers can delete their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers can insert their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers can update their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers can view their own case notes" ON case_notes;
DROP POLICY IF EXISTS "Lawyers manage own case notes" ON case_notes;
DROP POLICY IF EXISTS "case_notes_delete_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_insert_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_select_policy" ON case_notes;
DROP POLICY IF EXISTS "case_notes_update_policy" ON case_notes;

-- ===================================================================
-- نضيف Policies جديدة صحيحة
-- ===================================================================

-- سياسة القراءة
CREATE POLICY "case_notes_select_policy"
ON case_notes FOR SELECT
USING (
  case_id IN (
    SELECT case_id FROM cases 
    WHERE client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    UNION
    SELECT case_id FROM cases 
    WHERE assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- سياسة الإضافة
CREATE POLICY "case_notes_insert_policy"
ON case_notes FOR INSERT
WITH CHECK (
  case_id IN (
    SELECT case_id FROM cases 
    WHERE client_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    AND status = 'active'
    UNION
    SELECT case_id FROM cases 
    WHERE assigned_lawyer_id = (SELECT lawyer_id FROM lawyers WHERE auth_id = auth.uid())
  )
);

-- سياسة التحديث
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

-- سياسة الحذف
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

-- تفعيل RLS
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- التحقق النهائي
-- ===================================================================
SELECT 
  'Final Policies' as info,
  policyname, 
  cmd 
FROM pg_policies 
WHERE tablename = 'case_notes'
ORDER BY cmd;
