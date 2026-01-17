# System AI - نظام الذكاء الاصطناعي للنظام

## Overview

System AI is an intelligent administrative analytics assistant for the Justice Connect platform. It uses **RAG (Retrieval-Augmented Generation)** with dynamic SQL query generation to analyze system data using natural language in Arabic or English.

---

## How It Works - Complete RAG Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN ASKS: "كم عدد المستخدمين المسجلين هذا الشهر؟"              │
│  (How many users registered this month?)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: SAVE USER MESSAGE                                       │
│  ───────────────────────────                                     │
│  Save the admin's question to database                           │
│  Table: system_ai_messages                                       │
│  Sender: 'user'                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: GENERATE SQL QUERY (OpenAI GPT-4.1-mini)                │
│  ─────────────────────────────────────────────────               │
│  • System prompt contains database schema + rules                │
│  • AI understands bilingual keywords:                            │
│    - "كم عدد" → COUNT(*)                                         │
│    - "المستخدمين" → users table                                  │
│    - "هذا الشهر" → DATE_TRUNC('month', ...) = NOW()              │
│                                                                  │
│  Generated SQL:                                                  │
│  SELECT COUNT(*) as total_users                                  │
│  FROM users                                                      │
│  WHERE DATE_TRUNC('month', created_at) =                         │
│        DATE_TRUNC('month', NOW())                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: CLEAN SQL QUERY                                         │
│  ────────────────────────                                        │
│  • Remove markdown code blocks (```sql ... ```)                  │
│  • Remove trailing semicolons                                    │
│  • Trim whitespace                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: EXECUTE SQL (Supabase RPC)                              │
│  ───────────────────────────────────                             │
│  Call: supabase.rpc('exec_sql', { sql_query: cleanedSQL })       │
│                                                                  │
│  Results: [{ total_users: 45 }]                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: GENERATE ANALYSIS (OpenAI GPT-4.1-mini)                 │
│  ────────────────────────────────────────────────                │
│  Input to AI:                                                    │
│  • The SQL query that was executed                               │
│  • The JSON results from database                                │
│  • Any errors if occurred                                        │
│                                                                  │
│  Output (Arabic):                                                │
│  "📊 تحليل البيانات:                                              │
│   تم تسجيل 45 مستخدم جديد خلال هذا الشهر..."                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: SAVE AI RESPONSE                                        │
│  ─────────────────────────                                       │
│  Save to database:                                               │
│  • AI analysis message                                           │
│  • SQL query used                                                │
│  • Raw query results                                             │
│  Table: system_ai_messages                                       │
│  Sender: 'ai'                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: UPDATE CONVERSATION                                     │
│  ───────────────────────────                                     │
│  Update last_message_at timestamp on conversation                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: RETURN RESPONSE                                         │
│  ────────────────────────                                        │
│  {                                                               │
│    success: true,                                                │
│    userMessage: { sender: 'user', message: '...' },              │
│    aiMessage: { sender: 'ai', message: '📊...', sql_query },     │
│    sqlQuery: 'SELECT COUNT(*) FROM users...',                    │
│    queryResults: [{ total_users: 45 }]                           │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Admin     │ ──▶ │   Backend    │ ──▶ │   OpenAI     │
│  (Frontend)  │     │  /api/system │     │ GPT-4.1-mini │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            │                    │
                            ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   Supabase   │     │ SQL Generator│
                     │  exec_sql()  │ ◀── │ + Analyzer   │
                     └──────────────┘     └──────────────┘
```

---

## Key Points

| Step | Action | Technology |
|------|--------|------------|
| 1 | Save user message | Supabase |
| 2 | Generate SQL from question | OpenAI GPT-4.1-mini |
| 3 | Clean SQL syntax | JavaScript |
| 4 | Execute SQL query | Supabase RPC (exec_sql) |
| 5 | Generate Arabic analysis | OpenAI GPT-4.1-mini |
| 6 | Save AI response + SQL | Supabase |
| 7 | Update conversation | Supabase |
| 8 | Return to frontend | Express.js |

---

## Notes

- **Admin-only** access
- **SELECT queries only** (no data modification)
- **Bilingual** - supports Arabic and English questions
- **Responses in Arabic**
- SQL queries are logged for audit
