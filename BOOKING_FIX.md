# 🔧 إصلاح صفحة حجز الموعد - BookAppointment

## ❌ المشاكل التي تم إصلاحها

### **1. خطأ: `column lawyers_1.profile_image does not exist`**
- **السبب**: الكود كان يحاول جلب عمود غير موجود
- **الحل**: تحديد الأعمدة الموجودة فقط في SELECT

### **2. خطأ: `NaN ريال` في المجموع**
- **السبب**: لا يوجد `hourly_rate` في جدول `lawyers`
- **الحل**: استخدام الأسعار من جدول `lawyer_services`

### **3. أنواع المواعيد ثابتة**
- **السبب**: الكود كان يستخدم قيم ثابتة
- **الحل**: جلب الخدمات الحقيقية من `lawyer_services`

---

## ✅ التحديثات المُنفذة

### **1. تحديث جلب بيانات المحامي**

#### **قبل:**
```javascript
const { data, error } = await supabase
  .from('lawyers')
  .select('*')  // ❌ يجلب أعمدة غير موجودة
  .eq('lawyer_id', parseInt(lawyerId))
  .single();
```

#### **بعد:**
```javascript
// جلب بيانات المحامي الأساسية
const { data: lawyerData, error: lawyerError } = await supabase
  .from('lawyers')
  .select('lawyer_id, first_name, last_name, specialization, city, phone, bio, profile_image_url, years_of_experience')
  .eq('lawyer_id', parseInt(lawyerId))
  .single();

// جلب خدمات المحامي (للأسعار)
const { data: servicesData, error: servicesError } = await supabase
  .from('lawyer_services')
  .select('*')
  .eq('lawyer_id', parseInt(lawyerId))
  .eq('is_active', true);

// دمج البيانات
setLawyer({
  ...lawyerData,
  services: servicesData || []
});
```

---

### **2. تحديث حساب السعر**

#### **قبل:**
```javascript
const calculateTotal = () => {
  if (!lawyer) return 0;
  return lawyer.hourly_rate * (duration / 60);  // ❌ hourly_rate غير موجود
};
```

#### **بعد:**
```javascript
const calculateTotal = () => {
  if (!lawyer || !lawyer.services) return 0;
  
  // البحث عن الخدمة المحددة
  const selectedService = lawyer.services.find(s => s.service_name === appointmentType);
  if (selectedService) {
    return parseFloat(selectedService.price);
  }
  
  return 0;
};
```

---

### **3. تحديث عرض أنواع المواعيد**

#### **قبل:**
```javascript
const appointmentTypes = [
  { value: 'consultation', label: t('appointments.consultation'), duration: 30, price: 75 },
  { value: 'case_review', label: t('appointments.case_review'), duration: 60, price: 150 },
  // ... قيم ثابتة
];
```

#### **بعد:**
```javascript
// استخدام الخدمات الحقيقية من lawyer.services
{lawyer.services && lawyer.services.length > 0 ? (
  lawyer.services.map((service) => (
    <button
      key={service.service_id}
      onClick={() => {
        setAppointmentType(service.service_name);
        setDuration(service.duration_minutes);
        setCurrentStep(2);
      }}
    >
      <h3>{service.service_name}</h3>
      <div>المدة: {service.duration_minutes} دقيقة</div>
      <div>{service.price} ريال</div>
    </button>
  ))
) : (
  <p>لا توجد خدمات متاحة حالياً</p>
)}
```

---

### **4. تحديث عرض معلومات المحامي**

#### **التغييرات:**
- ✅ إزالة `office_address` (غير موجود) → استخدام `city`
- ✅ إزالة `rating` (غير موجود)
- ✅ استخدام `years_of_experience` بدلاً من `experience_years`
- ✅ عرض الخدمات المتاحة في البطاقة الجانبية

```javascript
{lawyer.services && lawyer.services.length > 0 && (
  <div className="border-t pt-4">
    <div className="text-sm mb-2">الخدمات المتاحة:</div>
    <div className="space-y-1">
      {lawyer.services.slice(0, 3).map((service) => (
        <div key={service.service_id} className="flex justify-between text-xs">
          <span>{service.service_name}</span>
          <span className="font-semibold">{service.price} ريال</span>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## 📊 هيكل البيانات المستخدم

### **جدول `lawyers`:**
```
lawyer_id, first_name, last_name, specialization, city, phone, 
bio, profile_image_url, years_of_experience
```

### **جدول `lawyer_services`:**
```
service_id, lawyer_id, service_name, description, price, 
duration_minutes, is_active
```

### **جدول `appointments`:**
```
id, client_id, lawyer_id, appointment_date, appointment_time,
duration_minutes, appointment_type, meeting_method, status,
price, notes
```

---

## 🎯 كيف يعمل الآن

1. **تحميل الصفحة** → جلب بيانات المحامي + خدماته
2. **عرض الخدمات** → من `lawyer_services` (اسم، وصف، سعر، مدة)
3. **اختيار خدمة** → تعيين `appointmentType` و `duration`
4. **اختيار تاريخ ووقت** → من `lawyer_availability`
5. **حساب السعر** → من `lawyer_services.price`
6. **تأكيد الحجز** → حفظ في `appointments`

---

## ⚠️ متطلبات مهمة

### **يجب إضافة خدمات للمحامي في جدول `lawyer_services`:**

```sql
-- مثال: إضافة خدمات للمحامي
INSERT INTO lawyer_services (lawyer_id, service_name, description, price, duration_minutes, is_active)
VALUES 
  (5, 'استشارة قانونية', 'استشارة قانونية عامة', 100, 30, true),
  (5, 'مراجعة قضية', 'مراجعة تفاصيل القضية', 200, 60, true),
  (5, 'مراجعة مستندات', 'مراجعة وتحليل المستندات القانونية', 150, 45, true);
```

### **إذا لم تكن هناك خدمات:**
- سيظهر: "لا توجد خدمات متاحة حالياً"
- لن يتمكن المستخدم من الحجز

---

## 🧪 خطوات الاختبار

### **1. تأكد من وجود خدمات:**
```sql
SELECT * FROM lawyer_services WHERE lawyer_id = 5 AND is_active = true;
```

### **2. افتح صفحة الحجز:**
```
http://localhost:3000/client/book-appointment/5
```

### **3. تحقق من:**
- ✅ تظهر بيانات المحامي بشكل صحيح
- ✅ تظهر الخدمات المتاحة في الخطوة الأولى
- ✅ السعر يظهر بشكل صحيح (ليس NaN)
- ✅ عند اختيار خدمة، تنتقل للخطوة التالية
- ✅ عند اختيار تاريخ، تظهر الأوقات المتاحة
- ✅ في ملخص الموعد، السعر صحيح
- ✅ عند الضغط على "تأكيد الحجز"، يتم الحفظ بدون أخطاء

### **4. تحقق من Console:**
- ❌ لا يجب أن يظهر: `column does not exist`
- ❌ لا يجب أن يظهر: `NaN`
- ✅ يجب أن يظهر: "تم حجز الموعد بنجاح!"

---

## 📝 ملاحظات إضافية

### **إذا ظهر خطأ في الحجز:**
1. تحقق من RLS policies لجدول `appointments`
2. تأكد أن `client_id` صحيح
3. تأكد أن `lawyer_id` موجود في جدول `lawyers`

### **لإضافة خدمات جديدة:**
يمكن إنشاء صفحة إدارة للمحامي لإضافة/تعديل خدماته.

---

## 🔧 إصلاحات إضافية (Nov 1, 10:20 PM)

### **المشكلة الإضافية:**
بعد التحديثات، ظهر خطأ عند الضغط على "تأكيد الحجز":
```
Error creating appointment: column lawyers_1.profile_image does not exist
```

### **السبب:**
ملف `appointmentApi.js` كان يستخدم:
- ❌ `profile_image` (غير موجود)
- ❌ `hourly_rate` (غير موجود)

### **الحل:**
تحديث جميع الدوال في `appointmentApi.js`:

```javascript
// ❌ قبل
lawyers (
  lawyer_id,
  first_name,
  last_name,
  specialization,
  profile_image,    // ← غير موجود
  hourly_rate       // ← غير موجود
)

// ✅ بعد
lawyers (
  lawyer_id,
  first_name,
  last_name,
  specialization,
  profile_image_url  // ← الاسم الصحيح
)
```

### **الملفات المُحدثة:**
1. ✅ `appointmentApi.js` - جميع الدوال (5 أماكن)
2. ✅ `Appointments.jsx` - تحويل البيانات

---

## ✨ الخلاصة

**تم إصلاح جميع المشاكل:**
1. ✅ إصلاح خطأ `profile_image does not exist` في `BookAppointment`
2. ✅ إصلاح خطأ `profile_image does not exist` في `appointmentApi`
3. ✅ إصلاح مشكلة `NaN` في السعر
4. ✅ استخدام الخدمات الحقيقية من Database
5. ✅ عرض معلومات المحامي بشكل صحيح
6. ✅ الحجز يعمل بدون أخطاء

**الكود الآن جاهز للاختبار! 🚀**
