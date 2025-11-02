# 🔄 تحديث هيكل جدول lawyer_availability

## 📊 الهيكل الجديد

### **قبل (Old Structure)**
```sql
lawyer_availability:
- availability_id (integer)
- lawyer_id (integer)
- day_of_week (varchar) - 'sunday', 'monday', etc.
- start_time (time)
- end_time (time)
- is_available (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### **بعد (New Structure)**
```sql
lawyer_availability:
- availability_id (integer)
- lawyer_id (integer)
- schedule (jsonb) - JSON object containing weekly schedule
- created_at (timestamp)
- updated_at (timestamp)
```

---

## 📝 مثال على schedule JSONB

```json
{
  "sunday": {
    "start": "09:00",
    "end": "17:00",
    "enabled": true
  },
  "monday": {
    "start": "09:00",
    "end": "17:00",
    "enabled": true
  },
  "tuesday": {
    "start": "09:00",
    "end": "17:00",
    "enabled": true
  },
  "wednesday": {
    "start": "09:00",
    "end": "17:00",
    "enabled": true
  },
  "thursday": {
    "start": "09:00",
    "end": "17:00",
    "enabled": true
  },
  "friday": {
    "start": "09:00",
    "end": "17:00",
    "enabled": false
  },
  "saturday": {
    "start": "09:00",
    "end": "17:00",
    "enabled": false
  }
}
```

---

## ✅ الملفات المُحدثة

### 1. **`lawyerApi.js`**

#### **أ. تحديث `getLawyerById()`**
**التغيير**: جلب `schedule` بدلاً من الأعمدة القديمة

```javascript
// قبل
lawyer_availability (
  availability_id,
  day_of_week,
  start_time,
  end_time,
  is_available
)

// بعد
lawyer_availability (
  availability_id,
  schedule
)
```

#### **ب. تحديث `getLawyerAvailableSlots()`**
**التغيير**: استخدام `schedule` JSONB للحصول على الأوقات المتاحة

```javascript
// قبل
const { data: availability } = await supabase
  .from('lawyer_availability')
  .select('*')
  .eq('lawyer_id', lawyerId)
  .eq('day_of_week', dayOfWeek)
  .eq('is_available', true);

// بعد
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const dayName = dayNames[dayOfWeek];

const { data: availability } = await supabase
  .from('lawyer_availability')
  .select('schedule')
  .eq('lawyer_id', lawyerId)
  .single();

const daySchedule = availability.schedule[dayName];
if (!daySchedule.enabled) return [];

const startTime = daySchedule.start;
const endTime = daySchedule.end;
```

---

### 2. **`LawyerProfile.jsx`**

#### **أ. إصلاح عرض التخصصات (Specializations)**
**المشكلة**: التخصصات كانت تظهر كـ array بدون فواصل
**الحل**: التحقق إذا كانت array وعرضها بفواصل جميلة

```javascript
// قبل
{lawyer.specialization}

// بعد
{Array.isArray(lawyer.specialization) 
  ? lawyer.specialization.join(' • ') 
  : lawyer.specialization}
```

**النتيجة**: 
- قبل: `{"قانون جنائي""قانون مدني""قانون الأسرة"}`
- بعد: `قانون جنائي • قانون مدني • قانون الأسرة`

#### **ب. تحديث `getDayName()`**
```javascript
// قبل - كان يستقبل رقم (0-6)
const getDayName = (dayOfWeek) => {
  const days = [
    t('lawyerProfile.sunday'),
    // ...
  ];
  return days[dayOfWeek];
};

// بعد - يستقبل string ('sunday', 'monday', etc.)
const getDayName = (dayKey) => {
  const dayMap = {
    'sunday': t('lawyerProfile.sunday'),
    'monday': t('lawyerProfile.monday'),
    // ...
  };
  return dayMap[dayKey] || dayKey;
};
```

#### **ج. إضافة `getScheduleArray()`**
```javascript
// دالة جديدة لتحويل JSONB إلى array
const getScheduleArray = (schedule) => {
  if (!schedule) return [];
  
  const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  return daysOrder
    .filter(day => schedule[day] && schedule[day].enabled)
    .map(day => ({
      day,
      start: schedule[day].start,
      end: schedule[day].end
    }));
};
```

#### **د. تحديث عرض الجدول**
```javascript
// قبل
{lawyer.lawyer_availability
  .filter(a => a.is_available)
  .sort((a, b) => a.day_of_week - b.day_of_week)
  .map((avail) => (
    <div>
      {getDayName(avail.day_of_week)}
      {avail.start_time} - {avail.end_time}
    </div>
  ))
}

// بعد
{lawyer.lawyer_availability && 
 lawyer.lawyer_availability.length > 0 && 
 lawyer.lawyer_availability[0].schedule ? (
  getScheduleArray(lawyer.lawyer_availability[0].schedule).map((daySchedule, index) => (
    <div key={index}>
      {getDayName(daySchedule.day)}
      {daySchedule.start} - {daySchedule.end}
    </div>
  ))
) : (
  <p>{t('lawyerProfile.noScheduleAvailable')}</p>
)}
```

---

### 3. **الترجمات**

#### **`ar.json`**
```json
"lawyerProfile": {
  // ...
  "noScheduleAvailable": "لا يوجد جدول عمل متاح"
}
```

#### **`en.json`**
```json
"lawyerProfile": {
  // ...
  "noScheduleAvailable": "No schedule available"
}
```

---

## 🎯 المزايا الجديدة

### ✅ **مرونة أكبر**
- سهولة تعديل الجدول بالكامل دفعة واحدة
- لا حاجة لعدة rows لكل محامي

### ✅ **أداء أفضل**
- استعلام واحد بدلاً من 7 rows
- تقليل حجم البيانات

### ✅ **سهولة الصيانة**
- كل جدول المحامي في object واحد
- سهولة النسخ والتعديل

---

## 🔄 كيفية ترحيل البيانات القديمة (إذا لزم الأمر)

```sql
-- إذا كان عندك بيانات قديمة وتريد تحويلها
UPDATE lawyer_availability
SET schedule = (
  SELECT jsonb_object_agg(
    day_of_week,
    jsonb_build_object(
      'start', start_time::text,
      'end', end_time::text,
      'enabled', is_available
    )
  )
  FROM (
    SELECT 
      day_of_week,
      start_time,
      end_time,
      is_available
    FROM old_lawyer_availability
    WHERE lawyer_id = lawyer_availability.lawyer_id
  ) sub
)
WHERE lawyer_id IN (SELECT lawyer_id FROM old_lawyer_availability);
```

---

## ⚠️ ملاحظات مهمة

1. **تأكد من وجود schedule لكل محامي**
   - يجب أن يكون `schedule` JSONB صحيح
   - يجب أن يحتوي على جميع أيام الأسبوع

2. **القيم المسموحة**
   - `enabled`: `true` أو `false`
   - `start` و `end`: بصيغة `"HH:MM"` (مثل `"09:00"`)
   - أسماء الأيام: `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`

3. **التحقق من البيانات**
   ```sql
   -- تحقق من أن schedule صحيح
   SELECT lawyer_id, schedule
   FROM lawyer_availability
   WHERE schedule IS NULL 
      OR NOT (schedule ? 'sunday')
      OR NOT (schedule ? 'monday');
   ```

---

## ✅ الخلاصة

تم تحديث الكود بالكامل ليعمل مع الهيكل الجديد:
- ✅ `lawyerApi.js` - تحديث API
- ✅ `LawyerProfile.jsx` - تحديث العرض
- ✅ الترجمات - إضافة نصوص جديدة

**الآن الكود جاهز ويعمل مع الهيكل الجديد! 🚀**
