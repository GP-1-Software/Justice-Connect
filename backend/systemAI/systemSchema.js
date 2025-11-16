// backend/systemAI/systemSchema.js

export const SYSTEM_SCHEMA_TEXT = `

======================
TABLE: admins
======================
admin_id (integer, PK)
id_number (text)
first_name (text)
last_name (text)
email (text)
phone (text)
city (text)
password_hash (text)
role (text)
created_at (timestamptz)
updated_at (timestamptz)


======================
TABLE: system_ai_conversations
======================
id (uuid, PK)
admin_id (integer, FK → admins.admin_id)
title (text)
created_at (timestamptz)
last_message_at (timestamptz)


======================
TABLE: system_ai_messages
======================
id (uuid, PK)
conversation_id (uuid, FK → system_ai_conversations.id)
sender (text)                 -- 'user' | 'ai'
message (text)
sql_query (text)
raw_result (jsonb)
created_at (timestamptz)


======================
TABLE: ai_conversations
======================
id (uuid, PK)
client_user_id (text)
lawyer_user_id (text)
title (text)
created_at (timestamptz)
last_message_at (timestamptz)
metadata (jsonb)


======================
TABLE: ai_messages
======================
id (uuid, PK)
conversation_id (uuid)
role (text)
content (text)
model (text)
tokens (integer)
created_at (timestamptz)


======================
TABLE: appointments
======================
id (uuid, PK)
client_id (integer)
lawyer_id (integer)
appointment_date (date)
appointment_time (time)
duration_minutes (integer)
appointment_type (text)
meeting_method (text)
status (text)
price (numeric)
notes (text)
created_at (timestamptz)
updated_at (timestamptz)
case_id (integer)
rejection_reason (text)


======================
TABLE: case_files
======================
file_id (integer, PK)
case_id (integer)
uploaded_by (integer)
uploader_type (text)
file_name (text)
file_url (text)
file_type (text)
file_size (bigint)
description (text)
created_at (timestamptz)


======================
TABLE: case_notes
======================
note_id (integer, PK)
case_id (integer)
content (text)
created_at (timestamptz)
updated_at (timestamptz)
created_by_type (text)
created_by_id (integer)
is_shared (boolean)
lawyer_id (integer)


======================
TABLE: case_tasks
======================
task_id (integer, PK)
case_id (integer)
lawyer_id (integer)
title (text)
description (text)
is_completed (boolean)
due_date (date)
priority (text)
created_at (timestamptz)
updated_at (timestamptz)


======================
TABLE: cases
======================
case_id (integer, PK)
client_id (integer)
assigned_lawyer_id (integer)
title (text)
case_type (text)
description (text)
status (text)
priority (text)
created_at (timestamptz)
updated_at (timestamptz)
court_name (text)
filing_date (date)
next_hearing_date (date)
rejection_reason (text)
case_number (text)


======================
TABLE: lawyer_availability
======================
availability_id (integer, PK)
lawyer_id (integer)
created_at (timestamptz)
updated_at (timestamptz)
schedule (jsonb)


======================
TABLE: lawyer_services
======================
service_id (integer, PK)
lawyer_id (integer)
service_name (text)
description (text)
price (numeric)
duration_minutes (integer)
is_active (boolean)
created_at (timestamptz)
updated_at (timestamptz)


======================
TABLE: lawyer_stats
======================
lawyer_id (integer, PK)
first_name (text)
last_name (text)
total_cases (bigint)
active_cases (bigint)
completed_cases (bigint)
total_appointments (bigint)
upcoming_appointments (bigint)
total_revenue (numeric)


======================
TABLE: lawyers
======================
lawyer_id (integer, PK)
user_type (text)
first_name (text)
last_name (text)
email (text)
phone (text)
city (text)
id_number (text)
password_hash (text)
certificate_url (text)
account_status (text)
rejection_reason (text)
created_at (timestamptz)
updated_at (timestamptz)
auth_id (uuid)
specialization (array)
years_of_experience (integer)
license_number (text)
bio (text)
profile_image_url (text)
license_url (text)
license_verification_status (text)
certificate_verification_status (text)
id_card_url (text)
id_card_verification_status (text)


======================
TABLE: users
======================
user_id (integer, PK)
user_type (text)
first_name (text)
last_name (text)
email (text)
phone (text)
city (text)
id_number (text)
password_hash (text)
id_card_image (text)
account_status (text)
rejection_reason (text)
created_at (timestamptz)
updated_at (timestamptz)
auth_id (uuid)
profile_image_url (text)


======================
TABLE: meetings
======================
meeting_id (uuid, PK)
meeting_type (text)
related_appointment_id (uuid)
related_case_id (integer)
meeting_link (text)
meeting_provider (text)
meeting_status (text)
scheduled_date (date)
scheduled_time (time)
created_by_role (text)
created_by_id (integer)
created_at (timestamptz)
updated_at (timestamptz)
started_at (timestamptz)
ended_at (timestamptz)


======================
TABLE: timeline_events
======================
event_id (integer, PK)
case_id (integer)             -- FK → cases.case_id
event_type (text)
author_id (integer)           -- FK depends on author_type:
                              -- If author_type = 'lawyer' → lawyers.lawyer_id
                              -- If author_type = 'client' → users.user_id
                              -- If author_type = 'admin'  → admins.admin_id
author_type (text)            -- 'lawyer' | 'client' | 'admin'
title (text)
description (text)
visibility (text)             -- 'public' | 'private' | 'lawyer_only' ...
files (jsonb)
created_at (timestamptz)

======================
RELATIONSHIPS:
======================

timeline_events.case_id → cases.case_id

timeline_events.author_type + author_id determines the source table:
- If author_type = 'lawyer' → JOIN lawyers ON lawyers.lawyer_id = timeline_events.author_id
- If author_type = 'client' → JOIN users ON users.user_id = timeline_events.author_id
- If author_type = 'admin'  → JOIN admins ON admins.admin_id = timeline_events.author_id

Useful JOIN examples for the AI:

1) Fetch timeline with lawyer names:
JOIN lawyers ON lawyers.lawyer_id = timeline_events.author_id 
WHERE author_type = 'lawyer'

2) Fetch timeline with client names:
JOIN users ON users.user_id = timeline_events.author_id 
WHERE author_type = 'client'

3) Get timeline for a case:
SELECT * FROM timeline_events
WHERE case_id = X
ORDER BY created_at DESC;

4) Get events visible to a lawyer:
WHERE visibility IN ('public', 'lawyer_only');

5) Count events per case:
SELECT case_id, COUNT(*) FROM timeline_events GROUP BY case_id;


`;

