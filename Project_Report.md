# Justice Connect - Legal Case Management Platform
## Comprehensive Project Report

---

## Acknowledgments
*[To be completed]*

---

## Disclaimer
*[To be completed]*

---

## Contents

### List of Figures

#### Chapter 1: Introduction
- **Figure 1.1:** Justice Connect Logo and Branding ........................... 5
- **Figure 1.2:** Palestinian Legal System Overview ........................... 8
- **Figure 1.3:** System Stakeholders Diagram ................................. 10
- **Figure 1.4:** Platform Access Points Map .................................. 12

#### Chapter 2: Literature Review
- **Figure 2.1:** Legal Management Systems Comparison Chart ................... 18
- **Figure 2.2:** AI in Legal Systems - Timeline ............................. 22
- **Figure 2.3:** Palestinian Digital Transformation Roadmap .................. 25
- **Figure 2.4:** Technology Stack Evolution ................................. 28

#### Chapter 3: Methodology
- **Figure 3.1:** System Development Lifecycle ............................... 32
- **Figure 3.2:** Overall System Architecture ................................ 35
- **Figure 3.3:** Database Entity-Relationship Diagram (ERD) ................. 38
- **Figure 3.4:** Technology Stack Diagram ................................... 42
- **Figure 3.5:** Frontend Architecture ...................................... 45
- **Figure 3.6:** Backend Architecture ....................................... 48
- **Figure 3.7:** Authentication Flow Diagram ................................ 51
- **Figure 3.8:** Role-Based Access Control Model ............................ 54
- **Figure 3.9:** Multi-Role User Architecture ............................... 56
- **Figure 3.10:** Data Flow Diagram ......................................... 59

##### Justice AI Architecture
- **Figure 3.11:** Justice AI System Architecture ............................ 62
- **Figure 3.12:** Justice AI - Question Classification Flow ................. 65
- **Figure 3.13:** Justice AI - Web Search Process ........................... 68
- **Figure 3.14:** Justice AI - 7-Step Workflow .............................. 71
- **Figure 3.15:** Palestinian Legal Sources Integration ..................... 74
- **Figure 3.16:** OpenAI GPT-4o Integration Diagram ......................... 76

##### System AI Architecture
- **Figure 3.17:** System AI RAG Architecture ................................ 79
- **Figure 3.18:** System AI - 8-Step RAG Flow ............................... 82
- **Figure 3.19:** SQL Generation Process .................................... 85
- **Figure 3.20:** Database Schema Access Diagram ............................ 87

#### Chapter 4: Results and Discussion

##### User Interfaces - Client Module

- **Figure 4.1:** Client Registration Page - Registration form collecting first name, last name, email, phone number, city, and national ID number. Includes ID card image upload (front/back), password creation with confirmation, and terms acceptance. Account status set to "approved" automatically upon submission.

- **Figure 4.2:** Client Dashboard - Welcome header displaying client name and current date. Shows four statistics cards: active cases count, upcoming appointments count, unread messages, and pending invoices. Features quick action buttons for common tasks (search lawyers, create case, view appointments). Bottom section displays Palestinian legal news feed.

- **Figure 4.3:** Search Lawyers Interface - Advanced search page with filters for specialization (Civil, Criminal, Commercial, Family, Labor, Administrative), city, years of experience, rating, and consultation fee range. Displays results in grid/list view toggle. Features pagination controls and search by lawyer name. Each lawyer card shows profile photo, name, specializations, rating, and "View Profile" button.

- **Figure 4.4:** Lawyer Profile View - Detailed profile displaying lawyer's professional biography, specialization areas, years of experience, bar association number, office location (city and address), consultation fee, and working hours. Shows aggregate rating and client reviews. Prominent "Book Appointment" button for scheduling consultations.

- **Figure 4.5:** Book Appointment Flow - Calendar interface showing lawyer's available and blocked dates. After selecting a date, displays available time slots. User selects meeting method (Video/Phone/In-person), optionally links to existing case, and views fee calculation. Payment integration for consultation fee confirmation. Upon success, redirects to appointments list with confirmation message.

- **Figure 4.6:** Client Appointments List - Displays all appointments with status badges (Pending, Confirmed, Completed, Cancelled). Each appointment card shows lawyer name, date, time, meeting method, status, and case information if linked. Filter tabs for viewing appointments by status. "Join Meeting" button for video appointments (appears 15 minutes before scheduled time). Cancel appointment option with reason input for pending/confirmed appointments.

- **Figure 4.7:** My Cases - Plaintiff View - Shows cases where client is plaintiff. Top section displays statistics: total cases, active cases, completed cases. Case cards show case number, title, type, status (Filed, Under Review, In Court, Closed), defendant name, assigned lawyer, filing date, and next hearing date. Filter options by case type and status. Search by case number functionality.

- **Figure 4.8:** My Cases - Defendant View - Shows court filings where client is defendant. Displays filing information: filing number, case type, plaintiff name, lawyer representing plaintiff, filing status (Pending, Approved, Rejected, Requires Update), submission date, and court assignment. Status badges color-coded by filing stage. Access to view complete filing details and attached documents.

- **Figure 4.9:** Case Details Page - Comprehensive view with 11 integrated components: Case Header (case number, status, court info), Client Information (editable plaintiff/defendant details), Court Filing Tracker (submission status timeline), Evidence Uploader (document categorization and preview), Meeting Manager (Jitsi integration), Private Notes (lawyer-only), Task Manager (due dates and priorities), Case Timeline (chronological events), Filing Update Response (respond to clerk requests), Update Composer (send notifications), and Add Client Info (link parties). Side panels for quick navigation between sections.

- **Figure 4.10:** Create Case Request Form - Multi-step wizard: Step 1 - Select lawyer from dropdown list. Step 2 - Choose case type (Civil, Criminal, etc.) and priority (Urgent, High, Normal, Low). Step 3 - Case description textarea (required). Step 4 - Defendant information (name, contact). Step 5 - Document uploads (PDF/images, max 10MB each). Progress indicator shows completion. Save draft functionality. Upon submission, generates tracking request_id and notifies selected lawyer.

- **Figure 4.11:** Client Invoices Page - Lists all invoices from lawyers with color-coded status (green: Paid, yellow: Pending, red: Overdue). Each invoice displays: invoice number, lawyer name, issue date, due date, total amount, status badge, and line items breakdown. "Pay Now" button for unpaid invoices. "Download Receipt" for paid invoices (generates PDF). Filter by status and search by invoice number.

- **Figure 4.12:** Payment Interface - Displays invoice summary with lawyer contact, itemized service breakdown, tax calculations, and total amount. Payment method selection: Credit Card (card number, expiry, CVV fields) or Bank Transfer (account details provided). Security indicators (SSL badge). "Complete Payment" button processes transaction. Success page shows receipt number and download option. Failed transactions display error with retry suggestions.

- **Figure 4.13:** Court Fees Management - Shows court-issued fees associated with client cases. Each fee entry displays: case number, case title, fee type (Filing/Motion/Appeal), amount, status (Pending/Paid/Overdue), issue date, and deadline. Overdue fees highlighted in red with warning badges. "Pay Fee" button launches payment integration. Official receipt download after payment completion. Fee calculation breakdown shown per court fee schedule.

- **Figure 4.14:** Client Settings Page - Three tabs: Security (change password with current password verification, minimum 6 characters, strength indicator), Notifications (toggles for email/SMS/push notifications, appointment reminders, case updates, marketing emails), Account Management (account deletion request with reason textarea and admin approval workflow). Profile updates handled in separate Profile page.

- **Figure 4.15:** Client Justice AI Chat - Chat interface with conversation list sidebar (organized by date). Message input supports Arabic/English. AI processes queries using RAG flow: classifies question type (Specific/Procedural/General/Analysis), performs web search on Palestinian legal sources (maqam.najah.edu, mjr.ogb.gov.ps, etc.), scrapes content, generates response with GPT-4o. Responses include source citations with clickable links. PDF upload support for document analysis. Conversation history persisted per user.

##### User Interfaces - Lawyer Module
- **Figure 4.16:** Lawyer Registration with Verification .................... 137
- **Figure 4.17:** Lawyer Dashboard with Statistics ......................... 140
- **Figure 4.18:** Cases List View .......................................... 143
- **Figure 4.19:** Case Detail - Full View .................................. 146
- **Figure 4.20:** Case Header Component .................................... 149
- **Figure 4.21:** Client Information Section ............................... 151
- **Figure 4.22:** Court Filing Tracker ..................................... 154
- **Figure 4.23:** Evidence Uploader Interface .............................. 157
- **Figure 4.24:** Meeting Manager .......................................... 160
- **Figure 4.25:** Video Meeting Interface .................................. 163
- **Figure 4.26:** Private Notes Section .................................... 166
- **Figure 4.27:** Task Manager ............................................. 169
- **Figure 4.28:** Case Timeline ............................................ 172
- **Figure 4.29:** Appointments Management .................................. 175
- **Figure 4.30:** Appointment Detail Modal ................................. 178
- **Figure 4.31:** Calendar View ............................................ 181
- **Figure 4.32:** Electronic Filing Form ................................... 184
- **Figure 4.33:** Filing Submission Confirmation ........................... 187
- **Figure 4.34:** Create Invoice Interface ................................. 190
- **Figure 4.35:** Invoice List ............................................. 193
- **Figure 4.36:** Lawyer Profile Management ................................ 196
- **Figure 4.37:** Availability Settings .................................... 199
- **Figure 4.38:** Lawyer Settings .......................................... 202
- **Figure 4.39:** Lawyer Justice AI Chat ................................... 205

##### User Interfaces - Court Clerk Module
- **Figure 4.40:** Court Clerk Dashboard .................................... 208
- **Figure 4.41:** Filings Inbox ............................................ 211
- **Figure 4.42:** Filing Review Interface .................................. 214
- **Figure 4.43:** Filing Approval Workflow ................................. 217
- **Figure 4.44:** Case Registration Form ................................... 220
- **Figure 4.45:** Cases Management ......................................... 223
- **Figure 4.46:** Case Stage Tracking ...................................... 226
- **Figure 4.47:** Hearings Management ...................................... 229
- **Figure 4.48:** Hearing Scheduling ....................................... 232
- **Figure 4.49:** Decisions Management ..................................... 235
- **Figure 4.50:** Decision Issuance Form ................................... 238
- **Figure 4.51:** Services Management ...................................... 241
- **Figure 4.52:** Service of Process Tracking .............................. 244
- **Figure 4.53:** Fees Management .......................................... 247
- **Figure 4.54:** Fee Issuance Interface ................................... 250
- **Figure 4.55:** Appeals Management ....................................... 253
- **Figure 4.56:** Appeal Processing Workflow ............................... 256
- **Figure 4.57:** Court Clerk Notifications ................................ 259
- **Figure 4.58:** Court Clerk Settings ..................................... 262

##### User Interfaces - Admin Module
- **Figure 4.59:** Admin Dashboard Main View ................................ 265
- **Figure 4.60:** User Verification Interface .............................. 268
- **Figure 4.61:** Lawyer Verification with Documents ....................... 271
- **Figure 4.62:** User Management - Ban/Unban .............................. 274
- **Figure 4.63:** Role Assignment Interface ................................ 277
- **Figure 4.64:** Court Clerk Assignment ................................... 280
- **Figure 4.65:** Courts Management ........................................ 283
- **Figure 4.66:** Support Tickets Dashboard ................................ 286
- **Figure 4.67:** Ticket Reply Interface ................................... 289
- **Figure 4.68:** Deletion Requests Management ............................. 292
- **Figure 4.69:** Analytics Dashboard ...................................... 295
- **Figure 4.70:** Cases Overview ........................................... 298
- **Figure 4.71:** Appointments Overview .................................... 301
- **Figure 4.72:** Payments Management ...................................... 304
- **Figure 4.73:** System AI Chat Interface ................................. 307
- **Figure 4.74:** System AI - SQL Query Display ............................ 310
- **Figure 4.75:** System AI - Data Analysis Results ........................ 313

##### Mobile Responsiveness
- **Figure 4.76:** Mobile - Client Dashboard ................................ 316
- **Figure 4.77:** Mobile - Lawyer Cases View ............................... 319
- **Figure 4.78:** Mobile - Court Clerk Inbox ............................... 322
- **Figure 4.79:** Mobile - Navigation Menu ................................. 325

##### Process Flow Diagrams
- **Figure 4.80:** User Registration and Verification Flow .................. 328
- **Figure 4.81:** Case Filing Complete Workflow ............................ 331
- **Figure 4.82:** Appointment Booking Process Flow ......................... 334
- **Figure 4.83:** Court Clerk Filing Review Process ........................ 337
- **Figure 4.84:** Case Registration Workflow ............................... 340
- **Figure 4.85:** Payment Processing Flow .................................. 343
- **Figure 4.86:** Invoice Creation and Payment Flow ........................ 346

##### Analytics and Statistics
- **Figure 4.87:** User Growth Chart ........................................ 349
- **Figure 4.88:** Case Statistics by Type .................................. 351
- **Figure 4.89:** Appointment Statistics ................................... 353
- **Figure 4.90:** Revenue Analytics ........................................ 355
- **Figure 4.91:** System Usage Metrics ..................................... 357
- **Figure 4.92:** User Activity Heatmap .................................... 359

##### Technical Implementation
- **Figure 4.93:** Real-time Notifications System ........................... 362
- **Figure 4.94:** Dark Mode Implementation ................................. 364
- **Figure 4.95:** RTL (Right-to-Left) Support .............................. 366
- **Figure 4.96:** File Upload System ....................................... 368
- **Figure 4.97:** Video Meeting Integration ................................ 370
- **Figure 4.98:** Search and Filter System ................................. 372

##### Security Features
- **Figure 4.99:** JWT Token Authentication Flow ............................ 375
- **Figure 4.100:** Role-Based Middleware ................................... 377
- **Figure 4.101:** Data Encryption Architecture ............................ 379
- **Figure 4.102:** API Security Layers ..................................... 381

##### Testing and Validation
- **Figure 4.103:** Test Coverage Report .................................... 384
- **Figure 4.104:** Performance Metrics ..................................... 386
- **Figure 4.105:** Load Testing Results .................................... 388
- **Figure 4.106:** Browser Compatibility Matrix ............................ 390

#### Chapter 5: Conclusion and Future Work
- **Figure 5.1:** System Impact Assessment .................................. 394
- **Figure 5.2:** User Satisfaction Survey Results .......................... 396
- **Figure 5.3:** Future Enhancement Roadmap ................................ 398
- **Figure 5.4:** Scalability Plan .......................................... 400

---

### Abstract
*[To be completed]*

---

### 1. Introduction

#### 1.1 Background and Motivation

The Palestinian legal sector faces significant challenges in delivering accessible and efficient legal services. Traditional processes involve extensive paperwork, manual coordination between clients, lawyers, and courts, and limited access to legal information. These challenges are amplified by geographical fragmentation and resource constraints.

Citizens struggle to find qualified legal representation and understand complex judicial procedures. Lawyers face difficulties in case management, client communication, and court coordination. Courts encounter operational inefficiencies in processing filings and managing proceedings.

Digital technologies and artificial intelligence offer unprecedented opportunities to transform legal service delivery. While LegalTech solutions worldwide have improved access to justice and efficiency, the Palestinian legal sector remains largely underserved by digital transformation.

The Justice Connect platform addresses these challenges by providing:
- **Seamless Communication** between clients, lawyers, and court personnel
- **Case Management** tools for lawyers to organize and track cases efficiently
- **Electronic Filing** system for submitting legal documents to courts
- **AI-Powered Assistance** for legal information and analytics
- **Appointment Scheduling** for legal consultations
- **Financial Transactions** for transparent invoicing and payments

Key challenges include: average case resolution time of 18-24 months, cost barriers preventing 37% of citizens from accessing services, and concentration of legal services primarily in major cities.

---

#### 1.2 Objectives

The primary objective is to design, develop, and deploy a comprehensive web-based legal case management platform (Justice Connect) that modernizes legal service delivery in Palestine.

**Technical Objectives:**

1. **Multi-Role Platform Architecture** - Support four user types (Clients, Lawyers, Court Clerks, Administrators) with JWT-based authentication and role-based access control

2. **Case Management System** - Enable lawyers to create, track, and manage cases with timeline tracking, evidence management, and task organization

3. **Electronic Court Filing** - Digital filing system with court clerk review workflow and automated case registration

4. **AI Integration** - Justice AI (GPT-4o) for legal questions with Palestinian legal database integration, and System AI for administrative analytics

5. **Appointment Management** - Booking system with availability management and video conferencing integration

**Functional Objectives:**

6. **Financial Transactions** - Invoice creation, online payment processing, and financial reporting

7. **Court Operations** - Unified dashboard for filings, hearing scheduling, and decision issuance

8. **Administrative Oversight** - User verification, system analytics, support tickets, and configuration

**User Experience Objectives:**

9. **Accessibility** - Responsive design, Arabic-first interface with RTL support, intuitive navigation

10. **Transparency** - Real-time notifications, audit logging, document verification, transparent billing

---

#### 1.3 Significance

**Technological Significance:**
- First comprehensive legal case management platform for Palestinian context
- Advanced AI integration (Justice AI + System AI) demonstrating LegalTech innovation
- Reference architecture for similar projects in other jurisdictions

**Societal Significance:**
- **Democratizes Access to Justice** - Reduces barriers for citizens in remote areas
- **Empowers Legal Professionals** - Enables lawyers to serve more clients efficiently
- **Enhances Legal Literacy** - AI assistant educates citizens about their rights

**Institutional Significance:**
- **Modernizes Courts** - Digital operations reduce paper, improve processing speed
- **Data-Driven Policy** - Generates insights on case trends and service quality
- **Professional Standards** - Promotes adherence to best practices

**Educational & Economic Significance:**
- Case study for software engineering, LegalTech research, and digital transformation
- Economic benefits through efficiency gains, market creation, and employment opportunities

---

#### 1.4 Report Organization

**Chapter 1: Introduction** - Context, motivation, objectives, and significance

**Chapter 2: Literature Review** - Reviews LegalTech systems, AI in legal services, and Palestinian digital transformation

**Chapter 3: Methodology** - System design, development process, implementation details, and technology stack

**Chapter 4: Results and Discussion** - User interfaces (100+ screenshots), feature implementation, AI evaluation, testing results, and performance metrics

**Chapter 5: Conclusion and Future Work** - Achievement summary, contributions, limitations, and future enhancements

**References** - Academic papers, technical documentation, and legal frameworks

---

### 2. Literature Review
*[To be completed]*

---

### 3. Methodology

#### 3.1 Tools and Technologies Used

The Justice Connect platform is built using modern web technologies and cloud services, ensuring scalability, maintainability, and optimal performance. This section outlines the complete technology stack.

**Frontend Technologies**

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | Core UI framework for building interactive interfaces |
| Vite | 5.0.0 | Fast build tool and development server |
| React Router | 6.x | Client-side routing and navigation |
| Tailwind CSS | 3.x | Utility-first CSS framework for styling |
| Framer Motion | 10.x | Animation library for smooth transitions |
| Lucide React | Latest | Icon library for consistent UI iconography |

**State Management & Data Fetching**
- **Custom Hooks** - Modular state management for authentication, data operations
- **React Context** - Global state for theme, user session
- **Local Storage** - Client-side persistence for preferences

**Internationalization**
- **react-i18next** - Multi-language support (Arabic/English)
- **RTL Support** - Right-to-left layout for Arabic language

**Backend Technologies**

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18.x | Server runtime environment |
| Express.js | 4.18.x | Web application framework |
| Supabase | Latest | Backend-as-a-Service (Database, Auth, Storage) |
| PostgreSQL | 15.x | Relational database (via Supabase) |

**AI & Machine Learning**
- **OpenAI API** - GPT-4o for Justice AI legal questions
- **OpenAI API** - GPT-4.1-mini for System AI analytics
- **SerpAPI** - Google search integration for legal sources
- **Axios** - Web scraping Palestinian legal databases

**Authentication & Security**
- **JWT (JSON Web Tokens)** - Stateless authentication
- **bcrypt** - Password hashing
- **Supabase Auth** - User authentication and session management
- **Row Level Security (RLS)** - Database-level access control

**File Management**
- **Supabase Storage** - Cloud file storage for documents, images
- **PDF Support** - Legal document uploads and analysis

**Real-time Communication**
- **Supabase Realtime** - Live updates for notifications, messages
- **Jitsi Meet** - Video conferencing integration

**Payment Integration**
- Payment gateway APIs for invoice and court fee processing

**Development Tools**
- **Git** - Version control
- **npm** - Package management
- **ESLint** - Code linting
- **Prettier** - Code formatting

**Mobile Application**
- **Expo** - React Native framework
- **WebView** - Hybrid app with web content
- **Native Modules** - Device-specific features (notifications, camera)

**Deployment & Hosting**
- **Frontend** - Vercel/Netlify (static hosting)
- **Backend** - Render/Railway (Node.js hosting)
- **Database** - Supabase Cloud
- **Storage** - Supabase Storage bucket

---

#### 3.2 System Design and Architecture

##### 3.2.1 Overall Architecture

Justice Connect follows a **three-tier architecture** pattern consisting of presentation layer, application layer, and data layer.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Web Application (React)    │   Mobile App (Expo + WebView) │
│  - Client Interface          │   - Hybrid approach           │
│  - Lawyer Interface          │   - Native features           │
│  - Court Clerk Interface     │   - Cross-platform            │
│  - Admin Interface           │                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│            Node.js + Express Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  REST APIs   │  │  Justice AI  │  │  System AI   │       │
│  │              │  │  (Legal Q&A) │  │  (Analytics) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Auth Service │  │ File Service │  │ Notification │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│              Supabase (PostgreSQL Database)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Tables    │  │   Storage    │  │   Realtime   │       │
│  │   (15+ DB)   │  │   (Files)    │  │ (WebSocket)  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  OpenAI GPT-4o/4.1  │  SerpAPI Search  │  Payment Gateway   │
└─────────────────────────────────────────────────────────────┘
```

**Key Architectural Principles:**

1. **Separation of Concerns** - Clear boundaries between presentation, business logic, and data
2. **Modular Design** - Independent modules for each user role
3. **API-First Approach** - Backend exposes RESTful APIs consumed by frontend
4. **Responsive Design** - Single codebase adapts to all screen sizes
5. **Security by Default** - Authentication required for all protected routes

##### 3.2.2 Database Design

The system uses PostgreSQL (via Supabase) with a normalized relational schema consisting of 15+ interconnected tables.

**Core Database Tables:**

**User Management**
- `users` - Client accounts with profile information
- `lawyers` - Lawyer accounts with specialization, credentials
- `admins` - Administrator accounts with role hierarchy
- `court_clerks` - Court staff with court assignments

**Legal Operations**
- `cases` - Legal cases with status, type, priority
- `case_files` - Documents attached to cases
- `case_notes` - Notes created by lawyers (public/private)
- `case_tasks` - Task management for lawyers
- `timeline_events` - Complete case activity history

**Court System**
- `court_filings` - Electronic submissions from lawyers
- `courts` - Court registry with locations
- `hearings` - Scheduled court hearings
- `court_decisions` - Issued rulings and decisions
- `court_fees` - Fee records for cases

**Appointments & Meetings**
- `appointments` - Lawyer-client appointments
- `lawyer_availability` - Available time slots (JSONB)
- `meetings` - Video meeting records (Jitsi)

**Financial**
- `invoices` - Lawyer invoices to clients
- `invoice_items` - Line items in invoices
- `payments` - Payment transaction records

**AI Systems**
- `system_ai_conversations` - Admin AI chat threads
- `system_ai_messages` - Messages with SQL queries and results
- `ai_conversations` - Justice AI chat threads (client/lawyer)
- `ai_messages` - Justice AI message history

**Database Relationships:**

```
users (1) ──────→ (N) appointments
lawyers (1) ─────→ (N) appointments
lawyers (1) ─────→ (N) cases
users (1) ───────→ (N) cases
cases (1) ───────→ (N) case_files
cases (1) ───────→ (N) timeline_events
lawyers (1) ─────→ (N) invoices
users (1) ───────→ (N) court_fees
```

**Key Design Features:**
- **Cascading Deletes** - Related data removed automatically
- **Timestamps** - created_at and updated_at on all tables
- **Status Enums** - Predefined values for status fields
- **JSONB Fields** - Flexible data storage (availability schedules, metadata)

##### 3.2.3 Authentication and Security

**Multi-Role Authentication System**

Justice Connect implements a sophisticated authentication system supporting four distinct user roles with different access privileges.

**Authentication Flow:**

1. **User Registration**
   - User submits registration form with role selection
   - Backend validates data and creates account
   - Account status set to "pending" awaiting verification
   - Admin reviews and approves/rejects

2. **Login Process**
   - User enters credentials (email/password)
   - Backend validates credentials with bcrypt
   - JWT token generated with user data and role
   - Token stored in localStorage
   - User redirected to role-specific dashboard

3. **Token-Based Authorization**
   - Every API request includes JWT token in Authorization header
   - Backend middleware verifies token validity
   - Role extracted from token to enforce permissions
   - Expired tokens trigger automatic logout

**Role-Based Access Control (RBAC)**

| Role | Access Level | Key Permissions |
|------|--------------|-----------------|
| Client | Basic | View lawyers, book appointments, create cases, pay invoices |
| Lawyer | Professional | Manage cases, create invoices, electronic filing, access Justice AI |
| Court Clerk | Judicial | Review filings, register cases, schedule hearings, issue decisions |
| Admin | Full | User verification, system analytics, support, System AI access |

**Security Measures:**

1. **Password Security**
   - Passwords hashed with bcrypt (salt rounds: 10)
   - Minimum length: 8 characters
   - Never stored in plain text

2. **Row Level Security (RLS)**
   - Database-level access control
   - Users can only query their own data
   - Automatic filtering based on user_id

3. **API Security**
   - Rate limiting on sensitive endpoints
   - Input validation and sanitization
   - SQL injection prevention (parameterized queries)
   - XSS protection

4. **File Upload Security**
   - File type validation (PDF, images only)
   - Size limits (20MB max)
   - Virus scanning (optional)
   - Secure storage with access tokens

5. **CORS Configuration**
   - Restricted to allowed origins
   - Credentials included in cross-origin requests

##### 3.2.4 Real-time Features

**Supabase Realtime Integration**

The system uses Supabase's real-time capabilities for live updates without page refresh.

**Real-time Notifications:**
- New case assignments for lawyers
- Appointment status changes
- Payment confirmations
- File uploads to cases
- Court decisions issued
- Support ticket updates

**Implementation:**
```javascript
// Subscribe to notifications
supabase
  .channel('notifications')
  .on('INSERT', (payload) => {
    // Display toast notification
  })
  .subscribe();
```

**Real-time Updates:**
- Case timeline events appear instantly
- Appointment calendar automatically refreshes
- Invoice status updates live
- Online/offline status for users
---

#### 3.3 System Implementation

##### 3.3.1 Authentication and Registration

The authentication and registration system serves as the entry point to the Justice Connect platform, accommodating four user types (Clients, Lawyers, Court Clerks, Admins) with secure, role-specific access across web and mobile platforms.

**Figure 3.4: Login Page**
- **(a) Web Interface:** Clean, centered login card with Justice Connect branding logo, email and password input fields with validation, "Remember Me" checkbox, "Forgot Password" recovery link, loading animation during authentication, error messages with Arabic support, and automatic redirect to role-specific dashboard after successful login.
- **(b) Hybrid Mobile Interface (Native):** Native login screen built with Expo featuring larger touch-friendly input fields (44x44px minimum), biometric authentication option (fingerprint/Face ID), animated logo with smooth transitions, auto-fill support from device keychain, native keyboard handling, session token generation, JWT token passed to WebView after authentication, and error alerts displayed as native dialogs.

**Login Features:**
- JWT token-based authentication with 24-hour expiry
- Role detection from database (client/lawyer/court_clerk/admin)
- Multi-role support with role selection after login
- Rate limiting (max 5 attempts per 15 minutes)
- Account status validation (active/pending/banned)
- Password visibility toggle
- Secure password hashing with bcrypt (10 salt rounds)

---

**Figure 3.5: Client Registration**
- **(a) Web Interface:** Multi-step wizard with progress indicator, Step 1 - Personal information (first name, last name, email with format validation, phone number with Palestinian format, city dropdown, national ID number), Step 2 - Security (password input with strength meter showing weak/medium/strong, password confirmation with real-time matching, requirements display for 8+ characters/uppercase/lowercase/number), Step 3 - ID card upload (drag-and-drop file picker, image preview before submission, front and back card capture), Step 4 - Review and submit (all information displayed for confirmation, terms and conditions checkbox, submit button with loading state), inline validation errors, responsive grid layout, auto-save to localStorage for draft protection, and smooth step transitions.
- **(b) Hybrid Mobile Interface:** Native scrollable form with single-page vertical layout, enhanced mobile features including native camera integration with document edge detection, auto-rotation and cropping for ID cards, image quality optimization, native date and city pickers, phone input with country code selector (+970), keyboard dismissal on scroll, progress bar in native header, touch-optimized spacing (16px minimum), larger fonts for readability, native image picker with gallery access, and form validation with native error alerts.

**Client Registration Process:**
1. User completes registration form
2. ID card uploaded (camera or file picker)
3. Account created with "pending" verification status  
4. Admin receives notification for approval
5. Admin reviews ID and information
6. Admin approves or rejects with reason
7. User notified via email of account status
8. Approved users can login immediately

---

**Figure 3.6: Lawyer Registration with Document Upload**
- **(a) Web Interface:** Extended 6-step registration wizard, Step 1 - Personal information (same as client), Step 2 - Professional credentials (bar association number with uniqueness validation, license number, specialization multi-select checkboxes for Civil/Criminal/Commercial/Family/Labor/Administrative law, years of experience dropdown, consultation fee input with currency formatting), Step 3 - Office details (office address, office phone with validation, city, working hours with day/time selectors), Step 4 - Document uploads (ID card front/back, bar association certificate PDF, law degree/diploma, professional license, multiple file upload with preview grid, file type validation for PDF/JPG/PNG, 5MB max per file, upload progress bars), Step 5 - Professional profile (biography text editor with 500 character limit, profile photo upload with crop tool showing circular preview, optional social media links), Step 6 - Review and submit (complete profile preview with expandable sections, document verification checklist showing all uploaded files, terms of service and professional code of ethics acceptance, submit for admin verification button), real-time field validation, bar number format checking, and document completeness verification.
- **(b) Hybrid Mobile Interface:** Native scrollable long-form with collapsible section headers, mobile-optimized camera integration with document scanner featuring edge detection for all certificates, auto-enhancement (brightness/contrast), PDF generation from multiple photos, multi-image gallery selection, native file picker for existing PDFs, parallel upload with individual progress indicators, image compression before upload (reduces size by 70%), collapsible sections to minimize scroll length, sticky "Save Draft" floating action button, auto-save every 30 seconds to prevent data loss, field completion percentage indicator, and upload resume capability if interrupted.

**Lawyer-Specific Fields:**
- **Professional Credentials:** Bar association number, license number, specializations, experience, fee
- **Office Information:** Address, city, phone, working hours
- **Profile:** Biography (500 chars), profile photo
- **Required Documents:** National ID, bar license, degree, professional certificate

**Document Verification Workflow:**
1. Lawyer submits complete registration with documents
2. Account status set to "pending_verification"
3. Admin dashboard shows new verification request
4. Admin reviews each uploaded document:
   - Can zoom/download documents
   - Verifies authenticity and validity
   - Checks bar number against registry
5. Admin actions per document:
   - **Approve** - Mark document as verified
   - **Reject** - Specify rejection reason (lawyer must reupload)
   - **Request Update** - Ask for better quality/different angle
6. Once all documents approved, admin approves account
7. Lawyer receives email notification with account status
8. Approved lawyers gain full system access

---

**Figure 3.7: Role Switcher after Login**
- **(a) Web Interface:** Top-right header navigation with current role badge displaying icon and role name, dropdown menu triggered on click, list of all assigned roles with distinct icons (👤 Client, ⚖️ Lawyer, 📋 Court Clerk, 🔧 Admin), hover effects on role options, selected role highlighted with checkmark, smooth fade transition animation on role switch, dashboard and sidebar navigation update immediately without page reload, role preference stored in localStorage for persistence, JWT token updated with new role claim, and security re-validation for sensitive operations.
- **(b) Hybrid Mobile Interface:** Native bottom sheet modal with smooth slide-up animation, role cards showing icon, name, and brief description, large touch targets for each role (minimum 60px height), tap-to-select with confirmation haptic feedback, animated modal dismissal, alternative swipe gesture between roles for quick switching, native segmented control in header bar showing current role, role indicator badge in status bar (iOS), WebView receives role change via JavaScript bridge, and session context updated seamlessly.

**Multi-Role Scenarios:**
1. **Lawyer + Court Clerk** - Lawyer practices privately and works part-time as court clerk, switches roles based on current task (reviewing filings vs managing cases)
2. **Lawyer + Admin** - Senior lawyer with administrative privileges, manages own cases and oversees platform operations
3. **Court Clerk + Admin** - Chief clerk with admin access, handles court operations and system management
4. **Client + Lawyer** - Lawyer who files cases as client for personal matters (rare but supported)

**Role Switcher Security:**
- Each role switch validates current user permissions
- Role changes logged in audit trail with timestamp
- Sensitive admin operations require password re-entry
- Session timeout enforced per role (configurable)
- Data access filtered based on active role (Row Level Security)

**Implementation Details:**
- Current role stored in React Context for global access
- Role-specific data fetched on switch (cases, appointments, etc.)
- Navigation menu dynamically rendered based on role
- Protected routes check active role before rendering
- API requests include current role in JWT token
- Real-time permission updates without re-login

---



##### 3.3.2 Client Module

The Client module provides comprehensive legal service access for citizens.

**Dashboard**
- Overview of active cases
- Upcoming appointments
- Pending invoices
- Quick action buttons

**Search Lawyers**
- Advanced filtering:
  - Specialization (Civil, Criminal, Commercial, Family, Labor, Administrative)
  - City location
  - Experience years
  - Rating
  - Consultation fee range
- Lawyer profile cards with ratings and reviews
- Pagination for results
- Responsive grid/list view

**Book Appointment**
- Calendar date selection
- Available time slots display
- Meeting method choice (Video, Phone, In-person)
- Case linking (optional)
- Fee calculation and confirmation
- Payment integration

**My Cases**
- Two sections:
  - Cases as Plaintiff (مدعي)
  - Cases Against Me (مدعى عليه)
- Case statistics dashboard
- Filter by status and type
- Search by case number
- Case details view with timeline

**Create Case Request**
- Lawyer selection
- Case type and priority
- Detailed description
- Defendant information
- Document uploads
- Submission tracking

**Appointments Management**
- List of all appointments
- Filter by status (Pending, Confirmed, Completed, Cancelled)
- View appointment details
- Join video meetings
- Cancel appointments with reason

**Invoices & Payments**
- Invoice list with status badges
- Payment history
- Pay invoice online
- Download receipts
- Multiple payment methods (Credit Card, Bank Transfer)

**Court Fees**
- View all court fees
- Status tracking (Pending, Paid, Overdue)
- Online payment
- Payment receipts

**Justice AI Chat**
- Ask legal questions in Arabic/English
- AI-powered responses with sources
- Conversation history
- Document upload for analysis

**Settings**
- Profile management
- Password change
- Notification preferences
- Account deletion request

##### 3.3.2 Lawyer Module

The Lawyer module provides professional tools for legal practice management.

**Dashboard**
- Key statistics:
  - Total cases count
  - Active cases
  - Upcoming appointments
  - Completed cases
  - Average rating
- Today's appointments list
- Quick actions menu
- Palestinian legal news feed

**Cases Management**
- Complete case list
- Search and filter capabilities
- Add new case manually
- Case status updates

**Case Detail (Comprehensive View)**

The case detail page consists of 11 integrated components:

1. **Case Header**
   - Case number and title
   - Status and stage badges
   - Court information
   - Quick actions menu

2. **Client Information**
   - Client personal details
   - Contact information
   - Plaintiff/Defendant data
   - Editable fields

3. **Court Filing Tracker**
   - Filing submission status
   - Stage progression
   - Timeline visualization
   - Document status tracking

4. **Evidence Uploader**
   - Upload case documents
   - File categorization (Evidence, Motion, Brief, etc.)
   - Preview and download files
   - Delete attachments

5. **Meeting Manager**
   - Schedule video meetings
   - Generate meeting links (Jitsi)
   - View meeting history
   - Join active meetings

6. **Private Notes**
   - Lawyer-only notes
   - Rich text editing
   - Timestamps
   - Search functionality

7. **Task Manager**
   - Create case-related tasks
   - Set due dates and priorities
   - Mark tasks complete
   - Task filtering

8. **Case Timeline**
   - Chronological event history
   - Event categorization
   - Filter and search events
   - Automatic activity logging

9. **Filing Update Response**
   - Respond to court clerk requests
   - Submit amendments
   - Upload additional documents

10. **Update Composer**
    - Send updates to relevant parties
    - Attach documents
    - Notification distribution

11. **Add Client Info**
    - Add plaintiff/defendant details
    - Update client information
    - Link existing clients

**Appointments**
- Calendar view and list view
- Accept/Reject pending appointments
- Complete appointments
- Join video meetings
- View client information
- Search and filter

**Electronic Filing**
- Complete filing form:
  - Case type and subject
  - Case reasons/grounds
  - Monetary claim amount
  - Court selection (auto-assigned by city)
  - Plaintiff information
  - Defendant information
  - Document attachments (PDF)
- Submit to court system
- Link to existing case or create new
- Track submission status

**Create Invoice**
- Client/case search and selection
- Add multiple line items:
  - Description
  - Quantity
  - Unit price
- Automatic tax calculation
- Discount application
- Due date setting
- Preview before sending

**Profile Management**
- Basic information (name, email, phone)
- Professional details:
  - Bar association number
  - Specialization areas
  - Years of experience
  - Consultation fee
- Office information (address, city, hours)
- Profile photo upload

**Availability Settings**
- Configure available days
- Set time slots
- Consultation duration
- Block specific dates

**Settings**
- Change password
- Notification preferences (Email, SMS, Push)
- Account deletion request

**Justice AI Assistant**
- Legal research queries
- Case law lookup
- Document analysis
- Palestinian law database search

##### 3.3.3 Court Clerk Module

The Court Clerk module streamlines judicial administrative operations.

**Dashboard**
- Statistics:
  - Pending filings count
  - Cases registered today
  - Upcoming hearings
  - Pending decisions
- Recent filings list
- Quick actions

**Filings Inbox**
- All electronic filings from lawyers
- Filter by status (Pending, Approved, Rejected, Requires Update)
- Search by filing number
- Bulk actions

**Filing Review**
- Complete filing details
- Attached documents preview
- Approve workflow:
  - Verify information
  - Assign case number
  - Register in system
  - Notify lawyer
- Reject workflow:
  - Select rejection reason
  - Add comments
  - Notify lawyer
- Request update workflow:
  - Specify required changes
  - Send notification

**Case Registration**
- Automated from approved filings
- Manual registration option
- Case number assignment
- Court assignment
- Initial hearing scheduling

**Cases Management**
- All registered cases
- Update case status
- Assign to judges
- Case stage tracking
- Search and filters

**Hearings Management**
- Schedule hearings
- Assign courtrooms
- Notify parties (lawyers, clients)
- Reschedule hearings
- Mark as completed
- Record attendance

**Decisions Management**
- Issue court decisions
- Link to cases
- Decision type (Ruling, Order, Judgment)
- Upload decision documents
- Notify all parties

**Services Management**
- Track service of legal documents
- Service types (Summons, Notice, Subpoena)
- Service status tracking
- Notify when served

**Fees Management**
- Issue court fees
- Fee calculation based on case type
- Payment tracking
- Generate receipts

**Appeals Management**
- Process appeal requests
- Review appeal grounds
- Forward to appellate court
- Track appeal status

**Notifications**
- Real-time notifications for:
  - New filings submitted
  - Hearing dates approaching
  - Fee payments received
- Notification center with filters

**Settings**
- Profile management
- Court assignment
- Working hours
- Notification preferences

##### 3.3.4 Admin Module

The Admin module provides comprehensive system oversight and management.

**Dashboard**
- System-wide statistics:
  - Total users by role
  - Pending verifications
  - Active cases
  - System health metrics
- Recent activities
- Quick management actions

**User Verification**
- Review pending registrations:
  - Clients
  - Lawyers (with document verification)
  - Court Clerks
- View submitted documents:
  - ID cards
  - Lawyer licenses
  - Bar certificates
- Approve/Reject with reasons
- Document verification status

**User Management**
- View all users by role
- Search and filter users
- Ban/Unban accounts
- Delete accounts
- View user activity logs

**Role Assignment**
- Assign additional roles to users
- Multi-role support (e.g., Lawyer + Court Clerk)
- Update role permissions
- Remove roles

**Court Clerk Assignment**
- Assign clerks to specific courts
- Manage clerk workload
- Reassign responsibilities

**Courts Management**
- Add/edit/delete courts
- Court information:
  - Name
  - City
  - Address
  - Type (Civil, Criminal, Family, etc.)
- Assign judges and clerks

**Support Tickets**
- View all support requests
- Categorize by type (Technical, Legal, Account)
- Assign to support staff
- Reply to tickets
- Mark as resolved
- Track resolution time

**Deletion Requests**
- View account deletion requests
- Review user data
- Approve deletion:
  - Anonymize or delete data
  - Notify user
- Reject with reason

**Analytics Dashboard**
- User growth charts
- Case statistics by type
- Appointment metrics
- Revenue analytics
- Geographic distribution
- User activity heatmaps
- Performance metrics

**System AI**
- Natural language database queries
- Chat interface for asking questions like:
  - "How many users registered this month?"
  - "Show top 10 lawyers by cases"
  - "What are pending filings?"
- AI generates and executes SQL
- Results presented in Arabic analysis
- Conversation history
- SQL query display

##### 3.3.5 Justice AI and System AI

**Justice AI (Legal Question Answering)**

Justice AI serves clients and lawyers with legal information using a RAG (Retrieval-Augmented Generation) pipeline.

**Architecture:**
```
User Question → Question Classification → Web Search (SerpAPI) 
→ Scrape Legal Sources → Build Prompt → OpenAI GPT-4o 
→ Generate Answer → Format Sources → Return Response
```

**Question Classification:**
- **Specific** - Needs specific law articles (keywords: مادة، قانون رقم)
- **Procedural** - Step-by-step procedures (keywords: إجراءات، خطوات)
- **General** - General legal questions (keywords: كيف، ماذا، هل)
- **Analysis** - Legal analysis required

**Palestinian Legal Sources:**
- maqam.najah.edu (Legislation Database)
- mjr.ogb.gov.ps (Legislative Council)
- www.pji.pna.ps (Judicial Institute)
- muqtafi.birzeit.edu (Legal Information Center)
- www.courts.gov.ps (Palestinian Courts)
- security-legislation.ps

**AI Configuration:**
- Model: GPT-4o
- Temperature: 0.3 (factual consistency)
- Max tokens: 2000
- System prompt: Palestinian lawyer expert persona

**Response Format:**
- Detailed legal answer in Arabic
- Citations to law articles
- Step-by-step procedures when applicable
- Sources section with links
- Recommended sources if no external data found

**System AI (Administrative Analytics)**

System AI provides administrators with database analytics through natural language queries.

**RAG SQL Flow:**
```
Admin Question → Generate SQL (GPT-4.1-mini) → Clean SQL 
→ Execute via Supabase RPC → Generate Analysis (GPT-4.1-mini) 
→ Return Arabic Analysis
```

**Bilingual Query Support:**

| Arabic | English | SQL Mapping |
|--------|---------|-------------|
| كم عدد | how many | COUNT(*) |
| متوسط | average | AVG() |
| اجمالي | total | SUM() |
| محامين | lawyers | lawyers table |
| قضايا | cases | cases table |
| هذا الشهر | this month | DATE_TRUNC('month', ...) |

**AI Configuration:**
- Model: GPT-4.1-mini (cost-effective)
- Temperature: 0.1 (precise SQL)
- Safety: SELECT-only queries
- Database schema provided in system prompt

**Example Queries:**
- "كم عدد المستخدمين المسجلين هذا الشهر؟"
- "أكثر المحامين بالقضايا النشطة"
- "إحصائيات المواعيد حسب الحالة"

---

#### 3.4 Multi-Platform Support and User Interfaces

Justice Connect is designed as a **web-first platform** with hybrid mobile support, ensuring accessibility across all devices.

##### 3.4.1 Web Application (Primary Platform)

**Technology Stack:**
- React 18 with Vite
- Responsive design (Tailwind CSS)
- Progressive Web App (PWA) capabilities
- Desktop and mobile browser support

**Key Features:**
- Full feature parity across all modules
- Optimized for desktop workflows
- Touch-friendly mobile interface
- Dark mode support
- RTL (Right-to-Left) for Arabic

**Browser Compatibility:**
- Chrome/Edge (Chromium) - Full support
- Firefox - Full support  
- Safari - Full support
- Mobile browsers - Optimized views

**Responsive Breakpoints:**
- Desktop: ≥1024px (full sidebar, multi-column layouts)
- Tablet: 768px-1023px (collapsible sidebar)
- Mobile: <768px (drawer navigation, stacked layouts)

##### 3.4.2 Hybrid Mobile Application (Expo with WebView)

**Approach:**
The mobile app uses a **hybrid architecture** combining native capabilities with web content through WebView.

**Technology:**
- **Expo** (React Native framework)
- **WebView** - Embeds web application
- **Native Modules** - Device-specific features

**Native Features:**
1. **Authentication Screens**
   - Native login interface
   - Native registration flow
   - Biometric authentication (fingerprint/Face ID)

2. **Push Notifications**
   - Native notification handling
   - Background notifications
   - Notification actions (open case, view appointment)

3. **Camera Integration**
   - Document scanning
   - Photo capture for evidence
   - QR code scanning

4. **File System Access**
   - Download and save documents
   - Open files in native viewers
   - Share documents with other apps

5. **Deep Linking**
   - Direct navigation to cases, appointments
   - URL scheme: justiceconnect://

**WebView Integration:**
- Loads web application URL
- JavaScript bridge for native communication
- Session persistence
- Offline detection and handling

**Authentication Flow:**
```
Native Login → Get JWT Token → Pass to WebView 
→ WebView stores token → Access web features
```

##### 3.4.3 Interface Comparison: Web vs Mobile Views

**Side-by-Side Comparison:**

**(a) Web View | (b) Mobile View**

**Dashboard:**
- (a) Wide layout with cards in grid (3-4 columns)
- (b) Single column stacked cards, optimized for touch

**Navigation:**
- (a) Persistent sidebar with icons and labels
- (b) Bottom tab bar or hamburger drawer menu

**Case List:**
- (a) Table or card grid with multiple columns
- (b) Vertically stacked cards with essential info

**Case Details:**
- (a) Multi-panel view (sidebar + main content)
- (b) Tabbed interface for different sections

**Forms:**
- (a) Multi-column forms with side-by-side fields
- (b) Single column with full-width inputs

**Search and Filters:**
- (a) Sidebar filters always visible
- (b) Expandable filter panel or modal

**Appointments Calendar:**
- (a) Full month view with day details
- (b) Week/day view with swipe navigation

**Document Viewer:**
- (a) Inline PDF viewer with toolbar
- (b) Full-screen viewer with gestures

**Chat/Messaging:**
- (a) Split view (conversations + messages)
- (b) Sequential navigation (list → conversation)

**Native Mobile Screens:**

1. **Login Screen**
   - Native input fields
   - Biometric option button
   - Remember me checkbox
   - Animated logo

2. **Notifications Center**
   - Native notification list
   - Pull to refresh
   - Swipe to delete
   - Tap to navigate to content

3. **Camera Capture**
   - Native camera interface
   - Document edge detection
   - Auto-crop and enhance
   - Save or upload options

4. **Offline Mode**
   - Native "No Connection" screen
   - Retry button
   - Cached content access

**Performance Optimizations:**
- **Lazy Loading** - Load components on demand
- **Image Optimization** - Compressed images, lazy loading
- **Code Splitting** - Smaller bundle sizes
- **Caching** - Service worker for offline access
- **Debouncing** - Optimize search and input handlers

**Accessibility:**
- Keyboard navigation support
- Screen reader compatibility (ARIA labels)
- High contrast mode
- Focus indicators
- Touch target sizing (minimum 44x44px)

---

### 4. Results and Discussion
*[To be completed]*

---

### 5. Conclusion and Future Work
*[To be completed]*

---

### References
*[To be completed]*
