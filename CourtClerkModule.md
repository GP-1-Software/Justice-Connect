# Court Clerk Module - قلم المحكمة

## Overview

The Court Clerk Module is a comprehensive case management system designed for court clerks to manage the entire lifecycle of legal cases. This module provides a full suite of tools for handling filings, registering cases, scheduling hearings, managing decisions, tracking fees, and processing appeals.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [Dashboard](#1-dashboard)
3. [Inbox (Filing Reception)](#2-inbox---filing-reception)
4. [Filing Review](#3-filing-review)
5. [Case Registration](#4-case-registration)
6. [Cases Management](#5-cases-management)
7. [Hearings Management](#6-hearings-management)
8. [Decisions Management](#7-decisions-management)
9. [Services Management (Notifications/Summons)](#8-services-management)
10. [Fees Management](#9-fees-management)
11. [Appeals Management](#10-appeals-management)
12. [Notifications](#11-notifications)
13. [Settings](#12-settings)
14. [Header Component](#13-header-component)
15. [API Endpoints](#api-endpoints)
16. [Technical Architecture](#technical-architecture)

---

## Features Overview

| Feature | Description |
|---------|-------------|
| **Dashboard** | Quick statistics and navigation hub |
| **Inbox** | Receive and filter incoming filings |
| **Filing Review** | Review, approve, or reject filings with feedback |
| **Case Registration** | Register approved filings as official cases |
| **Cases Management** | Track and manage all registered cases |
| **Hearings Management** | Schedule and manage court hearings |
| **Decisions Management** | Issue and record court decisions |
| **Services Management** | Manage legal notifications and summons |
| **Fees Management** | Issue and track court fees |
| **Appeals Management** | Process appeal requests through stages |
| **Notifications** | Real-time notification system |
| **Settings** | Profile, password, and preference management |

---

## 1. Dashboard

**Route:** `/court-clerk/dashboard`

The dashboard provides a centralized view of the clerk's workload with:

### Quick Statistics
- **New Filings** - Count of newly submitted filings
- **Under Review** - Filings currently being reviewed
- **Ready for Registration** - Approved filings awaiting registration
- **Update Required** - Filings needing corrections

### Quick Actions Navigation
- Inbox
- Case Registration
- Services Management
- Hearings Management
- Decisions Management
- Fees Management
- Cases Management
- Appeals Management

### Features
- Real-time statistics refresh
- Clickable stat cards for quick filtering
- Mobile-responsive grid layout
- Dark mode support

---

## 2. Inbox - Filing Reception

**Route:** `/court-clerk/inbox`

Manages incoming filings from lawyers with:

### Features
- **Status Filtering** - Filter by: Submitted, Under Review, Ready for Registration, Update Required, Rejected
- **Search** - Search filings by number or title
- **Filing Cards** - Display filing details with:
  - Filing number
  - Case type
  - Lawyer name
  - Court information
  - Submission date
  - Status badges

### Filing Statuses
| Status | Arabic | Description |
|--------|--------|-------------|
| `submitted` | تم التقديم | Newly submitted |
| `under_review` | قيد المراجعة | Being reviewed |
| `ready_for_registration` | جاهزة للتسجيل | Approved |
| `update_required` | بانتظار تعديل | Needs corrections |
| `rejected` | مرفوضة | Rejected |

---

## 3. Filing Review

**Route:** `/court-clerk/filings/:filing_id`

Detailed review interface for individual filings:

### Collapsible Sections
- **Case Information** - Case type, subject, reasons
- **Parties** - Plaintiff and defendant details
- **Lawyer Information** - Lawyer details and court
- **Attachments** - Uploaded documents

### Review Actions
- **Approve** - Mark as ready for registration
- **Request Modifications** - Send back with notes
- **Reject** - Reject with reason

### Features
- Expandable/collapsible sections
- Attached document viewer
- Review notes field
- Action confirmation modal

---

## 4. Case Registration

**Route:** `/court-clerk/registration`

Register approved filings as official court cases:

### Features
- **Filing Selection** - List of ready-for-registration filings
- **Registration Form**:
  - Auto-generated case number
  - Filing date selection
  - Court room assignment
  - Case description
- **Recently Registered Cases** - View last 5 registered cases
- **Search & Filter** - Filter by case type

### Registration Process
1. Select an approved filing
2. Fill registration details
3. Submit to create official case
4. Case number is auto-generated

---

## 5. Cases Management

**Route:** `/court-clerk/cases`

Comprehensive case tracking and management:

### Case Stages
| Stage | Arabic | Color |
|-------|--------|-------|
| `submitted` | تم التقديم | Gray |
| `under_review` | قيد المراجعة | Yellow |
| `registered` | مسجلة | Blue |
| `awaiting_response` | بانتظار الرد | Orange |
| `first_hearing_scheduled` | أول جلسة مجدولة | Blue |
| `adjourned` | مؤجلة | Purple |
| `decision_issued` | صدر الحكم | Cyan |
| `closed` | منتهية | Gray |
| `fully_executed` | منفذة بالكامل | Green |

### Features
- **Stage Tracking** - Visual stage indicators
- **Stage Change** - Update case stage via modal
- **Filtering** - Filter by stage, case type, search
- **Case Details** - Navigate to detailed view

---

## 6. Hearings Management

**Route:** `/court-clerk/hearings`

Schedule and manage court hearings:

### Hearing Types
- `منعقد جديد` - New Session
- `مستأنف` - Resumed
- `مؤجل` - Adjourned

### Hearing Statuses
| Status | Arabic |
|--------|--------|
| `scheduled` | مجدولة |
| `completed` | منتهية |
| `cancelled` | ملغاة |
| `postponed` | مؤجلة |

### Features
- **Case Selection** - Select case to manage hearings
- **Schedule New Hearing**:
  - Date and time
  - Hearing type
  - Court room
  - Notes
- **Postponement Requests** - View pending requests
- **Statistics** - Count by status
- **Calendar View** - Upcoming hearings

---

## 7. Decisions Management

**Route:** `/court-clerk/decisions`

Issue and manage court decisions:

### Decision Types
- `حكم جزئي` - Partial Ruling
- `حكم نهائي` - Final Ruling
- `حكم غيابي` - Default Judgment
- `حكم بالرد` - Dismissal Ruling
- `حكم تمهيدي` - Preliminary Ruling

### Features
- **Case Selection** - Select case for decision entry
- **Issue Decision Form**:
  - Decision type
  - Decision summary
  - Detailed decision text
  - Decision date
- **Decision History** - View all decisions per case
- **Statistics** - Decision counts by type

---

## 8. Services Management

**Route:** `/court-clerk/services`

Manage legal notifications and service of process:

### Service Methods
- `تبليغ شخصي` - Personal Service
- `تبليغ بالبريد` - Postal Service
- `تبليغ بالإلصاق` - Posting Notice
- `تبليغ إلكتروني` - Electronic Service

### Service Results
| Result | Arabic | Color |
|--------|--------|-------|
| `تم التبليغ` | Served | Green |
| `فشل التبليغ` | Failed | Red |
| `معلق` | Pending | Yellow |

### Features
- **Add Service Record**:
  - Officer name
  - Service date
  - Service method
  - Result
  - Notes
- **Service History** - View all services per case
- **Statistics** - Service counts by result

---

## 9. Fees Management

**Route:** `/court-clerk/fees`

Issue and track court fees:

### Fee Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `pending` | معلق | Yellow |
| `paid` | مدفوع | Green |
| `partially_paid` | مدفوع جزئياً | Blue |
| `overdue` | متأخر | Red |

### Features
- **Issue New Fee**:
  - Select case
  - Fee type
  - Amount
  - Due date
  - Notes
- **Confirm Payment** - Mark fees as paid
- **Fee Statistics**:
  - Total fees
  - Paid amount
  - Pending amount
- **Filter by Status** - View by payment status

---

## 10. Appeals Management

**Route:** `/court-clerk/appeals`

Process appeal requests through workflow stages:

### Appeal Stages
| Stage | Arabic | Color |
|-------|--------|-------|
| `appeal_submitted` | تم التقديم | Blue |
| `appeal_under_review` | قيد المراجعة | Yellow |
| `appeal_documents_requested` | طلب مستندات | Orange |
| `appeal_transferred` | تم التحويل | Purple |
| `appeal_hearing_scheduled` | جلسة مجدولة | Cyan |
| `appeal_decision_issued` | صدر الحكم | Green |
| `appeal_case_closed` | منتهية | Gray |

### Actions by Stage
- **Review** - Initial review with notes
- **Request Documents** - Request additional documents
- **Transfer** - Transfer to appellate court
- **Schedule Hearing** - Schedule appeal hearing
- **Issue Decision** - Issue appeal decision
- **Close Case** - Mark as closed

### Features
- **Stage Filtering** - Filter by appeal stage
- **Statistics** - Count per stage
- **Action Modals** - Context-specific actions
- **Appeal Details** - View full appeal information

---

## 11. Notifications

**Route:** `/court-clerk/notifications`

Manage system notifications:

### Notification Types
- Filing submissions
- Case updates
- Hearing reminders
- Decision notifications
- System alerts

### Features
- **Filter by Status** - All, Read, Unread
- **Mark as Read** - Individual or bulk
- **Delete** - Remove notifications
- **Click Navigation** - Navigate to related content
- **Time Display** - Relative time (e.g., "2 hours ago")

---

## 12. Settings

**Route:** `/court-clerk/settings`

User profile and preferences management:

### Sections

#### Profile Information
- First name, Last name
- Email (editable)
- Phone number
- ID Number (read-only)
- Address

#### Password Change
- Current password
- New password
- Confirm password

#### Notification Preferences
- Email notifications toggle
- SMS notifications toggle
- Push notifications toggle

#### Theme Settings
- Dark mode toggle

---

## 13. Header Component

Unified header across all court clerk pages:

### Features
- **Navigation Menu** - Desktop and mobile responsive
- **Assigned Court Display** - Shows clerk's assigned court
- **Dark Mode Toggle** - Switch between light/dark themes
- **Notifications Dropdown**:
  - Unread count badge
  - Recent notifications list
  - Mark as read functionality
  - Real-time updates via Supabase subscriptions
- **User Menu**:
  - Profile display
  - Role Switcher (for multi-role users)
  - Settings link
  - Logout

### Navigation Items
| Path | Label | Icon |
|------|-------|------|
| `/court-clerk/dashboard` | الرئيسية | Home |
| `/court-clerk/inbox` | صندوق الوارد | Inbox |
| `/court-clerk/cases` | القضايا | FolderOpen |
| `/court-clerk/registration` | التسجيل | FileText |
| `/court-clerk/hearings` | الجلسات | Calendar |
| `/court-clerk/decisions` | القرارات | Scale |

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/court-clerk
```

### Dashboard & Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get dashboard statistics |

### Courts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/courts` | Get all active courts |
| GET | `/courts/by-location` | Get court by city and type |
| GET | `/my-courts` | Get clerk's assigned courts |

### Filings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/filings/submit` | Submit new filing |
| GET | `/filings` | Get filings with filters |
| GET | `/filings/:id` | Get filing details |
| PUT | `/filings/:id/review` | Review a filing |

### Cases
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/filings/:id/register` | Register case from filing |
| GET | `/cases` | Get all cases |
| GET | `/cases/:id` | Get case details |
| PUT | `/cases/:id/stage` | Update case stage |

### Hearings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cases/:id/hearings` | Get case hearings |
| POST | `/cases/:id/hearings` | Schedule new hearing |
| PUT | `/hearings/:id` | Update hearing |

### Decisions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cases/:id/decisions` | Get case decisions |
| POST | `/cases/:id/decisions` | Issue new decision |

### Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cases/:id/services` | Get case services |
| POST | `/cases/:id/services` | Add service record |

### Fees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fees` | Get all fees |
| POST | `/fees` | Issue new fee |
| PUT | `/fees/:id/confirm` | Confirm payment |

### Appeals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/appeals` | Get all appeals |
| GET | `/appeals/:id` | Get appeal details |
| PUT | `/appeals/:id/review` | Review appeal |
| PUT | `/appeals/:id/transfer` | Transfer appeal |
| PUT | `/appeals/:id/schedule` | Schedule appeal hearing |
| PUT | `/appeals/:id/decision` | Issue appeal decision |
| PUT | `/appeals/:id/close` | Close appeal |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get clerk profile |
| PUT | `/profile` | Update profile |
| PUT | `/password` | Change password |

---

## Technical Architecture

### Frontend Structure
```
src/
├── pages/court_clerk/
│   ├── Dashboard.jsx
│   ├── Inbox.jsx
│   ├── FilingReview.jsx
│   ├── CaseRegistration.jsx
│   ├── CasesManagement.jsx
│   ├── CaseDetails.jsx
│   ├── HearingsManagement.jsx
│   ├── DecisionsManagement.jsx
│   ├── ServicesManagement.jsx
│   ├── FeesManagement.jsx
│   ├── AppealsManagement.jsx
│   ├── Notifications.jsx
│   └── Settings.jsx
├── components/court_clerk/
│   └── CourtClerkHeader.jsx
├── routes/
│   └── courtClerkRoutes.jsx
└── services/
    └── courtClerkApi.js
```

### Backend Structure
```
backend/
├── routes/
│   └── courtClerkRoutes.js
└── middleware/
    └── courtClerkMiddleware.js
```

### Database Tables
- `court_clerks` - Clerk assignments and info
- `courts` - Court information
- `court_clerk_filings` - Filing submissions
- `cases` - Registered cases
- `hearings` - Court hearings
- `decisions` - Court decisions
- `case_services` - Service records
- `fees` - Court fees
- `appeals` - Appeal cases
- `notifications` - User notifications

### Technologies
- **Frontend:** React, React Router, Tailwind CSS
- **Backend:** Express.js, Node.js
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Realtime Subscriptions
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

### Authentication
- JWT-based authentication
- Role verification middleware (`verifyCourtClerk`)
- Court assignment filtering

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`
- Touch-friendly interactions
- Collapsible mobile navigation

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Application
```bash
# Frontend
npm run dev

# Backend
cd backend
npm start
```

### Accessing the Module
1. Login as a court clerk user
2. Navigate to `/court-clerk/dashboard`
3. User must have `user_type: 'court_clerk'` in their profile

---

## Notes

- All timestamps are displayed in Arabic locale (`ar-EG`)
- Interface is RTL (Right-to-Left) for Arabic text
- Dark mode preference is persisted in localStorage
- Notifications support real-time updates
- All actions require clerk authentication
- Clerks only see filings/cases from their assigned courts
