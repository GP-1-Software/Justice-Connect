# إصلاح مشكلة ظهور الملاحظات الخاصة للعميل عند المحامي

## المشكلة

عندما يضيف العميل ملاحظة خاصة (is_shared = false)، كانت تظهر للمحامي في الجدول الزمني (timeline) لأن النظام كان يضيف حدث timeline_event لجميع الملاحظات بغض النظر عن حالة المشاركة.

## الحل المطبق

### 1. تعديل إضافة الملاحظات الجديدة

**الملف:** `src/components/client/case-details/CaseNotes.jsx`

- **قبل:** كان يتم إنشاء حدث في `timeline_events` عند إضافة أي ملاحظة
- **بعد:** لا يتم إنشاء حدث في `timeline_events` عند إضافة ملاحظة خاصة

```javascript
// لا نضيف حدث في Timeline لأن الملاحظة خاصة بشكل افتراضي
// سيتم إضافة حدث عند مشاركة الملاحظة مع المحامي
```

### 2. تعديل تبديل حالة المشاركة

**الملف:** `src/components/client/case-details/CaseNotes.jsx`

عند تبديل حالة المشاركة (`handleToggleShared`):

- **عند المشاركة** (is_shared: false → true):
  - يتم إضافة حدث في `timeline_events`
  - الحدث يحتوي على `metadata: { note_id }` لربط الحدث بالملاحظة
  
- **عند إلغاء المشاركة** (is_shared: true → false):
  - يتم حذف الحدث المرتبط من `timeline_events`
  - يتم البحث باستخدام `metadata.note_id`

```javascript
if (!currentShared) {
  // تمت المشاركة - إضافة حدث
  await supabase.from('timeline_events').insert({
    case_id: caseId,
    event_type: 'note',
    author_id: userProfile.user_id,
    author_type: 'client',
    title: 'شارك العميل ملاحظة',
    description: note.content.substring(0, 100) + '...',
    visibility: 'all',
    metadata: { note_id: noteId }
  });
} else {
  // إلغاء المشاركة - حذف الحدث
  await supabase.from('timeline_events')
    .delete()
    .contains('metadata', { note_id: noteId });
}
```

### 3. تعديل حذف الملاحظات

**الملف:** `src/components/client/case-details/CaseNotes.jsx`

- **قبل:** كان يتم إضافة حدث "تم حذف ملاحظة" لجميع الملاحظات
- **بعد:** يتم حذف الحدث المرتبط فقط إذا كانت الملاحظة مشتركة

```javascript
// حذف الحدث المرتبط من Timeline إن كانت الملاحظة مشتركة
if (noteToDelete?.is_shared) {
  await supabase.from('timeline_events')
    .delete()
    .contains('metadata', { note_id: noteId });
}
```

### 4. إضافة عمود metadata

**الملف:** `database/add_metadata_to_timeline.sql`

تم إضافة عمود `metadata` من نوع `JSONB` إلى جدول `timeline_events`:

```sql
ALTER TABLE timeline_events ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- فهرس للبحث السريع
CREATE INDEX idx_timeline_events_metadata_note_id 
ON timeline_events USING GIN ((metadata->'note_id'));
```

## كيفية التطبيق

### 1. تطبيق تحديث قاعدة البيانات

افتح Supabase SQL Editor ونفذ:

```bash
database/add_metadata_to_timeline.sql
```

### 2. الكود تم تحديثه تلقائياً

جميع التعديلات المطلوبة على الكود تم تطبيقها في:
- `src/components/client/case-details/CaseNotes.jsx`

## السلوك الجديد

### من جهة العميل:

1. **إضافة ملاحظة جديدة:**
   - الملاحظة خاصة افتراضياً (is_shared = false)
   - **لا تظهر** في timeline المحامي

2. **مشاركة ملاحظة:**
   - تغيير is_shared إلى true
   - **يتم إضافة** حدث في timeline
   - **تظهر الآن** للمحامي

3. **إلغاء مشاركة ملاحظة:**
   - تغيير is_shared إلى false
   - **يتم حذف** الحدث من timeline
   - **لا تعود تظهر** للمحامي

4. **حذف ملاحظة مشتركة:**
   - **يتم حذف** الحدث المرتبط من timeline

### من جهة المحامي:

- يرى فقط الملاحظات التي تم مشاركتها (is_shared = true)
- لا يرى الملاحظات الخاصة للعميل
- يرى حدث "شارك العميل ملاحظة" في timeline عند المشاركة

## الفوائد

✅ **خصوصية محسنة:** الملاحظات الخاصة للعميل تبقى خاصة فعلاً

✅ **شفافية:** المحامي يرى متى تمت مشاركة ملاحظة معه

✅ **مرونة:** العميل يمكنه التحكم في ما يشاركه مع المحامي

✅ **أداء:** استخدام metadata و JSONB indexes للبحث السريع

## الاختبار

### اختبار كعميل:

1. افتح قضية نشطة
2. أضف ملاحظة جديدة
3. تحقق أنها تظهر كـ "خاصة"
4. تحقق أنها **لا تظهر** في timeline المحامي
5. شارك الملاحظة (زر "مشاركة مع المحامي")
6. تحقق أن الحدث **ظهر الآن** في timeline المحامي
7. ألغِ المشاركة
8. تحقق أن الحدث **اختفى** من timeline المحامي

### اختبار كمحامي:

1. افتح قضية لعميل
2. تحقق أن timeline لا يظهر الملاحظات الخاصة
3. عندما يشارك العميل ملاحظة، ستظهر في timeline فوراً
4. عند إلغاء المشاركة، ستختفي من timeline فوراً

## ملاحظات تقنية

- استخدام **Optimistic Updates** للحصول على تجربة مستخدم سلسة
- استخدام **Real-time subscriptions** للتحديث الفوري
- استخدام **JSONB** لمرونة في تخزين البيانات الإضافية
- استخدام **GIN indexes** لتحسين الأداء عند البحث في metadata

## الملفات المعدلة

1. `src/components/client/case-details/CaseNotes.jsx` - منطق إدارة الملاحظات
2. `database/add_metadata_to_timeline.sql` - إضافة عمود metadata
3. `docs/PRIVATE_NOTES_FIX.md` - هذا الملف

## المؤلف

تم التطبيق في: نوفمبر 2025
