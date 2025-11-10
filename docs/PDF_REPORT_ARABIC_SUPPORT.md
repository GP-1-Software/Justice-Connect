# دعم اللغة العربية في تقارير PDF - Justice Connect

## 📋 نظرة عامة

تم تحسين نظام توليد تقارير القضايا بصيغة PDF لدعم اللغة العربية بشكل كامل مع الاتجاه من اليمين لليسار (RTL).

## ✨ التحسينات المنفذة

### 1. **إضافة خط Cairo العربي**
- تم تحميل خط Cairo من Google Fonts
- الموقع: `public/fonts/Cairo-Regular.ttf`
- الخط يدعم UTF-8 والنصوص العربية بشكل كامل

### 2. **تسجيل الخطوط في @react-pdf/renderer**

```javascript
// خط Cairo للنصوص العربية
Font.register({
  family: 'Cairo',
  src: '/fonts/Cairo-Regular.ttf',
  fontStyle: 'normal',
  fontWeight: 'normal',
});

// خط Roboto للنصوص الإنجليزية
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf',
      fontWeight: 'bold',
    },
  ],
});
```

### 3. **دعم RTL في جميع الأنماط**

تم إضافة الخصائص التالية لجميع عناصر النص:
- `fontFamily: 'Cairo'` - للنصوص العربية
- `direction: 'rtl'` - الاتجاه من اليمين لليسار
- `textAlign: 'right'` - محاذاة النص لليمين

### 4. **تصميم صفحة الغلاف الاحترافية**

صفحة الغلاف تحتوي على:
- شعار المنصة "Justice Connect" ⚖️
- رقم القضية
- عنوان القضية
- معلومات العميل والمحامي
- تاريخ التقرير

### 5. **الأنماط المحسّنة**

#### النصوص العربية:
```javascript
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Cairo',
    direction: 'rtl',
    // ...
  },
  sectionTitle: {
    fontFamily: 'Cairo',
    textAlign: 'right',
    direction: 'rtl',
    // ...
  },
  // ... جميع الأنماط الأخرى
});
```

#### النصوص الإنجليزية (اختياري):
```javascript
englishText: {
  fontFamily: 'Roboto',
  direction: 'ltr',
  textAlign: 'left',
}
```

## 📦 الملفات المحدثة

1. **`src/components/client/case-details/CaseReportPDF.jsx`**
   - تسجيل الخطوط
   - تحديث جميع الأنماط
   - دعم RTL كامل

2. **`public/fonts/Cairo-Regular.ttf`**
   - خط Cairo العربي

## 🎯 المميزات

✅ **دعم كامل للغة العربية**
- النصوص العربية تظهر بوضوح تام
- لا توجد رموز غريبة أو انقلاب في النصوص

✅ **اتجاه RTL صحيح**
- جميع العناصر محاذاة من اليمين لليسار
- التخطيط يتناسب مع اللغة العربية

✅ **تصميم احترافي**
- Margins و Spacing متناسقة
- أحجام الخطوط مناسبة
- ألوان متناسقة مع هوية المنصة

✅ **دعم متعدد اللغات**
- العربية: Cairo + RTL
- الإنجليزية: Roboto + LTR (عند الحاجة)

## 🔧 الاستخدام

```javascript
import { useCaseReport } from '../hooks/useCaseReport';

const { generateCaseReport } = useCaseReport();

// توليد التقرير
const result = await generateCaseReport(caseId, userProfile);

if (result.success) {
  console.log('تم توليد التقرير بنجاح!');
  console.log('رابط الملف:', result.fileUrl);
}
```

## 📊 محتويات التقرير

1. **صفحة الغلاف**
   - شعار المنصة
   - رقم القضية
   - معلومات أساسية

2. **معلومات القضية**
   - رقم القضية
   - العنوان
   - النوع
   - الحالة
   - الأولوية
   - التواريخ
   - الوصف

3. **أطراف القضية**
   - معلومات العميل
   - معلومات المحامي

4. **الجدول الزمني**
   - الأحداث المهمة

5. **المهام**
   - المهام المرتبطة بالقضية

6. **الملاحظات**
   - الملاحظات المشتركة

7. **الملفات**
   - قائمة الملفات المرفقة

## 🐛 حل المشاكل

### المشكلة: الخط لا يظهر بشكل صحيح
**الحل:** تأكد من وجود ملف `Cairo-Regular.ttf` في مجلد `public/fonts/`

### المشكلة: النصوص تظهر من اليسار لليمين
**الحل:** تأكد من إضافة `direction: 'rtl'` و `textAlign: 'right'` للأنماط

### المشكلة: رموز غريبة بدلاً من النصوص العربية
**الحل:** تأكد من تسجيل خط Cairo بشكل صحيح قبل استخدامه

## 📝 ملاحظات

- الخط Cairo يدعم جميع الأحرف العربية والأرقام
- التقرير يتم حفظه في Supabase Storage تلقائياً
- يتم تحميل التقرير للمستخدم مباشرة بعد التوليد
- التقرير يدعم UTF-8 بشكل كامل

## 🔄 التحديثات المستقبلية

- [ ] إضافة دعم لخطوط عربية إضافية (Amiri, Tajawal)
- [ ] إضافة خيار اختيار اللغة (عربي/إنجليزي)
- [ ] تحسين التصميم بإضافة رسومات وأيقونات
- [ ] إضافة إمكانية تخصيص الألوان والتصميم

---

**تاريخ التحديث:** نوفمبر 2025  
**الإصدار:** 1.0.0  
**المطور:** Justice Connect Team
