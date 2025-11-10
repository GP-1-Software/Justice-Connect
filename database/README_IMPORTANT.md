# ⚠️ مهم جداً - اقرأ هذا أولاً!

## 🔴 المشكلة الحالية

```
Error: new row violates row-level security policy for table "case_notes"
Code: 42501
```

## ✅ الحل (خطوة بخطوة)

### **الخطوة 1: افتح Supabase Dashboard** 🌐

1. اذهب إلى: https://supabase.com
2. افتح مشروعك: Justice-Connect
3. اذهب إلى: **SQL Editor**

---

### **الخطوة 2: شغّل الـ SQL Script** 📝

1. افتح الملف: `database/fix_case_notes_rls.sql`
2. انسخ **كل** محتوى الملف
3. في Supabase SQL Editor:
   - الصق الكود
   - اضغط **Run** (أو Ctrl+Enter)
4. انتظر النتيجة:
   - ✅ يجب أن تشوف: "Success. No rows returned"
   - ❌ إذا في خطأ، أرسل لي الخطأ

---

### **الخطوة 3: تحقق من Policies** 🔍

1. في Supabase Dashboard:
   - اذهب إلى: **Database** → **Tables** → **case_notes**
   - اضغط على تاب **Policies**
2. يجب أن تشوف 4 policies:
   - ✅ `case_notes_select_policy`
   - ✅ `case_notes_insert_policy`
   - ✅ `case_notes_update_policy`
   - ✅ `case_notes_delete_policy`

---

### **الخطوة 4: فعّل Realtime** 🔄

1. في Supabase Dashboard:
   - اذهب إلى: **Database** → **Replication**
2. ابحث عن جدول `case_notes`
3. فعّل:
   - ✅ Enable Realtime
   - ✅ INSERT events
   - ✅ UPDATE events
   - ✅ DELETE events
4. اضغط **Save**

---

### **الخطوة 5: جرب الآن!** 🚀

1. ارجع للواجهة
2. افتح صفحة تفاصيل قضية (حالتها `active`)
3. جرب إضافة ملاحظة
4. يجب أن تشتغل! ✅

---

## 🔍 تشخيص المشاكل

### **إذا لسا في خطأ:**

#### **1. تحقق من حالة القضية:**
```sql
-- في SQL Editor:
SELECT case_id, status FROM cases WHERE case_id = YOUR_CASE_ID;
```
- يجب أن تكون `status = 'active'`

#### **2. تحقق من auth_id:**
```sql
-- في SQL Editor:
SELECT auth.uid();
```
- يجب أن يرجع UUID

#### **3. تحقق من user_id:**
```sql
-- في SQL Editor:
SELECT user_id FROM users WHERE auth_id = auth.uid();
```
- يجب أن يرجع رقم

#### **4. تحقق من client_id في القضية:**
```sql
-- في SQL Editor:
SELECT client_id FROM cases WHERE case_id = YOUR_CASE_ID;
```
- يجب أن يطابق user_id

---

## 📊 هيكل الجداول المطلوب

### **جدول cases:**
```
- case_id (integer)
- client_id (integer) ← يطابق users.user_id
- assigned_lawyer_id (integer) ← يطابق lawyers.lawyer_id
- status (varchar) ← 'active', 'pending', 'closed', etc.
```

### **جدول users:**
```
- user_id (integer)
- auth_id (uuid) ← من Supabase Auth
```

### **جدول case_notes:**
```
- note_id (integer)
- case_id (integer)
- created_by_type (varchar) ← 'client' or 'lawyer'
- created_by_id (integer) ← user_id أو lawyer_id
- is_shared (boolean)
- content (text)
```

---

## ⚡ نصائح مهمة

### **1. تأكد من تسجيل الدخول:**
```javascript
// في Console:
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

### **2. تأكد من userProfile:**
```javascript
// في Console:
console.log('userProfile:', userProfile);
// يجب أن يحتوي على: user_id
```

### **3. تأكد من caseId:**
```javascript
// في Console:
console.log('caseId:', caseId);
// يجب أن يكون رقم
```

---

## 🎯 الخلاصة

**الترتيب الصحيح:**
1. ✅ شغّل SQL Script في Supabase
2. ✅ تحقق من Policies
3. ✅ فعّل Realtime
4. ✅ جرب في الواجهة

**لا تنسى:**
- ❌ لا تجرب في الواجهة قبل تشغيل الـ Script!
- ❌ لا تنسى تفعيل Realtime!
- ❌ تأكد من أن القضية حالتها `active`!

---

## 📞 إذا لسا في مشكلة

أرسل لي:
1. Screenshot من Policies في Supabase
2. نتيجة هذا الـ Query:
```sql
SELECT case_id, client_id, status FROM cases WHERE case_id = YOUR_CASE_ID;
```
3. نتيجة هذا الـ Query:
```sql
SELECT user_id, auth_id FROM users WHERE auth_id = auth.uid();
```

**وأنا راح أساعدك!** 🚀
