-- =====================================================
-- Test Data for Admin Enhancements
-- بيانات تجريبية لاختبار تحسينات الأدمن
-- =====================================================

-- Note: هذا الملف اختياري - فقط للاختبار
-- لا تقم بتنفيذه في بيئة الإنتاج!

-- =====================================================
-- 1. إضافة بعض الإعدادات التجريبية
-- =====================================================

INSERT INTO system_settings (setting_key, setting_value, setting_category, description) VALUES
('max_cases_per_lawyer', '{"limit": 50}', 'general', 'الحد الأقصى للقضايا لكل محامي'),
('auto_assign_cases', '{"enabled": false}', 'general', 'التعيين التلقائي للقضايا'),
('case_approval_required', '{"enabled": true}', 'general', 'يتطلب موافقة الأدمن على القضايا الجديدة'),
('notification_email_enabled', '{"enabled": true}', 'email', 'إرسال إشعارات البريد الإلكتروني'),
('sms_notifications_enabled', '{"enabled": false}', 'notifications', 'إرسال إشعارات SMS'),
('maintenance_window', '{"start": "02:00", "end": "04:00"}', 'general', 'نافذة الصيانة اليومية')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 2. إضافة بعض النشاطات التجريبية
-- (فقط إذا كان لديك admin_id = 1)
-- =====================================================

-- تحقق من وجود أدمن أولاً
DO $$
DECLARE
    v_admin_id INTEGER;
    v_admin_name VARCHAR;
BEGIN
    -- جلب أول أدمن
    SELECT admin_id, first_name || ' ' || last_name 
    INTO v_admin_id, v_admin_name
    FROM admins 
    LIMIT 1;
    
    -- إذا كان هناك أدمن، أضف نشاطات تجريبية
    IF v_admin_id IS NOT NULL THEN
        INSERT INTO admin_activity_logs (
            admin_id,
            admin_name,
            action_type,
            target_type,
            target_id,
            target_name,
            description,
            metadata
        ) VALUES
        (
            v_admin_id,
            v_admin_name,
            'approve_user',
            'user',
            '1',
            'مستخدم تجريبي',
            'تم قبول المستخدم في النظام',
            '{"previous_status": "pending", "new_status": "approved"}'::jsonb
        ),
        (
            v_admin_id,
            v_admin_name,
            'approve_lawyer',
            'lawyer',
            '1',
            'محامي تجريبي',
            'تم قبول المحامي في النظام',
            '{"previous_status": "pending", "new_status": "approved"}'::jsonb
        ),
        (
            v_admin_id,
            v_admin_name,
            'update_settings',
            'system',
            'platform_commission_rate',
            'نسبة العمولة',
            'تم تحديث نسبة عمولة المنصة',
            '{"old_value": 5, "new_value": 10}'::jsonb
        );
        
        RAISE NOTICE 'تم إضافة نشاطات تجريبية للأدمن: %', v_admin_name;
    ELSE
        RAISE NOTICE 'لا يوجد أدمن في النظام - تخطي إضافة النشاطات التجريبية';
    END IF;
END $$;

-- =====================================================
-- 3. إضافة إشعارات تجريبية للأدمن
-- =====================================================

DO $$
DECLARE
    v_admin_id INTEGER;
BEGIN
    -- جلب أول أدمن
    SELECT admin_id INTO v_admin_id FROM admins LIMIT 1;
    
    IF v_admin_id IS NOT NULL THEN
        INSERT INTO admin_notifications (
            admin_id,
            title,
            message,
            type,
            priority,
            related_type,
            related_id
        ) VALUES
        (
            v_admin_id,
            'مستخدم جديد في الانتظار',
            'هناك مستخدم جديد ينتظر الموافقة على حسابه',
            'info',
            'normal',
            'user',
            '1'
        ),
        (
            v_admin_id,
            'طلب حذف حساب',
            'هناك طلب جديد لحذف حساب يحتاج إلى مراجعة',
            'warning',
            'high',
            'deletion_request',
            '1'
        ),
        (
            v_admin_id,
            'تذكرة دعم فني جديدة',
            'تم فتح تذكرة دعم فني جديدة تحتاج إلى رد',
            'info',
            'normal',
            'support_ticket',
            '1'
        );
        
        RAISE NOTICE 'تم إضافة إشعارات تجريبية للأدمن';
    END IF;
END $$;

-- =====================================================
-- 4. دالة مساعدة لتوليد نشاطات عشوائية
-- =====================================================

CREATE OR REPLACE FUNCTION generate_random_activities(
    p_admin_id INTEGER,
    p_admin_name VARCHAR,
    p_count INTEGER DEFAULT 20
) RETURNS void AS $$
DECLARE
    v_action_types VARCHAR[] := ARRAY['approve_user', 'reject_user', 'approve_lawyer', 'reject_lawyer', 'disable_case', 'enable_case'];
    v_target_types VARCHAR[] := ARRAY['user', 'lawyer', 'case'];
    v_descriptions VARCHAR[] := ARRAY[
        'تم قبول المستخدم بنجاح',
        'تم رفض المستخدم',
        'تم قبول المحامي',
        'تم رفض المحامي',
        'تم تعطيل القضية',
        'تم تفعيل القضية'
    ];
    i INTEGER;
BEGIN
    FOR i IN 1..p_count LOOP
        INSERT INTO admin_activity_logs (
            admin_id,
            admin_name,
            action_type,
            target_type,
            target_id,
            target_name,
            description,
            created_at
        ) VALUES (
            p_admin_id,
            p_admin_name,
            v_action_types[1 + floor(random() * array_length(v_action_types, 1))],
            v_target_types[1 + floor(random() * array_length(v_target_types, 1))],
            floor(random() * 100 + 1)::VARCHAR,
            'هدف تجريبي ' || i,
            v_descriptions[1 + floor(random() * array_length(v_descriptions, 1))],
            NOW() - (random() * INTERVAL '30 days')
        );
    END LOOP;
    
    RAISE NOTICE 'تم إنشاء % نشاط تجريبي', p_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. دالة لتنظيف البيانات التجريبية
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_test_data() RETURNS void AS $$
BEGIN
    -- حذف النشاطات التجريبية
    DELETE FROM admin_activity_logs 
    WHERE description LIKE '%تجريبي%' 
    OR target_name LIKE '%تجريبي%';
    
    -- حذف الإشعارات التجريبية
    DELETE FROM admin_notifications 
    WHERE message LIKE '%تجريبي%';
    
    -- حذف الإعدادات التجريبية (اختياري)
    -- DELETE FROM system_settings WHERE setting_key IN ('max_cases_per_lawyer', 'auto_assign_cases');
    
    RAISE NOTICE 'تم تنظيف البيانات التجريبية';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. استعلامات مفيدة للاختبار
-- =====================================================

-- عرض آخر 20 نشاط
-- SELECT * FROM admin_activity_logs ORDER BY created_at DESC LIMIT 20;

-- عرض الإحصائيات
-- SELECT get_admin_dashboard_stats();

-- عرض القضايا المعطلة
-- SELECT case_id, title, disabled_reason, disabled_at 
-- FROM cases 
-- WHERE is_disabled = TRUE;

-- عرض الإشعارات غير المقروءة
-- SELECT * FROM admin_notifications 
-- WHERE is_read = FALSE 
-- ORDER BY created_at DESC;

-- =====================================================
-- 7. أمثلة على استخدام الدوال
-- =====================================================

-- مثال: توليد 50 نشاط عشوائي
-- SELECT generate_random_activities(1, 'أدمن تجريبي', 50);

-- مثال: تنظيف البيانات التجريبية
-- SELECT cleanup_test_data();

-- مثال: تسجيل نشاط يدوياً
-- SELECT log_admin_activity(
--     1,                          -- admin_id
--     'أحمد محمد',                -- admin_name
--     'approve_user',             -- action_type
--     'user',                     -- target_type
--     '123',                      -- target_id
--     'محمد علي',                 -- target_name
--     'تم قبول المستخدم بنجاح',   -- description
--     '{"notes": "مستخدم موثوق"}'::jsonb  -- metadata
-- );

-- =====================================================
-- ملاحظات مهمة:
-- =====================================================

-- 1. هذا الملف للاختبار فقط - لا تستخدمه في الإنتاج
-- 2. تأكد من تنفيذ admin_enhancements.sql أولاً
-- 3. يمكنك تعديل البيانات حسب احتياجاتك
-- 4. استخدم cleanup_test_data() لحذف البيانات التجريبية

COMMENT ON FUNCTION generate_random_activities IS 'دالة لتوليد نشاطات عشوائية للاختبار';
COMMENT ON FUNCTION cleanup_test_data IS 'دالة لحذف جميع البيانات التجريبية';
