# Justice AI System - نظام العدالة الذكي

## Overview

Justice AI is an intelligent legal assistant system powered by OpenAI GPT-4o, designed specifically for Palestinian law. The system provides legal advice, analyzes documents, searches legal databases, and assists both clients and lawyers with legal questions.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [How It Works - Complete Flow](#how-it-works---complete-flow)
3. [Question Classification](#question-classification)
4. [Web Search & Scraping](#web-search--scraping)
5. [Response Generation](#response-generation)
6. [Source Management](#source-management)
7. [Frontend Integration](#frontend-integration)
8. [System AI (Admin RAG)](#system-ai-admin-rag)
9. [API Endpoints](#api-endpoints)
10. [Configuration](#configuration)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  Client JusticeAI   │   Lawyer JusticeAI   │   Admin System AI  │
│  /client/justice-ai │   /lawyer/justice-ai │   /admin/system-ai │
└─────────────────────┴────────────────────────┴───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                              │
├─────────────────────────────────────────────────────────────────┤
│  /api/justice-chat          │    /api/system-ai                 │
│  (Client & Lawyer)          │    (Admin Only - RAG SQL)         │
└─────────────────────────────┴───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      JUSTICE AI ENGINE                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Question    │  │   Web        │  │  Response    │           │
│  │  Classifier  │→ │   Search     │→ │  Generator   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         │                 │                  │                   │
│         ▼                 ▼                  ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Prompt     │  │  Legal Text  │  │   Source     │           │
│  │   Builder    │  │  Scraper     │  │  Formatter   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│    SerpAPI           │    OpenAI GPT-4o    │   Legal Websites   │
│  (Google Search)     │  (Answer Generation) │   (Web Scraping)   │
└──────────────────────┴─────────────────────┴────────────────────┘
```

---

## How It Works - Complete Flow

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ASKS A QUESTION                          │
│              "ما هي إجراءات الطلاق في فلسطين؟"                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: QUESTION CLASSIFICATION                                 │
│  ───────────────────────────────────                             │
│  Analyze question type:                                          │
│  • specific  → needs specific law articles                       │
│  • procedural → needs step-by-step procedures                    │
│  • general   → can use general knowledge                         │
│  • analysis  → legal analysis required                           │
│                                                                  │
│  Result: "procedural" (contains "إجراءات")                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: WEB SEARCH (SerpAPI)                                    │
│  ─────────────────────────────                                   │
│  Search Query: "ما هي إجراءات الطلاق في فلسطين قانون فلسطيني"   │
│                                                                  │
│  Allowed Domains:                                                │
│  • maqam.najah.edu (Palestinian Legislation)                     │
│  • mjr.ogb.gov.ps (Legislative Council)                          │
│  • www.pji.pna.ps (Judicial Institute)                           │
│  • muqtafi.birzeit.edu (Legal Information Center)                │
│  • www.courts.gov.ps (Palestinian Courts)                        │
│  • security-legislation.ps                                       │
│                                                                  │
│  Returns: Top 5 relevant results from trusted legal sources      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: WEB SCRAPING                                            │
│  ────────────────────                                            │
│  For each search result:                                         │
│  1. Fetch full page content                                      │
│  2. Extract legal text                                           │
│  3. Clean and format content                                     │
│  4. Handle errors gracefully (fallback to snippet)               │
│                                                                  │
│  Output: Combined legal text with source references              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: PROMPT BUILDING                                         │
│  ───────────────────────                                         │
│  Build structured prompt with:                                   │
│  • System instructions (Palestinian lawyer persona)              │
│  • Legal context from scraped sources                            │
│  • User's question                                               │
│  • Source references                                             │
│  • Output format requirements                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: AI RESPONSE GENERATION (OpenAI GPT-4o)                  │
│  ───────────────────────────────────────────────                 │
│  Model: gpt-4o                                                   │
│  Temperature: 0.3 (consistent, factual responses)                │
│  Max Tokens: 2000                                                │
│                                                                  │
│  System Prompt Features:                                         │
│  • Palestinian lawyer expert persona                             │
│  • Detailed, comprehensive answers                               │
│  • Citation of law articles with numbers                         │
│  • Step-by-step procedures when applicable                       │
│  • Legal warnings and notes                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: SOURCE FORMATTING                                       │
│  ─────────────────────────                                       │
│  • Ensure sources section exists in response                     │
│  • Add reference numbers [1], [2], etc.                          │
│  • If no external sources, add recommended sources               │
│  • Format with clear attribution                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: RETURN RESPONSE                                         │
│  ───────────────────────                                         │
│  Response Format:                                                │
│  {                                                               │
│    "reply": "الإجابة القانونية المفصلة...",                      │
│    "usage": {                                                    │
│      "prompt_tokens": 1500,                                      │
│      "completion_tokens": 800,                                   │
│      "total_tokens": 2300                                        │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Question Classification

The system classifies questions into 4 types to optimize response generation:

### Classification Types

| Type | Arabic Keywords | Description | Needs Search |
|------|-----------------|-------------|--------------|
| `specific` | مادة، قانون رقم، نص المادة | Specific law articles | ✅ Yes |
| `procedural` | إجراءات، خطوات، كيفية، شروط | Step-by-step procedures | ✅ Yes |
| `general` | كيف، ماذا، هل يمكن، اشرح | General legal questions | ⚠️ Optional |
| `analysis` | (default) | Legal analysis | ⚠️ Optional |

### Classification Logic

```javascript
function classifyQuestion(question) {
    const q = question.toLowerCase();
    
    // Specific law article keywords
    const specificKeywords = ["مادة", "رقم", "قانون رقم", "نص", "المرسوم"];
    
    // Procedural keywords
    const proceduralKeywords = ["إجراءات", "خطوات", "كيفية", "شروط", "متطلبات"];
    
    // General question keywords
    const generalKeywords = ["كيف", "ماذا", "هل يمكن", "هل يجوز", "ما هي"];
    
    if (specificKeywords.some(kw => q.includes(kw))) return "specific";
    if (proceduralKeywords.some(kw => q.includes(kw))) return "procedural";
    if (generalKeywords.some(kw => q.includes(kw))) return "general";
    return "analysis";
}
```

---

## Web Search & Scraping

### Search Process

#### 1. Google Search via SerpAPI

```javascript
const searchParams = {
    q: `${query} قانون فلسطيني`,  // Append Palestinian law context
    hl: "ar",                       // Arabic language
    gl: "ps",                       // Palestine region
    engine: "google",
    api_key: SERP_API_KEY
};
```

#### 2. Allowed Legal Domains

| Domain | Arabic Name | Content Type |
|--------|-------------|--------------|
| `maqam.najah.edu` | موقع مقام | Palestinian Legislation Database |
| `mjr.ogb.gov.ps` | المجلس التشريعي | Legislative Council Laws |
| `www.pji.pna.ps` | معهد القضاء | Judicial Training Institute |
| `muqtafi.birzeit.edu` | مقتفي | Legal Information Center |
| `www.courts.gov.ps` | المحاكم الفلسطينية | Palestinian Courts Official |
| `security-legislation.ps` | التشريعات الأمنية | Security Legislation |

#### 3. Web Scraping

```javascript
// For each search result
async function fetchLegalText(url) {
    // 1. Fetch page HTML
    // 2. Extract main legal content
    // 3. Remove navigation, ads, etc.
    // 4. Return clean text
}
```

---

## Response Generation

### OpenAI Configuration

```javascript
const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,        // Low for factual consistency
    max_tokens: 2000,        // Allow detailed responses
    messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ]
});
```

### System Prompt (Palestinian Lawyer Persona)

```text
أنت محامٍ فلسطيني خبير متخصص في القانون الفلسطيني.

📋 مهامك:
1. قدم إجابات قانونية مفصلة وشاملة
2. استشهد بالمواد القانونية بأرقامها الصحيحة
3. اشرح كيف تنطبق هذه المواد على سؤال المستخدم
4. إذا كان هناك إجراءات قانونية، اذكرها خطوة بخطوة
5. أضف ملاحظات قانونية مهمة إذا لزم الأمر
6. استخدم النصوص القانونية المُقدمة لك فقط
7. إذا لم تجد معلومات كافية، اذكر ذلك بوضوح

📝 تنسيق الإجابة:
- استخدم فقرات واضحة
- نقّط الإجراءات إذا كانت متعددة
- أشر للمصادر بالأرقام [1], [2], إلخ

🔴 في نهاية كل إجابة، يجب إضافة قسم "📚 المصادر"
```

---

## Source Management

### Source Formatting Rules

1. **With External Sources:**
```text
📚 المصادر المستخدمة:
[1] https://maqam.najah.edu/legislation/...
[2] https://mjr.ogb.gov.ps/...
```

2. **Without External Sources:**
```text
📚 المصادر الموصى بها للتحقق:

⚠️ هذه الإجابة مبنية على المعرفة العامة بالقانون الفلسطيني.

1. موقع مقام للتشريعات الفلسطينية
   🔗 https://maqam.najah.edu

2. المجلس التشريعي الفلسطيني
   🔗 https://mjr.ogb.gov.ps

3. مقتفي - مركز المعلومات القانونية
   🔗 http://muqtafi.birzeit.edu

💡 نصيحة: استشر محامياً متخصصاً للحصول على رأي قانوني ملزم.
```

---

## Frontend Integration

### Client Justice AI

**Route:** `/client/justice-ai`

#### Features
- Chat interface for legal questions
- Conversation history
- Document upload for analysis
- Markdown rendering for responses
- Sources display

### Lawyer Justice AI

**Route:** `/lawyer/justice-ai`

#### Features
- Same as client
- Enhanced for professional use
- Case-related queries
- Document analysis

### Floating AI Chat

**Component:** `FloatingAIChat.jsx`

#### Features
- Accessible from any page
- Minimizable chat widget
- Quick legal questions
- Persistent conversation

---

## System AI (Admin RAG)

### Overview

System AI is a separate AI system for administrators that uses RAG (Retrieval-Augmented Generation) with SQL queries.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN ASKS: "كم عدد المستخدمين المسجلين هذا الشهر؟"              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: GENERATE SQL QUERY                                      │
│  ──────────────────────────                                      │
│  OpenAI generates SQL based on database schema                   │
│                                                                  │
│  SELECT COUNT(*) FROM users                                      │
│  WHERE created_at >= date_trunc('month', CURRENT_DATE);          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: EXECUTE SQL                                             │
│  ───────────────────                                             │
│  Execute generated SQL against Supabase database                 │
│  Results: { count: 45 }                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: GENERATE ANALYSIS                                       │
│  ─────────────────────────                                       │
│  OpenAI analyzes results and provides human-readable response    │
│                                                                  │
│  "تم تسجيل 45 مستخدم جديد هذا الشهر..."                          │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema Available

The System AI has access to:
- Users table structure
- Lawyers table structure
- Cases table structure
- Appointments table structure
- And more...

---

## API Endpoints

### Justice Chat (Client/Lawyer)

```http
POST /api/justice-chat
Content-Type: application/json
Authorization: Bearer <token>

{
    "message": "ما هي إجراءات الطلاق في فلسطين؟"
}

Response:
{
    "reply": "إجابة قانونية مفصلة...",
    "usage": {
        "prompt_tokens": 1500,
        "completion_tokens": 800,
        "total_tokens": 2300
    }
}
```

### Document Analysis

```http
POST /api/document-analysis/analyze
Content-Type: multipart/form-data

FormData:
- file: (PDF file)
- message: "ما هو هذا المستند؟"

Response:
{
    "answer": "تحليل المستند..."
}
```

### System AI (Admin Only)

```http
# Get Conversations
GET /api/system-ai/conversations/:adminId

# Create Conversation
POST /api/system-ai/conversations
{ "adminId": "123", "title": "استفسار عن المستخدمين" }

# Send Message (RAG Flow)
POST /api/system-ai/conversations/:conversationId/messages
{ "message": "كم عدد المستخدمين؟" }

Response:
{
    "success": true,
    "userMessage": {...},
    "assistantMessage": {...},
    "sqlQuery": "SELECT COUNT(*) FROM users...",
    "queryResults": [...],
    "tokensUsed": 2500
}
```

---

## Configuration

### Environment Variables

```env
# OpenAI API
OPENAI_API_KEY=sk-...

# SerpAPI for Google Search
SERP_API_KEY=...

# Supabase (for System AI)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### File Structure

```
backend/
├── justiceAI/
│   ├── index.js              # Main orchestrator
│   ├── responseGenerator.js  # OpenAI integration
│   ├── webSearch.js          # Legacy DuckDuckGo (disabled)
│   ├── legislationIndex.js   # Legislation indexing
│   ├── web/
│   │   ├── search.js         # SerpAPI Google search
│   │   └── fetchLegalText.js # Web scraper
│   └── utils/
│       ├── promptBuilder.js  # Prompt templates
│       ├── sourceFormatter.js # Source handling
│       └── roleExtractor.js  # Role detection
├── routes/
│   ├── justiceChatRoute.js   # /api/justice-chat
│   └── systemChatRouter.js   # /api/system-ai
└── systemAI/
    ├── systemPrompt.js       # Admin AI prompts
    └── systemSchema.js       # Database schema
```

---

## Error Handling

### Common Errors

| Error | Cause | Handling |
|-------|-------|----------|
| No API Key | `OPENAI_API_KEY` missing | Return configuration error |
| Quota Exceeded | OpenAI billing issue | Inform user, retry later |
| Search Failed | SerpAPI issue | Fallback to general knowledge |
| Scraping Failed | Website blocked/down | Use snippet instead |

### Fallback Strategy

```javascript
// If web search returns no results or insufficient content
if (!legalText || legalText.length < 100) {
    // Generate answer without external sources
    return generateAnswerWithoutSources(question);
}
```

---

## Token Usage Tracking

The system returns token usage for monitoring:

```javascript
{
    "usage": {
        "prompt_tokens": 1500,    // Input tokens
        "completion_tokens": 800, // Output tokens
        "total_tokens": 2300      // Total
    }
}
```

---

## Notes

- Responses are in Arabic with proper RTL formatting
- Sources are always cited or recommended
- Temperature is low (0.3) for factual consistency
- Max tokens (2000) allows for detailed legal explanations
- System AI is admin-only with SQL access
- Client/Lawyer AI uses web search for external sources
