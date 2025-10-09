# 🔧 إصلاح مشكلة رفع الصور - Storage RLS Error

## ❌ المشكلة:
```
StorageApiError: new row violates row-level security policy
```

## ✅ الحل:

### **الخطوة 1: شغل SQL في Supabase**

اذهب إلى **Supabase Dashboard** → **SQL Editor** وشغل هذا الكود:

```sql
-- انسخ محتوى storage_setup.sql والصقه هنا
```

**ملاحظة:** الكود المحدث في `storage_setup.sql` الآن يسمح للجميع برفع الصور (للتطوير). يمكنك تقييده لاحقاً.

### **الخطوة 2: تأكد من إنشاء Bucket**

1. اذهب إلى **Supabase Dashboard** → **Storage**
2. تأكد من وجود bucket اسمه `avatars`
3. إذا لم يكن موجوداً، اضغط على **"New bucket"** وأنشئه:
   - **Name:** `avatars`
   - **Public bucket:** ✅ (مفعّل)

### **الخطوة 3: تحقق من RLS Policies**

1. اذهب إلى **Storage** → **avatars** → **Policies**
2. يجب أن ترى هذه الـ Policies:
   - ✅ Avatar images are publicly accessible (SELECT)
   - ✅ Anyone can upload avatars (INSERT)
   - ✅ Anyone can update avatars (UPDATE)
   - ✅ Anyone can delete avatars (DELETE)

### **الخطوة 4: أعد تحميل الصفحة**

1. اضغط **Ctrl + Shift + R** (أو Cmd + Shift + R على Mac) لإعادة تحميل كامل
2. جرب رفع صورة مرة أخرى

---

## 🧪 اختبار:

1. اذهب إلى صفحة **الملف الشخصي**
2. اضغط على أيقونة الكاميرا
3. اختر صورة
4. يجب أن ترى:
   - ✅ "جاري رفع الصورة..."
   - ✅ "تم تحديث صورة الملف الشخصي بنجاح"
   - ✅ الصورة تظهر فوراً

---

## 🔍 إذا استمرت المشكلة:

### تحقق من Console:
افتح **Developer Tools** (F12) → **Console** وشوف:
- هل هناك أي أخطاء؟
- هل تظهر رسالة "Upload successful"?

### تحقق من Network:
1. افتح **Developer Tools** → **Network**
2. جرب رفع صورة
3. ابحث عن request اسمه `avatars`
4. شوف الـ Status Code:
   - ✅ **200** = نجح
   - ❌ **403** = مشكلة في RLS
   - ❌ **404** = Bucket غير موجود

---

## 📝 ملاحظات:

- الصور تُرفع مباشرة إلى Supabase Storage
- كل صورة لها اسم فريد: `user_{user_id}_{timestamp}.{extension}`
- حجم الصورة محدود بـ 5 ميجابايت
- الصور المدعومة: JPG, PNG, GIF

---

## 🔒 للأمان (لاحقاً):

بعد ما يشتغل، يمكنك تقييد رفع الصور للمستخدمين المسجلين فقط بتعديل الـ policies في `storage_setup.sql`.






