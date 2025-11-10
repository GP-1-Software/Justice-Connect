# 📄 دليل ميزة طباعة تقرير القضية

## 🎯 **نظرة عامة**

ميزة توليد تقرير PDF شامل للقضية باستخدام `@react-pdf/renderer` مع حفظ تلقائي في Supabase Storage وتسجيل في قاعدة البيانات.

---

## 📊 **المكونات الرئيسية**

### **1. قاعدة البيانات**

#### **جدول case_reports:**
```sql
CREATE TABLE case_reports (
  report_id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES cases(case_id),
  generated_by INTEGER,
  generated_by_type VARCHAR(10),
  report_title VARCHAR(150),
  report_description TEXT,
  report_type VARCHAR(50),
  file_url TEXT,
  file_size INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **RLS Policies:**
- ✅ القراءة: للعملاء والمحامين المرتبطين بالقضية
- ✅ الإضافة: للعملاء والمحامين المرتبطين بالقضية
- ✅ الحذف: للمستخدم الذي أنشأ التقرير فقط

---

### **2. Supabase Storage**

#### **Bucket: case-reports**
```
الإعدادات:
- Public: false (خاص)
- File size limit: 10 MB
- Allowed MIME types: application/pdf
- Path structure: /case-reports/{case_id}/report-{timestamp}.pdf
```

#### **إنشاء Bucket:**
```
1. Dashboard → Storage → Create Bucket
2. Name: case-reports
3. Public: false
4. Save
```

---

### **3. المكتبات المطلوبة**

```bash
npm install @react-pdf/renderer
```

---

## 🧩 **الملفات**

### **1. CaseReportPDF.jsx**
```
المسار: src/components/client/case-details/CaseReportPDF.jsx
الوظيفة: Template التقرير بتصميم احترافي
```

**المحتوى:**
- صفحة الغلاف (شعار + معلومات أساسية)
- معلومات القضية
- أطراف القضية (عميل + محامي)
- الجدول الزمني
- المهام
- الملاحظات المشتركة
- الملفات المرفقة

**التصميم:**
- ألوان: #0056B3 (أزرق قانوني) + #F8F9FB (رمادي فاتح)
- خط: Helvetica (مؤقتاً، يمكن إضافة Cairo)
- أقسام منسقة مع حواف دائرية وظلال
- جداول وعناصر منظمة

---

### **2. useCaseReport.jsx**
```
المسار: src/hooks/useCaseReport.jsx
الوظيفة: Hook لإدارة توليد ورفع التقارير
```

**الدوال:**
- `fetchCaseData()` - جلب جميع بيانات القضية
- `generatePDF()` - توليد PDF من Template
- `uploadPDFToStorage()` - رفع PDF إلى Supabase Storage
- `saveReportRecord()` - حفظ سجل في case_reports
- `generateCaseReport()` - الدالة الرئيسية
- `getPreviousReports()` - جلب التقارير السابقة

**الحالات:**
- `isGenerating` - حالة التوليد
- `progress` - نسبة الإنجاز (0-100)
- `error` - رسالة الخطأ

---

### **3. CaseDetails.jsx**
```
المسار: src/pages/client/CaseDetails.jsx
التعديل: إضافة زر توليد التقرير
```

**الزر:**
```jsx
<button onClick={handleGenerateReport} disabled={isGenerating}>
  {isGenerating ? (
    <>
      <Loader2 className="animate-spin" />
      <span>جاري التوليد... {progress}%</span>
    </>
  ) : (
    <>
      <Download />
      <span>📄 توليد تقرير القضية</span>
    </>
  )}
</button>
```

---

## 🔄 **سير العمل (Workflow)**

### **1. المستخدم يضغط "توليد تقرير القضية"**
```
Progress: 0%
```

### **2. جلب البيانات من Supabase**
```
Progress: 10-90%
- معلومات القضية (10%)
- العميل والمحامي (30%)
- الجدول الزمني (50%)
- المهام (60%)
- الملاحظات (70%)
- الملفات (80%)
- المواعيد (90%)
```

### **3. توليد PDF**
```
Progress: 92-95%
- إنشاء Document
- تطبيق Styles
- تحويل إلى Blob
```

### **4. رفع إلى Storage**
```
Progress: 95-98%
- Upload to /case-reports/{case_id}/report-{timestamp}.pdf
- الحصول على URL
```

### **5. حفظ السجل في قاعدة البيانات**
```
Progress: 98-100%
- INSERT into case_reports
- حفظ file_url و metadata
```

### **6. تحميل الملف للمستخدم**
```
Progress: 100%
- تحميل تلقائي للملف
- إشعار بالنجاح
```

---

## 🎨 **التصميم**

### **صفحة الغلاف:**
```
┌─────────────────────────────────────┐
│                                     │
│         ⚖️ Justice Connect          │
│                                     │
│    تقرير القضية رقم 123            │
│    قضية نزاع عقاري                 │
│                                     │
│    تاريخ التقرير: 2025-11-05       │
│    العميل: أحمد محمد               │
│    المحامي: د. سارة علي            │
│                                     │
└─────────────────────────────────────┘
```

### **الأقسام:**
```
┌─────────────────────────────────────┐
│  📋 معلومات القضية                 │
├─────────────────────────────────────┤
│  رقم القضية: 123                   │
│  العنوان: قضية نزاع عقاري          │
│  الحالة: نشطة                      │
│  الأولوية: عالية                   │
│  ...                                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  👥 أطراف القضية                   │
├─────────────────────────────────────┤
│  العميل:                            │
│  - الاسم: أحمد محمد                │
│  - البريد: ahmad@example.com       │
│  ...                                │
│                                     │
│  المحامي:                           │
│  - الاسم: د. سارة علي              │
│  - التخصص: قانون عقاري             │
│  ...                                │
└─────────────────────────────────────┘
```

---

## 🧪 **الاختبار**

### **Checklist:**

#### **1. قاعدة البيانات:**
- [ ] تشغيل `create_case_reports_table.sql`
- [ ] التحقق من إنشاء الجدول
- [ ] التحقق من RLS Policies

#### **2. Supabase Storage:**
- [ ] إنشاء Bucket `case-reports`
- [ ] ضبط الإعدادات (private, 10MB, PDF only)
- [ ] اختبار الرفع اليدوي

#### **3. المكتبات:**
- [ ] تثبيت `@react-pdf/renderer`
- [ ] التحقق من عدم وجود أخطاء

#### **4. الواجهة:**
- [ ] ظهور زر "توليد تقرير القضية"
- [ ] الزر يعمل عند الضغط
- [ ] Progress bar يظهر بشكل صحيح
- [ ] رسائل الخطأ تظهر إذا حدث خطأ

#### **5. التوليد:**
- [ ] PDF يتم توليده بنجاح
- [ ] التصميم صحيح وواضح
- [ ] جميع البيانات موجودة
- [ ] الخطوط العربية واضحة

#### **6. الرفع:**
- [ ] الملف يُرفع إلى Storage
- [ ] المسار صحيح: `/case-reports/{case_id}/...`
- [ ] URL صحيح ويعمل

#### **7. قاعدة البيانات:**
- [ ] سجل جديد في `case_reports`
- [ ] جميع الحقول صحيحة
- [ ] `file_url` يعمل

#### **8. التحميل:**
- [ ] الملف يتم تحميله تلقائياً
- [ ] اسم الملف صحيح
- [ ] الملف يفتح بدون مشاكل

---

## 🔧 **استكشاف الأخطاء**

### **1. خطأ: "Bucket not found"**
```
السبب: Bucket غير موجود في Storage
الحل: إنشاء Bucket من Dashboard → Storage
```

### **2. خطأ: "Permission denied"**
```
السبب: RLS Policies غير صحيحة
الحل: التحقق من Policies في case_reports
```

### **3. خطأ: "Failed to upload"**
```
السبب: حجم الملف كبير أو نوع خاطئ
الحل: التحقق من إعدادات Bucket
```

### **4. خطأ: "Cannot read property..."**
```
السبب: بيانات ناقصة من قاعدة البيانات
الحل: التحقق من Queries في useCaseReport
```

### **5. PDF فارغ أو غير صحيح**
```
السبب: مشكلة في Template
الحل: التحقق من CaseReportPDF.jsx
```

---

## 📚 **الملفات ذات الصلة**

```
database/
  create_case_reports_table.sql       ← إنشاء الجدول والـ Policies

src/
  components/
    client/
      case-details/
        CaseReportPDF.jsx              ← Template التقرير
  hooks/
    useCaseReport.jsx                  ← Hook التوليد والرفع
  pages/
    client/
      CaseDetails.jsx                  ← الصفحة الرئيسية (مع الزر)

docs/
  CASE_REPORT_GUIDE.md                 ← هذا الملف
```

---

## ✅ **الخلاصة**

ميزة طباعة تقرير القضية الآن:
- ✅ تولد PDF احترافي ومنسق
- ✅ تحفظ في Supabase Storage
- ✅ تسجل في قاعدة البيانات
- ✅ تحمّل تلقائياً للمستخدم
- ✅ Progress bar واضح
- ✅ معالجة أخطاء شاملة
- ✅ RLS آمن ومحكم

**كل شيء جاهز للاستخدام!** 🎉
