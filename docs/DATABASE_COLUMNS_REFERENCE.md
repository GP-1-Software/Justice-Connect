# 📊 مرجع أعمدة قاعدة البيانات

## 🎯 **الأعمدة الصحيحة لجميع الجداول**

---

## 👤 **users**
```
user_id                 INTEGER (PK)
user_type               VARCHAR
first_name              VARCHAR
last_name               VARCHAR
email                   VARCHAR
phone                   VARCHAR          ← ليس phone_number
city                    VARCHAR
id_number               VARCHAR          ← ليس national_id
password_hash           VARCHAR
id_card_image           TEXT
account_status          VARCHAR
rejection_reason        TEXT
created_at              TIMESTAMP
updated_at              TIMESTAMP
auth_id                 UUID
profile_image_url       TEXT
```

---

## 👨‍⚖️ **lawyers**
```
lawyer_id                           INTEGER (PK)
user_type                           VARCHAR
first_name                          VARCHAR
last_name                           VARCHAR
email                               VARCHAR
phone                               VARCHAR          ← ليس phone_number
city                                VARCHAR
id_number                           VARCHAR          ← ليس national_id
password_hash                       VARCHAR
certificate_url                     TEXT
account_status                      VARCHAR
rejection_reason                    TEXT
created_at                          TIMESTAMP
updated_at                          TIMESTAMP
auth_id                             UUID
specialization                      ARRAY
years_of_experience                 INTEGER
license_number                      VARCHAR
bio                                 TEXT
profile_image_url                   TEXT
license_url                         TEXT
license_verification_status         TEXT
certificate_verification_status     TEXT
id_card_url                         TEXT
id_card_verification_status         TEXT
```

---

## 📅 **appointments**
```
id                      UUID (PK)
client_id               INTEGER
lawyer_id               INTEGER
appointment_date        DATE
appointment_time        TIME
duration_minutes        INTEGER
appointment_type        VARCHAR
meeting_method          VARCHAR
status                  VARCHAR
price                   NUMERIC
notes                   TEXT
created_at              TIMESTAMP
updated_at              TIMESTAMP
case_id                 INTEGER
rejection_reason        TEXT
```

---

## ⚖️ **cases**
```
case_id                 INTEGER (PK)
client_id               INTEGER
assigned_lawyer_id      INTEGER
title                   VARCHAR
case_type               VARCHAR
description             TEXT
status                  VARCHAR
priority                VARCHAR
created_at              TIMESTAMP
updated_at              TIMESTAMP
court_name              VARCHAR
filing_date             DATE
next_hearing_date       DATE
rejection_reason        TEXT
case_number             VARCHAR
```

---

## 📅 **timeline_events**
```
event_id                INTEGER (PK)
case_id                 INTEGER
event_type              VARCHAR
author_id               INTEGER
author_type             VARCHAR
title                   VARCHAR
description             TEXT
visibility              VARCHAR
files                   JSONB
created_at              TIMESTAMP
```

---

## ✅ **case_tasks**
```
task_id                 INTEGER (PK)
case_id                 INTEGER
lawyer_id               INTEGER          ← ليس assigned_to
title                   VARCHAR
description             TEXT
is_completed            BOOLEAN          ← ليس status
due_date                DATE
priority                VARCHAR
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

**ملاحظة مهمة:**
- ❌ لا يوجد عمود `status`
- ✅ استخدم `is_completed` (boolean)
- ❌ لا يوجد عمود `assigned_to`
- ✅ استخدم `lawyer_id`

---

## 📎 **case_files**
```
file_id                 INTEGER (PK)
case_id                 INTEGER
uploaded_by             INTEGER
uploader_type           VARCHAR
file_name               VARCHAR
file_url                TEXT
file_type               VARCHAR
file_size               BIGINT
description             TEXT
created_at              TIMESTAMP        ← ليس uploaded_at
```

**ملاحظة مهمة:**
- ❌ لا يوجد عمود `uploaded_at`
- ✅ استخدم `created_at`

---

## 🗒️ **case_notes**
```
note_id                 INTEGER (PK)
case_id                 INTEGER
content                 TEXT
created_at              TIMESTAMP
updated_at              TIMESTAMP
created_by_type         VARCHAR
created_by_id           INTEGER
is_shared               BOOLEAN
lawyer_id               INTEGER
```

---

## 📄 **case_reports**
```
report_id               INTEGER (PK)
case_id                 INTEGER
generated_by            INTEGER
generated_by_type       VARCHAR
report_title            VARCHAR
report_description      TEXT
report_type             VARCHAR
file_url                TEXT
file_size               INTEGER
generated_at            TIMESTAMP
```

---

## ⚠️ **الأخطاء الشائعة**

### **1. أسماء الأعمدة:**
```
❌ phone_number  →  ✅ phone
❌ national_id   →  ✅ id_number
❌ uploaded_at   →  ✅ created_at (في case_files)
```

### **2. المهام (case_tasks):**
```
❌ task.status           →  ✅ task.is_completed (boolean)
❌ task.assigned_to      →  ✅ task.lawyer_id
❌ task.assigned_to_type →  ✅ (غير موجود)
```

### **3. الملفات (case_files):**
```
❌ file.uploaded_at  →  ✅ file.created_at
```

---

## 📝 **أمثلة صحيحة للاستعلامات**

### **جلب معلومات العميل:**
```javascript
const { data } = await supabase
  .from('users')
  .select('user_id, first_name, last_name, email, phone, id_number, city')
  .eq('user_id', userId);
```

### **جلب معلومات المحامي:**
```javascript
const { data } = await supabase
  .from('lawyers')
  .select('lawyer_id, first_name, last_name, email, phone, specialization, license_number')
  .eq('lawyer_id', lawyerId);
```

### **جلب المهام:**
```javascript
const { data } = await supabase
  .from('case_tasks')
  .select('task_id, title, description, is_completed, priority, due_date, lawyer_id')
  .eq('case_id', caseId);

// عرض الحالة:
const status = task.is_completed ? 'مكتملة' : 'قيد التنفيذ';
```

### **جلب الملفات:**
```javascript
const { data } = await supabase
  .from('case_files')
  .select('*')
  .eq('case_id', caseId)
  .order('created_at', { ascending: false });  // ← ليس uploaded_at
```

---

## ✅ **Checklist للتحقق**

عند كتابة أي كود جديد، تحقق من:

- [ ] استخدام `phone` وليس `phone_number`
- [ ] استخدام `id_number` وليس `national_id`
- [ ] استخدام `is_completed` وليس `status` في المهام
- [ ] استخدام `lawyer_id` وليس `assigned_to` في المهام
- [ ] استخدام `created_at` وليس `uploaded_at` في الملفات
- [ ] التحقق من أسماء الأعمدة في هذا المرجع

---

**آخر تحديث:** 2025-11-05
