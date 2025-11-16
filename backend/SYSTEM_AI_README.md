# SystemAI - نظام الشات التحليلي للأدمن

## 📖 الفكرة
SystemAI هو نظام شات منفصل مخصص للـ **Admins** و **Super Admins** فقط، يتيح لهم الاستعلام عن قاعدة البيانات وتحليل البيانات باستخدام **اللغة الطبيعية** (Natural Language Queries).

### كيف يعمل النظام؟ (RAG Flow)

```
1️⃣ الأدمن يكتب سؤال بالعربي
     ⬇️
2️⃣ يُرسل السؤال + Schema للـ Gemini
     ⬇️
3️⃣ OpenAI يولد SQL SELECT query آمن
     ⬇️
4️⃣ تنفيذ الـ SQL على Supabase
     ⬇️
5️⃣ إرسال النتائج للـ Gemini للتحليل
     ⬇️
6️⃣ عرض التحليل بالعربي مع insights
```

---

## 🗂️ البنية

### الجداول في قاعدة البيانات

#### 1️⃣ `system_ai_conversations`
يحتوي على المحادثات الخاصة بكل أدمن.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `admin_id` | INTEGER | Foreign Key → `admins.admin_id` |
| `title` | TEXT | عنوان المحادثة |
| `created_at` | TIMESTAMPTZ | تاريخ الإنشاء |
| `last_message_at` | TIMESTAMPTZ | تاريخ آخر رسالة |

**ملاحظة:** لا يوجد `user_id` ولا `role` - فقط `admin_id` لأن النظام مخصص للأدمن فقط.

---

#### 2️⃣ `system_ai_messages`
يحتوي على الرسائل داخل كل محادثة.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `conversation_id` | UUID | Foreign Key → `system_ai_conversations.id` |
| `sender` | TEXT | `'user'` أو `'ai'` |
| `message` | TEXT | محتوى الرسالة |
| `sql_query` | TEXT | الـ SQL المُنفذ (للرسائل من الـ AI) |
| `raw_result` | JSONB | النتائج الخام من الـ query |
| `created_at` | TIMESTAMPTZ | تاريخ الإرسال |

---

### الـ SQL Function

#### `exec_sql(sql_query TEXT)`
دالة في Supabase تنفذ SQL queries ديناميكياً بشكل آمن.

**الحماية:**
- يسمح فقط بـ `SELECT` queries
- يمنع: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, إلخ.
- يعيد النتائج على شكل `JSONB`

**ملف التنفيذ:**
```
server/supabase/migrations/exec_sql_function.sql
```

**يجب تنفيذ هذا الملف في Supabase Dashboard:**
1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. انسخ محتوى `exec_sql_function.sql` ونفذه

---

## 🛠️ الـ API Endpoints

### Base URL
```
http://localhost:5000/api/system-ai
```

---

### 1️⃣ الحصول على محادثات الأدمن
**GET** `/conversations/:adminId`

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "uuid",
      "admin_id": 1,
      "title": "تحليل القضايا",
      "created_at": "2025-11-15T10:00:00Z",
      "last_message_at": "2025-11-15T10:30:00Z"
    }
  ]
}
```

---

### 2️⃣ إنشاء محادثة جديدة
**POST** `/conversations`

**Body:**
```json
{
  "adminId": 1,
  "title": "تحليل المحامين"
}
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "admin_id": 1,
    "title": "تحليل المحامين",
    "created_at": "2025-11-15T11:00:00Z"
  }
}
```

---

### 3️⃣ الحصول على رسائل محادثة
**GET** `/conversations/:conversationId/messages`

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender": "user",
      "message": "كم عدد المحامين المسجلين؟",
      "created_at": "2025-11-15T11:05:00Z"
    },
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender": "ai",
      "message": "عدد المحامين المسجلين هو 150 محامي...",
      "sql_query": "SELECT COUNT(*) FROM lawyers;",
      "raw_result": [{"count": 150}],
      "created_at": "2025-11-15T11:05:10Z"
    }
  ]
}
```

---

### 4️⃣ إرسال رسالة (RAG Flow) ⭐
**POST** `/conversations/:conversationId/messages`

**Body:**
```json
{
  "message": "كم عدد القضايا النشطة؟"
}
```

**Response:**
```json
{
  "success": true,
  "userMessage": {
    "id": "uuid",
    "sender": "user",
    "message": "كم عدد القضايا النشطة؟"
  },
  "aiMessage": {
    "id": "uuid",
    "sender": "ai",
    "message": "عدد القضايا النشطة حالياً هو 45 قضية...",
    "sql_query": "SELECT COUNT(*) FROM cases WHERE status = 'active';",
    "raw_result": [{"count": 45}]
  },
  "sqlQuery": "SELECT COUNT(*) FROM cases WHERE status = 'active';",
  "queryResults": [{"count": 45}]
}
```

---

### 5️⃣ حذف محادثة
**DELETE** `/conversations/:conversationId`

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

## ⚙️ الإعداد

### 1️⃣ Environment Variables
أضف المتغيرات التالية في ملف `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini API Key
GEMINI_API_KEY=
```

### 2️⃣ تنفيذ الـ SQL Migrations
في Supabase Dashboard:

1. **إنشاء الجداول:**
   ```sql
   -- نفذ محتوى: server/supabase/migrations/system_ai_setup.sql
   ```

2. **إنشاء الـ Function:**
   ```sql
   -- نفذ محتوى: server/supabase/migrations/exec_sql_function.sql
   ```

### 3️⃣ تشغيل الـ Backend
```bash
cd backend
npm run dev
```

Server سيعمل على: `http://localhost:5000`

---

## 🔐 الأمان

### ✅ ما يسمح به النظام:
- فقط `SELECT` queries
- الأدمن فقط يمكنه الوصول
- كل أدمن يرى محادثاته فقط

### ❌ ما يمنعه النظام:
- `INSERT`, `UPDATE`, `DELETE`
- `DROP`, `ALTER`, `CREATE`
- أي queries مدمرة أو خطيرة

---

## 📊 أمثلة على الأسئلة

```
✅ "كم عدد المحامين المسجلين؟"
✅ "ما هي القضايا التي تم تحديثها اليوم؟"
✅ "اعرض أفضل 5 محامين حسب عدد القضايا"
✅ "كم عدد المواعيد المعلقة؟"
✅ "ما هو متوسط سعر الاستشارات؟"
```

---

## 🎯 الميزات

✅ كل أدمن له محادثات منفصلة تماماً  
✅ حفظ كامل للـ history  
✅ تنفيذ آمن للـ SQL queries  
✅ تحليل ذكي باللغة العربية  
✅ دعم الإحصائيات والرسوم البيانية  
✅ لا يوجد `user_id` أو `role` - فقط `admin_id`

---

## 📝 ملاحظات

- النظام يستخدم `gpt-4o-mini` لتوليد الـ SQL والتحليل
- جميع الـ SQL queries محفوظة في `system_ai_messages.sql_query`
- النتائج الخام محفوظة في `system_ai_messages.raw_result`
- كل محادثة مستقلة تماماً عن الأخرى

---

## 🚀 Next Steps

1. ✅ نفذ الـ SQL migrations في Supabase
2. ✅ أضف الـ API keys في `.env`
3. ✅ شغّل الـ backend
4. ⏳ اربط الـ Frontend بالـ endpoints
5. ⏳ أضف UI للشات في الـ Admin Dashboard

---

**تم بنجاح! 🎉**
