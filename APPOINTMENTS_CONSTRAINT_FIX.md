# 🔧 إصلاح Check Constraints لجدول Appointments

## ❌ المشكلة

عند محاولة حجز موعد، يظهر الخطأ:
```
new row for relation "appointments" violates check constraint "appointments_appointment_type_check"
```

### **السبب:**
1. جدول `appointments` لديه constraint على `appointment_type`
2. الـ constraint يتوقع قيم محددة (مثل: `'consultation'`, `'case_review'`)
3. لكن الكود يرسل أسماء الخدمات من `lawyer_services` (مثل: `'مكالمة فيديو'`, `'استشارة قانونية'`)

---

## ✅ الحل

### **إزالة الـ Constraints التي تمنع المرونة**

تم إنشاء ملف SQL:
```
database/fixes/fix_appointments_constraints.sql
```

---

## 🚀 كيفية التطبيق

### **الخطوة 1: افتح Supabase SQL Editor**

### **الخطوة 2: نفذ هذا الـ SQL:**

```sql
-- إزالة constraint على appointment_type
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_appointment_type_check;

-- إزالة constraint على meeting_method
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_meeting_method_check;

-- تحديث constraint على status (اختياري)
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (
  status IN (
    'scheduled',
    'confirmed',
    'pending',
    'completed',
    'cancelled',
    'rescheduled',
    'no_show'
  )
);
```

### **الخطوة 3: تحقق من النجاح**

```sql
-- يجب ألا يظهر appointment_type_check أو meeting_method_check
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass AND contype = 'c';
```

---

## 🧪 اختبر الآن

بعد تنفيذ الـ SQL:

1. **افتح صفحة حجز موعد**
2. **اختر خدمة** (مثل: "مكالمة فيديو")
3. **اختر تاريخ ووقت**
4. **اختر طريقة الاجتماع**
5. **اضغط "تأكيد الحجز"**

**النتيجة المتوقعة:**
- ✅ لا يوجد خطأ constraint
- ✅ رسالة: "تم حجز الموعد بنجاح!"
- ✅ الموعد يُحفظ في Database

---

## 📊 تدفق البيانات

```
BookAppointment.jsx
  ↓
appointmentType = service.service_name  // "مكالمة فيديو"
  ↓
appointmentData = {
  appointment_type: "مكالمة فيديو",  // ✅ أي قيمة مسموحة الآن
  meeting_method: "video_call",
  status: "scheduled"  // ✅ يجب أن تكون من القائمة المحددة
}
  ↓
Database (appointments table)
```

---

## 🔍 لماذا هذا الحل؟

### **المشكلة مع Constraints الثابتة:**
```sql
-- ❌ هذا يمنع المرونة
CHECK (appointment_type IN ('consultation', 'case_review', 'document_review'))
```

**المشاكل:**
1. ❌ لا يدعم اللغة العربية
2. ❌ لا يدعم الخدمات الديناميكية من `lawyer_services`
3. ❌ يتطلب تحديث الـ constraint كل مرة تضيف خدمة جديدة

### **الحل الأفضل:**
```sql
-- ✅ إزالة الـ constraint تماماً
ALTER TABLE appointments DROP CONSTRAINT appointments_appointment_type_check;
```

**الفوائد:**
1. ✅ يدعم أي اسم خدمة (عربي/إنجليزي)
2. ✅ يدعم الخدمات الديناميكية
3. ✅ لا يحتاج صيانة مستقبلية

---

## ⚠️ ملاحظات مهمة

### **1. التحقق من صحة البيانات:**
بدلاً من الاعتماد على Database constraints، يمكن التحقق في الكود:

```javascript
// في BookAppointment.jsx
const handleBooking = async () => {
  // التحقق من أن الخدمة موجودة في lawyer.services
  const serviceExists = lawyer.services.some(s => s.service_name === appointmentType);
  
  if (!serviceExists) {
    alert('الخدمة المحددة غير متاحة');
    return;
  }
  
  // ... باقي الكود
};
```

### **2. الحفاظ على constraint للـ status:**
```sql
-- ✅ هذا مفيد لأن status له قيم محددة
CHECK (status IN ('scheduled', 'confirmed', 'pending', 'completed', 'cancelled', 'rescheduled', 'no_show'))
```

### **3. استخدام Foreign Keys بدلاً من Constraints:**
إذا أردت ربط قوي، يمكن:
1. إنشاء جدول `appointment_types`
2. إضافة Foreign Key من `appointments.appointment_type` إلى `appointment_types.type_name`

لكن هذا معقد ولا يناسب الخدمات الديناميكية.

---

## 🔄 البدائل (إذا أردت الاحتفاظ بالـ Constraint)

### **البديل 1: إضافة جميع القيم الممكنة**
```sql
ALTER TABLE appointments 
ADD CONSTRAINT appointments_appointment_type_check 
CHECK (
  appointment_type IN (
    -- Arabic
    'استشارة قانونية',
    'مراجعة قضية',
    'مراجعة مستندات',
    'مكالمة فيديو',
    'مقابلة شخصية',
    'مكالمة هاتفية',
    -- English
    'consultation',
    'case_review',
    'document_review',
    'video_call',
    'in_person',
    'phone_call'
  )
);
```

**المشكلة**: يجب تحديث الـ constraint كل مرة تضيف خدمة جديدة.

### **البديل 2: استخدام Trigger للتحقق**
```sql
-- إنشاء function للتحقق من أن appointment_type موجود في lawyer_services
CREATE OR REPLACE FUNCTION check_appointment_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM lawyer_services 
    WHERE lawyer_id = NEW.lawyer_id 
    AND service_name = NEW.appointment_type 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid appointment_type for this lawyer';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger
CREATE TRIGGER validate_appointment_type
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION check_appointment_type();
```

**الفائدة**: تحقق ديناميكي من أن الخدمة موجودة للمحامي.

---

## ✨ الخلاصة

**الحل الموصى به:**
1. ✅ إزالة `appointments_appointment_type_check`
2. ✅ إزالة `appointments_meeting_method_check`
3. ✅ الاحتفاظ بـ `appointments_status_check`

**الخطوات:**
1. نفذ الـ SQL في Supabase
2. جرب حجز موعد
3. يجب أن يعمل بدون أخطاء

**الملفات:**
- ✅ `fix_appointments_constraints.sql` - جاهز للتنفيذ
- ✅ `APPOINTMENTS_CONSTRAINT_FIX.md` - التوثيق الكامل

**نفذ الآن! 🚀**
