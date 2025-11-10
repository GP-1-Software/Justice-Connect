# دليل سريع: توليد تقارير PDF بالعربية

## 🚀 البدء السريع

### 1. التأكد من وجود الخط العربي

تأكد من وجود ملف الخط في المسار التالي:
```
public/fonts/Cairo-Regular.ttf
```

### 2. استخدام ميزة توليد التقرير

من صفحة تفاصيل القضية:

```javascript
// في مكون CaseDetails.jsx
import { useCaseReport } from '../hooks/useCaseReport';

const { generateCaseReport, isGenerating, progress } = useCaseReport();

// عند الضغط على زر "توليد التقرير"
const handleGenerateReport = async () => {
  const result = await generateCaseReport(caseId, userProfile);
  
  if (result.success) {
    alert('✅ تم توليد التقرير بنجاح!');
  }
};
```

## 📋 ما يتضمنه التقرير

✅ **صفحة الغلاف الاحترافية**
- شعار Justice Connect
- رقم القضية وعنوانها
- معلومات العميل والمحامي
- تاريخ التقرير

✅ **معلومات القضية الكاملة**
- جميع التفاصيل الأساسية
- الحالة والأولوية
- التواريخ المهمة

✅ **الجدول الزمني**
- جميع الأحداث المسجلة

✅ **المهام والملاحظات**
- المهام المرتبطة
- الملاحظات المشتركة

✅ **قائمة الملفات**
- جميع الملفات المرفقة

## 🎨 المميزات

- ✨ **نصوص عربية واضحة** - باستخدام خط Cairo
- 🔄 **اتجاه RTL صحيح** - من اليمين لليسار
- 🎯 **تصميم احترافي** - مناسب للاستخدام الرسمي
- 💾 **حفظ تلقائي** - في Supabase Storage
- ⬇️ **تحميل مباشر** - للمستخدم بعد التوليد

## 🔍 مثال على الاستخدام

```jsx
import { FileText, Download } from 'lucide-react';
import { useCaseReport } from '../hooks/useCaseReport';

function CaseDetailsPage() {
  const { generateCaseReport, isGenerating, progress } = useCaseReport();
  
  return (
    <button
      onClick={handleGenerateReport}
      disabled={isGenerating}
      className="btn-primary"
    >
      {isGenerating ? (
        <>
          <div className="spinner" />
          جاري التوليد... {progress}%
        </>
      ) : (
        <>
          <FileText size={20} />
          توليد تقرير PDF
        </>
      )}
    </button>
  );
}
```

## 📊 شريط التقدم

أثناء توليد التقرير، يتم عرض نسبة الإنجاز:

- 0-10%: بدء العملية
- 10-30%: جلب بيانات القضية
- 30-50%: جلب الجدول الزمني
- 50-70%: جلب المهام والملاحظات
- 70-90%: جلب الملفات
- 90-95%: توليد PDF
- 95-100%: رفع الملف وحفظ السجل

## ⚠️ ملاحظات مهمة

1. **الخط العربي ضروري**
   - بدون خط Cairo، قد تظهر النصوص بشكل غير صحيح

2. **الاتصال بالإنترنت**
   - مطلوب لتحميل خط Roboto (للنصوص الإنجليزية)

3. **الصلاحيات**
   - يجب أن يكون المستخدم مسجل دخول
   - يجب أن يكون له صلاحية الوصول للقضية

4. **حجم الملف**
   - يعتمد على كمية البيانات في القضية
   - عادة بين 100KB - 2MB

## 🐛 حل المشاكل الشائعة

### المشكلة: "الخط لا يظهر"
```bash
# تأكد من وجود الملف
ls public/fonts/Cairo-Regular.ttf

# إذا لم يكن موجوداً، قم بتحميله من:
# https://fonts.google.com/specimen/Cairo
```

### المشكلة: "خطأ في التوليد"
- تأكد من الاتصال بالإنترنت
- تأكد من صلاحيات Supabase Storage
- تحقق من Console للأخطاء

### المشكلة: "النصوص معكوسة"
- هذا يعني أن RTL غير مفعل
- تأكد من تحديث ملف CaseReportPDF.jsx

## 📞 الدعم

للمساعدة أو الإبلاغ عن مشاكل:
- راجع ملف `PDF_REPORT_ARABIC_SUPPORT.md` للتفاصيل الكاملة
- تحقق من Console في المتصفح للأخطاء
- راجع سجلات Supabase

---

**نصيحة:** احفظ التقارير المهمة محلياً كنسخة احتياطية! 💾
