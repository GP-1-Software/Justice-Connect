# إعداد نظام مكالمات الفيديو (Meetings)

## الخطوات المطلوبة

### 1. إنشاء جدول meetings

شغّل ملف SQL التالي في Supabase SQL Editor:

```sql
database/create_meetings_table.sql
```

### 2. تفعيل Realtime للجدول

1. اذهب إلى Supabase Dashboard
2. Database → Replication
3. ابحث عن جدول `meetings`
4. فعّل:
   - ✅ Enable Realtime
   - ✅ INSERT events
   - ✅ UPDATE events
   - ✅ DELETE events
5. اضغط Save

### 3. التحقق من Policies

تأكد من وجود Policies التالية في جدول `meetings`:

- ✅ `Clients can view their meetings`
- ✅ `Lawyers can view their meetings`
- ✅ `Lawyers can create meetings`
- ✅ `Clients can create meetings for confirmed appointments`
- ✅ `Lawyers can update meetings`
- ✅ `Clients can update their meetings`

### 4. كيفية الاستخدام

#### للمواعيد (Appointments):
- عند قبول الموعد من المحامي (status = 'confirmed' و meeting_method = 'video_call')
- يتم توليد رابط Jitsi تلقائياً
- يظهر كارد الاجتماع في صفحة المواعيد

#### للقضايا (Cases):
- المحامي يمكنه إنشاء اجتماع من صفحة تفاصيل القضية
- يحدد تاريخ ووقت الاجتماع
- يتم توليد رابط Jitsi تلقائياً
- يظهر كارد الاجتماع للطرفين (المحامي والعميل)

### 5. ملاحظات مهمة

- الروابط تُولّد تلقائياً باستخدام Jitsi Meet
- الرابط يكون فريد لكل اجتماع
- يمكن نسخ الرابط ومشاركته
- زر "Join Meeting" يُفعّل قبل 5 دقائق من وقت الاجتماع
- Real-time updates تعمل تلقائياً عند إنشاء/تحديث الاجتماعات

