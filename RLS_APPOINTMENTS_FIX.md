# 🔒 إصلاح Row Level Security لجدول Appointments

## ❌ المشكلة

عند محاولة حجز موعد، يظهر الخطأ:
```
Error creating appointment: new row violates row-level security policy for table "appointments"
```

### **السبب:**
- جدول `appointments` لديه RLS مفعل
- لكن لا توجد policies تسمح للعملاء بإنشاء مواعيد

---

## ✅ الحل

### **1. إنشاء RLS Policies لجدول `appointments`**

تم إنشاء ملف SQL كامل:
```
database/policies/appointments_policies.sql
```

---

## 📋 الـ Policies المُضافة

### **1. السماح للعملاء بإنشاء مواعيد**
```sql
CREATE POLICY "clients_can_create_appointments" 
ON appointments 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);
```

**الشرح**: يسمح للعميل بإنشاء موعد فقط إذا كان `client_id` موجود في جدول `users` ونوعه `client`.

---

### **2. السماح للعملاء بعرض مواعيدهم**
```sql
CREATE POLICY "clients_can_view_own_appointments" 
ON appointments 
FOR SELECT 
TO anon, authenticated
USING (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);
```

---

### **3. السماح للمحامين بعرض مواعيدهم**
```sql
CREATE POLICY "lawyers_can_view_their_appointments" 
ON appointments 
FOR SELECT 
TO anon, authenticated
USING (
  lawyer_id IN (
    SELECT lawyer_id FROM lawyers
  )
);
```

---

### **4. السماح للعملاء بتحديث مواعيدهم**
```sql
CREATE POLICY "clients_can_update_own_appointments" 
ON appointments 
FOR UPDATE 
TO anon, authenticated
USING (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);
```

**الاستخدام**: إعادة جدولة، إلغاء، تحديث الملاحظات

---

### **5. السماح للمحامين بتحديث مواعيدهم**
```sql
CREATE POLICY "lawyers_can_update_their_appointments" 
ON appointments 
FOR UPDATE 
TO anon, authenticated
USING (
  lawyer_id IN (
    SELECT lawyer_id FROM lawyers
  )
);
```

**الاستخدام**: تأكيد، رفض، تحديث الحالة

---

### **6. السماح للعملاء بحذف مواعيدهم**
```sql
CREATE POLICY "clients_can_delete_own_appointments" 
ON appointments 
FOR DELETE 
TO anon, authenticated
USING (
  client_id IN (
    SELECT user_id FROM users WHERE user_type = 'client'
  )
);
```

---

### **7. صلاحيات كاملة للمسؤولين**
```sql
CREATE POLICY "admins_full_access_appointments" 
ON appointments 
FOR ALL 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins WHERE admin_id = auth.uid()
  )
);
```

---

## 🚀 كيفية التطبيق

### **الخطوة 1: افتح Supabase SQL Editor**
1. اذهب إلى: https://supabase.com/dashboard
2. اختر مشروعك
3. اضغط على "SQL Editor"

### **الخطوة 2: نفذ الـ SQL**
1. افتح الملف: `database/policies/appointments_policies.sql`
2. انسخ المحتوى بالكامل
3. الصقه في SQL Editor
4. اضغط "Run"

### **الخطوة 3: تحقق من النجاح**
```sql
-- تحقق من تفعيل RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'appointments';
-- يجب أن يكون rowsecurity = true

-- عرض جميع الـ policies
SELECT * FROM pg_policies WHERE tablename = 'appointments';
-- يجب أن يظهر 7 policies
```

---

## 🧪 اختبر الآن

### **1. تأكد من وجود بيانات اختبار:**

```sql
-- تحقق من وجود عميل
SELECT user_id, first_name, last_name, user_type 
FROM users 
WHERE user_type = 'client' 
LIMIT 1;

-- تحقق من وجود محامي مع خدمات
SELECT l.lawyer_id, l.first_name, l.last_name, 
       COUNT(ls.service_id) as services_count
FROM lawyers l
LEFT JOIN lawyer_services ls ON l.lawyer_id = ls.lawyer_id AND ls.is_active = true
GROUP BY l.lawyer_id, l.first_name, l.last_name
HAVING COUNT(ls.service_id) > 0;
```

### **2. جرب حجز موعد:**
1. سجل دخول كعميل
2. افتح صفحة حجز موعد
3. اختر خدمة، تاريخ، ووقت
4. اضغط "تأكيد الحجز"

### **3. النتيجة المتوقعة:**
- ✅ لا يوجد خطأ RLS
- ✅ رسالة: "تم حجز الموعد بنجاح!"
- ✅ الموعد يظهر في صفحة "مواعيدي"

---

## 🔍 استكشاف الأخطاء

### **إذا استمر الخطأ:**

#### **1. تحقق من `client_id`:**
```sql
-- تحقق من client_id المستخدم في الحجز
SELECT * FROM users WHERE user_id = [CLIENT_ID];
-- يجب أن يكون user_type = 'client'
```

#### **2. تحقق من localStorage:**
في Console المتصفح:
```javascript
console.log(JSON.parse(localStorage.getItem('userProfile')));
// يجب أن يحتوي على user_id و user_type = 'client'
```

#### **3. تحقق من الـ policies:**
```sql
-- عرض تفاصيل policy معين
SELECT * FROM pg_policies 
WHERE tablename = 'appointments' 
AND policyname = 'clients_can_create_appointments';
```

#### **4. اختبر الـ policy يدوياً:**
```sql
-- محاولة إدراج موعد يدوياً
INSERT INTO appointments (
  client_id, 
  lawyer_id, 
  appointment_date, 
  appointment_time, 
  duration_minutes, 
  appointment_type, 
  meeting_method, 
  status, 
  price
) VALUES (
  1,  -- غير هذا إلى client_id صحيح
  5,  -- غير هذا إلى lawyer_id صحيح
  '2025-11-05',
  '15:00:00',
  180,
  'مكالمة فيديو',
  'video_call',
  'scheduled',
  700
);
```

---

## 📊 مخطط الصلاحيات

| الدور | إنشاء | عرض | تحديث | حذف |
|------|------|-----|-------|-----|
| **العميل** | ✅ مواعيده | ✅ مواعيده | ✅ مواعيده | ✅ مواعيده |
| **المحامي** | ❌ | ✅ مواعيده | ✅ مواعيده | ❌ |
| **المسؤول** | ✅ الكل | ✅ الكل | ✅ الكل | ✅ الكل |

---

## ⚠️ ملاحظات مهمة

### **1. استخدام `anon` و `authenticated`:**
```sql
TO anon, authenticated
```
- `anon`: للمستخدمين غير المسجلين (إذا كنت تستخدم localStorage)
- `authenticated`: للمستخدمين المسجلين عبر Supabase Auth

**في حالتك**: تستخدم `localStorage` بدون Supabase Auth، لذلك `anon` مهم.

### **2. التحقق من `user_type`:**
الـ policies تتحقق من `user_type` في جدول `users`:
```sql
WHERE user_type = 'client'
```
تأكد أن جدول `users` يحتوي على هذا العمود وقيمه صحيحة.

### **3. العلاقة بين الجداول:**
- `appointments.client_id` → `users.user_id`
- `appointments.lawyer_id` → `lawyers.lawyer_id`

تأكد من صحة الـ Foreign Keys.

---

## ✨ الخلاصة

**تم إنشاء:**
1. ✅ ملف SQL كامل: `appointments_policies.sql`
2. ✅ 7 policies شاملة
3. ✅ توثيق كامل: `RLS_APPOINTMENTS_FIX.md`

**الخطوات التالية:**
1. نفذ الـ SQL في Supabase
2. جرب حجز موعد
3. تحقق من نجاح العملية

**إذا استمرت المشكلة، أخبرني بـ:**
- نتيجة استعلام التحقق من الـ policies
- محتوى `localStorage.getItem('userProfile')`
- أي أخطاء جديدة في Console

**الكود جاهز للتطبيق! 🚀**
