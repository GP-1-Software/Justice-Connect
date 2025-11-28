-- =====================================================
-- RLS Policies لحماية القضايا المعطلة
-- Case Disable Protection - RLS Policies
-- =====================================================

-- ملاحظة: هذه الـ policies تمنع أي تعديلات على القضايا المعطلة
-- من قبل العملاء والمحامين، ويسمح فقط للأدمن بالتعديل

-- =====================================================
-- 1. منع إضافة مهام للقضايا المعطلة
-- =====================================================

-- حذف الـ policy القديمة إن وجدت
DROP POLICY IF EXISTS "prevent_task_insert_on_disabled_cases" ON case_tasks;

-- إنشاء policy جديدة
CREATE POLICY "prevent_task_insert_on_disabled_cases"
ON case_tasks FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM cases 
    WHERE case_id = case_tasks.case_id 
    AND is_disabled = TRUE
  )
);

COMMENT ON POLICY "prevent_task_insert_on_disabled_cases" ON case_tasks IS 
'منع إضافة مهام جديدة للقضايا المعطلة من قبل الإدارة';

-- =====================================================
-- 2. منع تحديث المهام للقضايا المعطلة
-- =====================================================

DROP POLICY IF EXISTS "prevent_task_update_on_disabled_cases" ON case_tasks;

CREATE POLICY "prevent_task_update_on_disabled_cases"
ON case_tasks FOR UPDATE
USING (
  NOT EXISTS (
    SELECT 1 FROM cases 
    WHERE case_id = case_tasks.case_id 
    AND is_disabled = TRUE
  )
);

COMMENT ON POLICY "prevent_task_update_on_disabled_cases" ON case_tasks IS 
'منع تحديث المهام للقضايا المعطلة';

-- =====================================================
-- 3. منع رفع ملفات للقضايا المعطلة
-- =====================================================

DROP POLICY IF EXISTS "prevent_file_upload_on_disabled_cases" ON case_files;

CREATE POLICY "prevent_file_upload_on_disabled_cases"
ON case_files FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM cases 
    WHERE case_id = case_files.case_id 
    AND is_disabled = TRUE
  )
);

COMMENT ON POLICY "prevent_file_upload_on_disabled_cases" ON case_files IS 
'منع رفع ملفات جديدة للقضايا المعطلة';

-- =====================================================
-- 4. منع حذف ملفات من القضايا المعطلة
-- =====================================================

DROP POLICY IF EXISTS "prevent_file_delete_on_disabled_cases" ON case_files;

CREATE POLICY "prevent_file_delete_on_disabled_cases"
ON case_files FOR DELETE
USING (
  NOT EXISTS (
    SELECT 1 FROM cases 
    WHERE case_id = case_files.case_id 
    AND is_disabled = TRUE
  )
);

COMMENT ON POLICY "prevent_file_delete_on_disabled_cases" ON case_files IS 
'منع حذف ملفات من القضايا المعطلة';

-- =====================================================
-- 5. منع إضافة ملاحظات للقضايا المعطلة
-- =====================================================

DROP POLICY IF EXISTS "prevent_notes_insert_on_disabled_cases" ON case_notes;

CREATE POLICY "prevent_notes_insert_on_disabled_cases"
ON case_notes FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM cases 
    WHERE case_id = case_notes.case_id 
    AND is_disabled = TRUE
  )
);

COMMENT ON POLICY "prevent_notes_insert_on_disabled_cases" ON case_notes IS 
'منع إضافة ملاحظات جديدة للقضايا المعطلة';

-- =====================================================
-- 6. منع تحديث الملاحظات للقضايا المعطلة
-- =====================================================

DROP POLICY IF EXISTS "prevent_notes_update_on_disabled_cases" ON case_notes;

CREATE POLICY "prevent_notes_update_on_disabled_cases"
ON case_notes FOR UPDATE
USING (
  NOT EXISTS (
    SELECT 1 FROM cases 
    WHERE case_id = case_notes.case_id 
    AND is_disabled = TRUE
  )
);

COMMENT ON POLICY "prevent_notes_update_on_disabled_cases" ON case_notes IS 
'منع تحديث الملاحظات للقضايا المعطلة';

-- =====================================================
-- 7. منع حذف الملاحظات من القضايا المعطلة
-- =====================================================

DROP POLICY IF EXISTS "prevent_notes_delete_on_disabled_cases" ON case_notes;

CREATE POLICY "prevent_notes_delete_on_disabled_cases"
ON case_notes FOR DELETE
USING (
  NOT EXISTS (
    SELECT 1 FROM cases 
    WHERE case_id = case_notes.case_id 
    AND is_disabled = TRUE
  )
);

COMMENT ON POLICY "prevent_notes_delete_on_disabled_cases" ON case_notes IS 
'منع حذف الملاحظات من القضايا المعطلة';

-- =====================================================
-- 8. منع تحديث حالة القضية للقضايا المعطلة
-- (إلا من قبل الأدمن)
-- =====================================================

DROP POLICY IF EXISTS "prevent_case_status_update_when_disabled" ON cases;

CREATE POLICY "prevent_case_status_update_when_disabled"
ON cases FOR UPDATE
USING (
  -- السماح بالتحديث فقط إذا:
  -- 1. القضية غير معطلة، أو
  -- 2. المستخدم هو أدمن
  is_disabled = FALSE 
  OR 
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admin_id = auth.uid()::INTEGER
  )
);

COMMENT ON POLICY "prevent_case_status_update_when_disabled" ON cases IS 
'منع تحديث القضايا المعطلة إلا من قبل الأدمن';

-- =====================================================
-- 9. منع إضافة أحداث timeline للقضايا المعطلة
-- =====================================================

DROP POLICY IF EXISTS "prevent_timeline_insert_on_disabled_cases" ON timeline_events;

CREATE POLICY "prevent_timeline_insert_on_disabled_cases"
ON timeline_events FOR INSERT
WITH CHECK (
  -- السماح بالإضافة فقط إذا:
  -- 1. القضية غير معطلة، أو
  -- 2. نوع الحدث هو case_disabled/case_enabled (من الأدمن)
  NOT EXISTS (
    SELECT 1 FROM cases 
    WHERE case_id = timeline_events.case_id 
    AND is_disabled = TRUE
  )
  OR
  event_type IN ('case_disabled', 'case_enabled')
);

COMMENT ON POLICY "prevent_timeline_insert_on_disabled_cases" ON timeline_events IS 
'منع إضافة أحداث timeline للقضايا المعطلة (إلا أحداث التعطيل/التفعيل)';

-- =====================================================
-- 10. منع حجز مواعيد للقضايا المعطلة
-- =====================================================

-- ملاحظة: إذا كان لديك جدول appointments مرتبط بالقضايا
-- يمكنك إضافة policy مشابهة

DROP POLICY IF EXISTS "prevent_appointment_on_disabled_cases" ON appointments;

CREATE POLICY "prevent_appointment_on_disabled_cases"
ON appointments FOR INSERT
WITH CHECK (
  -- إذا كان الموعد مرتبط بقضية، تحقق من أنها غير معطلة
  (
    related_case_id IS NULL
    OR
    NOT EXISTS (
      SELECT 1 FROM cases 
      WHERE case_id = appointments.related_case_id 
      AND is_disabled = TRUE
    )
  )
);

COMMENT ON POLICY "prevent_appointment_on_disabled_cases" ON appointments IS 
'منع حجز مواعيد للقضايا المعطلة';

-- =====================================================
-- 11. دالة مساعدة للتحقق من حالة القضية
-- =====================================================

CREATE OR REPLACE FUNCTION is_case_disabled(p_case_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_disabled BOOLEAN;
BEGIN
  SELECT is_disabled INTO v_is_disabled
  FROM cases
  WHERE case_id = p_case_id;
  
  RETURN COALESCE(v_is_disabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_case_disabled IS 
'دالة للتحقق من حالة تعطيل القضية';

-- =====================================================
-- 12. دالة للتحقق من صلاحية الأدمن
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE admin_id = auth.uid()::INTEGER
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin IS 
'دالة للتحقق من أن المستخدم الحالي هو أدمن';

-- =====================================================
-- 13. View لعرض القضايا المعطلة مع التفاصيل
-- =====================================================

CREATE OR REPLACE VIEW disabled_cases_view AS
SELECT 
  c.case_id,
  c.title,
  c.case_number,
  c.client_id,
  c.assigned_lawyer_id,
  c.status,
  c.is_disabled,
  c.disabled_at,
  c.disabled_by,
  c.disabled_reason,
  c.disabled_admin_notes,
  u.first_name || ' ' || u.last_name AS client_name,
  l.first_name || ' ' || l.last_name AS lawyer_name,
  a.first_name || ' ' || a.last_name AS disabled_by_admin_name,
  a.role AS admin_role
FROM cases c
LEFT JOIN users u ON c.client_id = u.user_id
LEFT JOIN lawyers l ON c.assigned_lawyer_id = l.lawyer_id
LEFT JOIN admins a ON c.disabled_by = a.admin_id
WHERE c.is_disabled = TRUE
ORDER BY c.disabled_at DESC;

COMMENT ON VIEW disabled_cases_view IS 
'عرض شامل للقضايا المعطلة مع تفاصيل العميل والمحامي والأدمن';

-- =====================================================
-- 14. Trigger لمنع تحديث is_disabled من غير الأدمن
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_unauthorized_disable()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم تغيير is_disabled
  IF NEW.is_disabled IS DISTINCT FROM OLD.is_disabled THEN
    -- تحقق من أن المستخدم هو أدمن
    IF NOT is_admin() THEN
      RAISE EXCEPTION 'فقط الأدمن يمكنه تعطيل أو تفعيل القضايا';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_unauthorized_disable ON cases;

CREATE TRIGGER trigger_prevent_unauthorized_disable
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION prevent_unauthorized_disable();

COMMENT ON TRIGGER trigger_prevent_unauthorized_disable ON cases IS 
'منع تعطيل/تفعيل القضايا من غير الأدمن';

-- =====================================================
-- 15. استعلامات للتحقق من الـ Policies
-- =====================================================

-- عرض جميع الـ policies المتعلقة بالقضايا المعطلة
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual
-- FROM pg_policies
-- WHERE policyname LIKE '%disabled%'
-- ORDER BY tablename, policyname;

-- =====================================================
-- ملاحظات مهمة:
-- =====================================================

-- 1. تأكد من أن RLS مفعل على جميع الجداول
-- 2. هذه الـ policies تعمل على مستوى قاعدة البيانات
-- 3. يجب أيضاً إضافة التحقق في Frontend للـ UX الأفضل
-- 4. الأدمن فقط يمكنه تعطيل/تفعيل القضايا
-- 5. جميع العمليات على القضايا المعطلة ممنوعة

-- =====================================================
-- التفعيل:
-- =====================================================

-- لتفعيل هذه الـ policies، نفذ هذا الملف في Supabase SQL Editor
-- أو باستخدام:
-- psql -h [host] -U [user] -d [database] -f case_disable_rls_policies.sql

-- =====================================================
