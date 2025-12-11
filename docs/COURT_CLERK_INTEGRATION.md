# تكامل قلم المحكمة - Court Clerk Integration

## نظرة عامة

هذا المستند يوثق تكامل نظام قلم المحكمة مع واجهات المحامي والعميل في منصة Justice Connect.

---

## 🏛️ المكونات الرئيسية

### 1. تقديم الدعوى الإلكترونية (المحامي)

**الملف:** `src/pages/lawyer/FileCaseLawyer.jsx`

يتيح للمحامي تقديم لائحة دعوى إلكترونية كاملة تشمل:
- بيانات المحكمة المختصة
- بيانات المدعي
- بيانات المدعى عليه
- موضوع الدعوى والطلبات القانونية
- المرفقات والوثائق
- إمكانية الحفظ كمسودة

**الميزات:**
- ✅ اختيار المحكمة حسب المحافظة ونوع المحكمة
- ✅ نموذج شامل لبيانات الأطراف
- ✅ رفع المرفقات مع دعم أنواع متعددة
- ✅ حفظ كمسودة للإكمال لاحقاً
- ✅ التحقق من صحة البيانات قبل التقديم

---

### 2. متابعة إجراءات المحكمة (المحامي)

**الملف:** `src/pages/lawyer/CaseDetail/components/CourtFilingTracker.jsx`

يعرض مراحل الدعوى في قلم المحكمة مع أزرار الإجراءات:

#### المراحل الـ 14 (Case Stages):

| # | المرحلة | Stage Key | اللون | الوصف |
|---|---------|-----------|-------|-------|
| 1 | تم التقديم | `submitted` | `#9e9e9e` (رمادي) | تم تقديم الدعوى |
| 2 | قيد المراجعة | `under_review` | `#ff9800` (برتقالي) | قيد المراجعة من قبل قلم المحكمة |
| 3 | مطلوب تعديل | `update_required` | `#ff5252` (أحمر فاتح) | يحتاج المحامي لتعديل/إضافة مستندات |
| 4 | جاهزة للتسجيل | `ready_for_registration` | `#64b5f6` (أزرق فاتح) | تمت الموافقة وجاهزة للتسجيل |
| 5 | مسجلة رسميًا | `registered` | `#2e7d32` (أخضر غامق) | تم التسجيل الرسمي مع رقم القضية |
| 6 | قيد التبليغ | `service_in_progress` | `#1e88e5` (أزرق) | جاري تبليغ الأطراف |
| 7 | تم التبليغ | `service_completed` | `#43a047` (أخضر) | تم تبليغ جميع الأطراف |
| 8 | بانتظار الرد | `awaiting_response` | `#fb8c00` (برتقالي) | بانتظار رد المدعى عليه (مؤقت) |
| 9 | أول جلسة مجدولة | `first_hearing_scheduled` | `#1565c0` (أزرق غامق) | تم تحديد موعد أول جلسة |
| 10 | جلسات جارية | `hearings_ongoing` | `#42a5f5` (أزرق فاتح) | الجلسات قيد المتابعة |
| 11 | صدر الحكم | `judgment_issued` | `#2e7d32` (أخضر غامق) | صدر الحكم النهائي |
| 12 | فترة الاستئناف | `appeal_period` | `#ffeb3b` (أصفر) | فترة الاستئناف (30 يوم) |
| 13 | قيد التنفيذ | `in_execution` | `#7b1fa2` (بنفسجي) | جاري تنفيذ الحكم |
| 14 | منفذة بالكامل | `fully_executed` | `#00e676` (أخضر فاتح) | تم تنفيذ الحكم بالكامل |

**ميزات المحامي:**
- ✅ تحديثات في الوقت الفعلي (Real-time)
- ✅ أزرار إجراءات لكل مرحلة (رفع مستندات، تقديم رد، استئناف)
- ✅ عداد تنازلي لفترة الاستئناف
- ✅ عداد تنازلي لانتظار الرد
- ✅ عرض تفاصيل الجلسات والقرارات
- ✅ تحميل PDF للأحكام والوثائق

---

### 3. متابعة إجراءات المحكمة (العميل)

**الملف:** `src/components/client/case-details/ClientCourtFilingTracker.jsx`

نسخة للقراءة فقط من متتبع المحامي تظهر للعميل.

**الميزات:**
- ✅ عرض جميع المراحل الـ 14 (قراءة فقط)
- ✅ إخفاء مرحلة "مطلوب تعديل" وإظهارها كـ "قيد المراجعة"
- ✅ تحديثات في الوقت الفعلي
- ✅ عداد تنازلي لفترة الاستئناف
- ✅ بدون أزرار إجراءات

---

### 4. الرد على طلبات التحديث

**الملف:** `src/pages/lawyer/CaseDetail/components/FilingUpdateResponse.jsx`

يظهر عندما يطلب موظف قلم المحكمة تحديثات أو مستندات إضافية.

**الميزات:**
- ✅ عرض سبب طلب التحديث
- ✅ إرسال رد مع مرفقات
- ✅ تحديث حالة الدعوى تلقائياً

---

## 🗄️ قاعدة البيانات

### الجداول المستخدمة:

| الجدول | الوصف |
|--------|--------|
| `court_clerk_filings` | اللوائح المقدمة |
| `court_hearings` | الجلسات المجدولة |
| `court_decisions` | القرارات والأحكام |
| `service_of_process` | إجراءات التبليغ |
| `filing_attachments` | مرفقات اللوائح |
| `cases` | القضايا (تُنشأ تلقائياً) |
| `case_stages_history` | سجل تغييرات المراحل |
| `execution_actions` | إجراءات التنفيذ |
| `case_appeals` | الاستئنافات |

### تشغيل migration المراحل الـ 14:
```bash
# في Supabase SQL Editor
-- تشغيل الملف:
server/supabase/migrations/case_stages_update.sql
```

---

## 🔌 نقاط النهاية (API Endpoints)

### تقديم الدعوى
```
POST /api/court-clerk/filings/submit
```
- ينشئ قضية جديدة تلقائياً
- يربط القضية بالعميل عبر رقم الهوية
- يرسل إشعارات للمحامي والعميل وموظف المحكمة

### جلب المراحل المتاحة
```
GET /api/court-clerk/stages
```
- يُرجع جميع المراحل الـ 14 مع تفاصيلها

### تحديث مرحلة القضية
```
PUT /api/court-clerk/cases/:case_id/stage
Body: {
  new_stage: "registered",
  reason: "تم التسجيل بنجاح",
  additional_data: { appeal_days: 30 }  // للاستئناف فقط
}
```

### جلب سجل المراحل
```
GET /api/court-clerk/cases/:case_id/stage-history
```

### تسجيل إجراء تنفيذ
```
POST /api/court-clerk/cases/:case_id/execution
Body: {
  action_type: "partial_execution",
  description: "تم تنفيذ جزء من الحكم",
  amount_executed: 5000,
  remaining_amount: 3000,
  documents: ["url1", "url2"]
}
```

### جلب سجل التنفيذ
```
GET /api/court-clerk/cases/:case_id/execution-history
```

### تسجيل استئناف
```
POST /api/court-clerk/cases/:case_id/appeal
Body: {
  appeal_type: "full",
  appeal_grounds: "أسباب الاستئناف",
  appeal_documents: ["url1"]
}
```

### جلب الدعوى
```
GET /api/court-clerk/filings/:filingId
```

### الرد على طلب التحديث
```
POST /api/court-clerk/filings/:filingId/update-response
```

### جلب الجلسات
```
GET /api/court-clerk/hearings/case/:caseId
```

### جلب القرارات
```
GET /api/court-clerk/decisions/case/:caseId
```

---

## 📡 التحديثات في الوقت الفعلي (Real-time)

يستخدم النظام Supabase Realtime للاشتراك في التحديثات:

```javascript
// الاشتراك في تحديثات اللائحة
supabase
  .channel('filing-updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'court_clerk_filings', filter: `case_id=eq.${caseId}` },
    callback
  )
  .subscribe();

// الاشتراك في الجلسات
supabase
  .channel('hearings-updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'court_hearings', filter: `case_id=eq.${caseId}` },
    callback
  )
  .subscribe();

// الاشتراك في القرارات
supabase
  .channel('decisions-updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'court_decisions', filter: `case_id=eq.${caseId}` },
    callback
  )
  .subscribe();

// الاشتراك في التبليغات
supabase
  .channel('services-updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'service_of_process', filter: `case_id=eq.${caseId}` },
    callback
  )
  .subscribe();

// الاشتراك في إجراءات التنفيذ
supabase
  .channel('execution-updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'execution_actions', filter: `case_id=eq.${caseId}` },
    callback
  )
  .subscribe();
```

### الجداول المطلوب تفعيل Realtime لها:
- `court_clerk_filings`
- `court_hearings`
- `court_decisions`
- `service_of_process`
- `execution_actions`
- `case_stages_history`

---

## 🔐 المصادقة (Authentication)

### ترميز بيانات المستخدم

يستخدم النظام Base64 لترميز بيانات المستخدم في الـ headers بسبب دعم اللغة العربية:

**الملف:** `src/utils/authHelpers.js`

```javascript
// دالة الترميز مع دعم Unicode
export const encodeBase64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary);
};

// استخدام getAuthHeaders() في كل الطلبات
import { getAuthHeaders } from '../utils/authHelpers';

fetch(url, {
  headers: getAuthHeaders()
});
```

---

## 🔔 الإشعارات

### أنواع الإشعارات المرسلة:

| الحدث | المستلم | نوع الإشعار |
|-------|---------|-------------|
| تقديم لائحة | موظف المحكمة | `FILING_RECEIVED` |
| تقديم لائحة | المحامي/العميل | `FILING_RECEIVED` |
| تحديث مرحلة | المحامي/العميل | `CASE_STAGE_UPDATE` |
| جلسة جديدة | المحامي/العميل | `HEARING_SCHEDULED` |
| أول جلسة | المحامي/العميل | `FIRST_HEARING_SCHEDULED` |
| قرار/حكم | المحامي/العميل | `DECISION_ISSUED` |
| صدور حكم | المحامي/العميل | `JUDGMENT_ISSUED` |
| تنفيذ جديد | المحامي | `EXECUTION_UPDATE` |
| استئناف | المحامي | `APPEAL_SUBMITTED` |
| تحذير استئناف | المحامي | `APPEAL_DEADLINE_WARNING` |
| اكتمال التنفيذ | المحامي/العميل | `CASE_FULLY_EXECUTED` |

**ملاحظة:** عند تحديث المرحلة لـ "مطلوب تعديل"، يرى العميل "قيد المراجعة" بينما يرى المحامي المرحلة الحقيقية.

---

## 🔗 ربط القضايا بالعملاء

عند تقديم دعوى:
1. يبحث النظام عن العميل برقم هوية المدعي (`plaintiff_id_number`)
2. إذا وُجد، يربط القضية بـ `client_id`
3. يخزن أيضاً `client_id_number` للاستعلام

### استعلام قضايا العميل:
```javascript
// يبحث بـ client_id أو client_id_number
.or(`client_id.eq.${user_id},client_id_number.eq.${id_number}`)
```

---

## 📱 واجهة المستخدم

### تبويب "المحكمة" في تفاصيل القضية

**المحامي:** `src/pages/lawyer/CaseDetail/CaseDetail.jsx`
**العميل:** `src/pages/client/CaseDetails.jsx`

يضاف تبويب جديد باسم "المحكمة" يعرض:
- مراحل الدعوى
- الجلسات
- القرارات
- نموذج الرد على طلبات التحديث (للمحامي فقط)

---

## 🛠️ التثبيت والإعداد

### 1. تشغيل ملفات قاعدة البيانات:
```bash
# في Supabase SQL Editor
-- تشغيل filing_drafts_schema.sql
```

### 2. التأكد من وجود storage bucket:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('filing-attachments', 'filing-attachments', true)
ON CONFLICT (id) DO NOTHING;
```

### 3. متغيرات البيئة:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 📝 ملاحظات مهمة

1. **المسودات:** تُحفظ في جدول منفصل ولا تُنشئ قضية حتى التقديم النهائي
2. **المرفقات:** تُرفع إلى storage bucket عند التقديم النهائي فقط
3. **Real-time:** يتطلب تفعيل Realtime في Supabase للجداول المعنية
4. **RLS:** تأكد من تفعيل Row Level Security مع السياسات المناسبة

---

## 👥 الفريق

تم تطوير هذا التكامل كجزء من مشروع Justice Connect - 2025
