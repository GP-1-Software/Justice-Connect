-- ===================================================================
-- Script للتشخيص والتحقق من Auth
-- ===================================================================
-- استخدم هذا الـ Script للتأكد من أن كل شيء صحيح
-- ===================================================================

-- ملاحظة مهمة:
-- عشان auth.uid() يشتغل في SQL Editor، لازم تستخدم طريقة مختلفة
-- لأن SQL Editor ما بيعرف مين المستخدم المسجل دخول

-- ===================================================================
-- الطريقة الصحيحة للاختبار:
-- ===================================================================

-- 1. في الواجهة، افتح Console (F12) وشغّل:
--    const { data: { user } } = await supabase.auth.getUser();
--    console.log('Auth ID:', user?.id);
--    console.log('Email:', user?.email);

-- 2. انسخ الـ Auth ID واستبدله في الـ Query التالي:

-- مثال: استبدل 'YOUR_AUTH_ID_HERE' بالـ Auth ID الحقيقي
SELECT 
  'User Info' as info,
  user_id,
  auth_id,
  email,
  first_name,
  last_name
FROM users 
WHERE auth_id = 'YOUR_AUTH_ID_HERE';

-- 3. تحقق من القضايا لهذا المستخدم:
SELECT 
  'Cases' as info,
  case_id,
  title,
  status,
  client_id,
  assigned_lawyer_id
FROM cases 
WHERE client_id = (
  SELECT user_id FROM users WHERE auth_id = 'YOUR_AUTH_ID_HERE'
);

-- 4. تحقق من الملاحظات الموجودة:
SELECT 
  'Notes' as info,
  note_id,
  case_id,
  created_by_type,
  created_by_id,
  is_shared,
  LEFT(content, 50) as content_preview
FROM case_notes
WHERE case_id IN (
  SELECT case_id FROM cases 
  WHERE client_id = (
    SELECT user_id FROM users WHERE auth_id = 'YOUR_AUTH_ID_HERE'
  )
);

-- ===================================================================
-- إذا ما لقيت المستخدم في جدول users:
-- ===================================================================
-- معناها لازم تضيفه:

-- INSERT INTO users (auth_id, email, first_name, last_name, phone, city)
-- VALUES (
--   'YOUR_AUTH_ID_HERE',
--   'your-email@example.com',
--   'First Name',
--   'Last Name',
--   '0501234567',
--   'City'
-- );

-- ===================================================================
-- إذا لقيت المستخدم لكن ما عنده قضايا:
-- ===================================================================
-- معناها لازم تضيف قضية:

-- INSERT INTO cases (client_id, title, description, status, case_type)
-- VALUES (
--   (SELECT user_id FROM users WHERE auth_id = 'YOUR_AUTH_ID_HERE'),
--   'قضية تجريبية',
--   'وصف القضية',
--   'active',
--   'civil'
-- );

-- ===================================================================
