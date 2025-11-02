# اختبار ميزة البحث عن المحامين

## ✅ المشاكل التي تم إصلاحها

### 1. مشكلة العلاقات مع lawyer_stats
**المشكلة**: كان هناك خطأ في Supabase:
```
"Could not find a relationship between 'lawyers' and 'lawyer_stats'"
```

**السبب**: `lawyer_stats` هو VIEW وليس جدول عادي، لذلك لا يمكن عمل JOIN معه مباشرة.

**الحل**: 
- تم جلب `lawyer_stats` بشكل منفصل باستخدام query ثانية
- استخدام `maybeSingle()` بدلاً من `single()` لتجنب الأخطاء عند عدم وجود بيانات

### 2. التعديلات على الكود
- ✅ `searchLawyers()` - تم إصلاحها
- ✅ `getLawyerById()` - تم إصلاحها
- ✅ معالجة الأخطاء محسّنة

---

## 🧪 كيفية الاختبار

### الخطوة 1: تأكد من وجود بيانات محامين
قم بتشغيل هذا الاستعلام في Supabase SQL Editor:

```sql
-- التحقق من وجود محامين معتمدين
SELECT 
  lawyer_id, 
  first_name, 
  last_name, 
  specialization, 
  city, 
  account_status 
FROM lawyers 
WHERE account_status = 'approved';
```

**إذا لم يكن هناك محامين معتمدين**، قم بتشغيل:

```sql
-- تحديث حالة محامي للاختبار
UPDATE lawyers 
SET account_status = 'approved' 
WHERE lawyer_id = 1; -- غير الرقم حسب المحامي الموجود
```

### الخطوة 2: تأكد من وجود خدمات للمحامين

```sql
-- التحقق من الخدمات
SELECT * FROM lawyer_services WHERE lawyer_id = 1;

-- إضافة خدمة تجريبية إذا لزم الأمر
INSERT INTO lawyer_services (lawyer_id, service_name, description, price, duration_minutes, is_active)
VALUES (1, 'استشارة قانونية', 'استشارة قانونية عامة', 200, 60, true);
```

### الخطوة 3: تأكد من وجود أوقات عمل

```sql
-- التحقق من أوقات العمل
SELECT * FROM lawyer_availability WHERE lawyer_id = 1;

-- إضافة أوقات عمل تجريبية
INSERT INTO lawyer_availability (lawyer_id, day_of_week, start_time, end_time, is_available)
VALUES 
  (1, 0, '09:00', '17:00', true), -- الأحد
  (1, 1, '09:00', '17:00', true), -- الإثنين
  (1, 2, '09:00', '17:00', true), -- الثلاثاء
  (1, 3, '09:00', '17:00', true), -- الأربعاء
  (1, 4, '09:00', '17:00', true); -- الخميس
```

### الخطوة 4: اختبر الصفحة

1. شغل المشروع: `npm run dev`
2. سجل دخول كعميل
3. اذهب إلى: `http://localhost:3000/client/search-lawyers`
4. يجب أن ترى المحامين المعتمدين

---

## 🔍 الميزات المتوفرة

### صفحة البحث
- ✅ بحث بالاسم
- ✅ فلترة حسب التخصص
- ✅ فلترة حسب المدينة
- ✅ فلترة حسب سنوات الخبرة
- ✅ فلترة حسب السعر
- ✅ ترتيب النتائج (7 خيارات)
- ✅ عرض Grid/List
- ✅ Pagination

### صفحة الملف الشخصي
- ✅ معلومات المحامي الكاملة
- ✅ الإحصائيات
- ✅ الخدمات والأسعار
- ✅ ساعات العمل
- ✅ التحقق من التوفر
- ✅ حجز موعد

---

## 🐛 استكشاف الأخطاء

### إذا لم تظهر أي نتائج:
1. تحقق من وجود محامين معتمدين في قاعدة البيانات
2. افتح Console في المتصفح وابحث عن أخطاء
3. تحقق من أن Supabase URL و API Key صحيحة في `.env`

### إذا ظهرت أخطاء في Console:
1. تحقق من أن جميع الجداول موجودة في Supabase
2. تحقق من RLS Policies - قد تحتاج لتعطيلها للاختبار
3. تحقق من أن العلاقات بين الجداول صحيحة

---

## 📊 بيانات تجريبية كاملة

```sql
-- إضافة محامي تجريبي كامل
INSERT INTO lawyers (
  user_type, first_name, last_name, email, phone, city, 
  specialization, years_of_experience, license_number, bio, 
  account_status
) VALUES (
  'lawyer', 'أحمد', 'محمد', 'ahmed@example.com', '0501234567', 'الرياض',
  'قانون جنائي', 10, 'L12345', 'محامي متخصص في القانون الجنائي مع خبرة 10 سنوات',
  'approved'
);

-- احصل على lawyer_id من الاستعلام السابق واستخدمه هنا
-- افترض أن lawyer_id = 1

-- إضافة خدمات
INSERT INTO lawyer_services (lawyer_id, service_name, description, price, duration_minutes, is_active)
VALUES 
  (1, 'استشارة قانونية', 'استشارة قانونية عامة', 200, 60, true),
  (1, 'صياغة عقود', 'صياغة ومراجعة العقود القانونية', 500, 120, true),
  (1, 'تمثيل قانوني', 'تمثيل في المحاكم', 1000, 180, true);

-- إضافة أوقات عمل
INSERT INTO lawyer_availability (lawyer_id, day_of_week, start_time, end_time, is_available)
VALUES 
  (1, 0, '09:00', '17:00', true),
  (1, 1, '09:00', '17:00', true),
  (1, 2, '09:00', '17:00', true),
  (1, 3, '09:00', '17:00', true),
  (1, 4, '09:00', '17:00', true);
```

---

## ✅ النتيجة المتوقعة

بعد تطبيق التعديلات:
- ✅ لا أخطاء في Console
- ✅ تظهر بطاقات المحامين بشكل صحيح
- ✅ الفلاتر تعمل
- ✅ يمكن الدخول للملف الشخصي
- ✅ تظهر الأوقات المتاحة
- ✅ يمكن الانتقال لصفحة الحجز
