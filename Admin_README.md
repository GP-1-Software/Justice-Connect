# Admin Module - لوحة تحكم المسؤول

## Overview

The Admin Module is a comprehensive administrative dashboard for system administrators to manage users, lawyers, court clerks, courts, support tickets, and monitor system analytics. This module provides full control over user verification, role management, and system-wide oversight.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [Admin Dashboard](#1-admin-dashboard)
3. [User Management](#2-user-management)
4. [Lawyer Management](#3-lawyer-management)
5. [Admin & Super Admin Management](#4-admin--super-admin-management)
6. [Court Clerk Management](#5-court-clerk-management)
7. [Courts Management](#6-courts-management)
8. [Support Tickets](#7-support-tickets)
9. [Deletion Requests](#8-deletion-requests)
10. [Analytics](#9-analytics)
11. [Cases Management](#10-cases-management)
12. [Appointments Management](#11-appointments-management)
13. [Payments Management](#12-payments-management)
14. [System AI](#13-system-ai)
15. [Role Hierarchy](#role-hierarchy)
16. [Technical Architecture](#technical-architecture)

---

## Features Overview

| Feature | Description |
|---------|-------------|
| **User Management** | Approve, reject, ban/unban clients |
| **Lawyer Management** | Verify and manage lawyer accounts |
| **Admin Management** | Promote/demote administrators |
| **Court Clerk Management** | Assign users as court clerks |
| **Courts Management** | Add, edit, activate/deactivate courts |
| **Support Tickets** | Handle user support requests |
| **Deletion Requests** | Process account deletion requests |
| **Analytics** | System-wide statistics and insights |
| **Cases Management** | Monitor and manage all cases |
| **Appointments Management** | Oversee lawyer-client appointments |
| **Payments Management** | Track invoices and payments |
| **System AI** | AI-powered administrative assistant |

---

## 1. Admin Dashboard

**Route:** `/admin/dashboard`

The main Admin Dashboard serves as the central hub with tabbed navigation:

### Main Tabs
| Tab | Arabic | Description |
|-----|--------|-------------|
| `users` | المستخدمين | Client accounts |
| `lawyers` | المحامين | Lawyer accounts |
| `admins` | المسؤولين | Admin accounts |
| `super_admins` | المسؤولين العامين | Super admin accounts |
| `deletion_requests` | طلبات الحذف | Account deletion requests |
| `support_tickets` | تذاكر الدعم | Support tickets |
| `court_clerks` | موظفي قلم المحكمة | Court clerk assignments |
| `courts` | المحاكم | Courts management |

### Quick Actions
- Assign Role to User
- Add Court Clerk
- Add New Court
- Search Users

---

## 2. User Management

**Tab:** `users`

Manage client (regular user) accounts:

### Status Tabs
| Status | Arabic | Color |
|--------|--------|-------|
| `pending` | قيد الانتظار | Yellow |
| `approved` | مقبول | Green |
| `rejected` | مرفوض | Red |
| `banned` | محظور | Gray |

### Actions Available
- **Approve** - Accept pending registration
- **Reject** - Reject with reason
- **Ban** - Ban user with reason
- **Unban** - Restore banned user
- **Promote to Admin** - Elevate user to admin role
- **View Details** - Full user information

### User Card Information
- Name (First + Last)
- ID Number
- Email
- Phone
- City/Address
- Account Status
- Registration Date
- User Type

---

## 3. Lawyer Management

**Tab:** `lawyers`

Manage lawyer accounts with the same status workflow as users:

### Verification Process
1. Lawyer registers with credentials
2. Admin reviews registration (pending)
3. Admin approves → Account active (approved)
4. Or Admin rejects with reason (rejected)

### Additional Lawyer Information
- Bar Association Number
- Specialization
- Years of Experience
- Office Address
- Verification Documents

### Actions
- Same as user management
- View professional credentials
- Verify bar association membership

---

## 4. Admin & Super Admin Management

**Tabs:** `admins`, `super_admins`

Manage administrator accounts:

### Admin Roles
| Role | Arabic | Permissions |
|------|--------|-------------|
| `admin` | مسؤول | Standard admin access |
| `super_admin` | مسؤول عام | Full system control |

### Actions (Super Admin Only)
- **Demote Admin** - Convert admin back to regular user
- **Ban/Unban Admin** - Suspend admin access
- **View Admin Details** - Full information

### Super Admin Exclusive Features
- Can assign `super_admin` role
- Can demote other admins
- Cannot be demoted by regular admins

---

## 5. Court Clerk Management

**Tab:** `court_clerks`

Assign and manage court clerk roles:

### Add Court Clerk Process
1. Enter user's ID number
2. Select assigned court
3. System creates court_clerk record
4. Adds role to user_roles table
5. Updates user's user_type to `court_clerk`

### Features
- **Add Clerk** - Assign user as court clerk
- **Remove Clerk** - Revoke clerk assignment
- **View Assignment** - See court and clerk details

### Information Displayed
- Clerk Name
- ID Number
- Email / Phone
- Assigned Court
- Assignment Date
- Active Status

---

## 6. Courts Management

**Tab:** `courts`

Manage court registry:

### Court Information
| Field | Arabic | Type |
|-------|--------|------|
| `court_name` | اسم المحكمة | String |
| `court_type` | نوع المحكمة | Enum |
| `city` | المدينة | String |
| `is_active` | نشط | Boolean |

### Court Types
- `محكمة صلح` - Magistrate Court
- `محكمة بداية` - First Instance Court
- `محكمة استئناف` - Court of Appeal
- `محكمة النقض/العليا` - Supreme Court

### Actions
- **Add Court** - Create new court entry
- **Edit Court** - Update court information
- **Toggle Status** - Activate/deactivate court

---

## 7. Support Tickets

**Tab:** `support_tickets`

Handle user support requests:

### Ticket Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `open` | مفتوحة | Yellow |
| `in_progress` | قيد المعالجة | Blue |
| `resolved` | تم الحل | Green |
| `closed` | مغلقة | Gray |

### Features
- **View Ticket** - See full ticket details
- **Reply to Ticket** - Send response to user
- **Update Status** - Change ticket status
- **Real-time Updates** - Live ticket notifications

### Ticket Information
- Subject
- Description
- User Information
- Replies Thread
- Timestamps
- Priority Level

---

## 8. Deletion Requests

**Tab:** `deletion_requests`  
**Route:** `/admin/deletion-requests`

Process account deletion requests:

### Request Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `pending` | قيد الانتظار | Yellow |
| `approved` | تمت الموافقة | Green |
| `rejected` | مرفوض | Red |

### Actions
- **Approve Deletion** - Delete user account permanently
- **Reject Deletion** - Deny request with reason

### Notifications
- User receives notification on approval
- User receives notification on rejection with reason

---

## 9. Analytics

**Route:** `/admin/analytics`

System-wide statistics and insights:

### Statistics Cards
- **Total Users** - All registered clients
- **Total Lawyers** - All registered lawyers
- **Total Cases** - All cases in system
- **Total Appointments** - All scheduled appointments
- **Pending Approvals** - Accounts awaiting verification

### Data Visualizations
- User registration trends
- Case status distribution
- Top performing lawyers
- Approval statistics
- Monthly activity charts

### Features
- **Refresh Data** - Update statistics
- **Export Data** - Download reports
- **Date Range Filter** - Analyze specific periods

---

## 10. Cases Management

**Route:** `/admin/cases`

Monitor and manage all system cases:

### Case Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `active` | نشطة | Green |
| `pending` | معلقة | Yellow |
| `closed` | مغلقة | Gray |
| `archived` | مؤرشفة | Blue |

### Features
- **View All Cases** - List with filters
- **Case Details** - Full case information
- **Update Status** - Change case status
- **Search Cases** - Find by number/title
- **Filter by Status** - Show specific statuses
- **Statistics** - Case counts by status

### Case Information
- Case Number
- Case Type
- Parties (Plaintiff/Defendant)
- Assigned Lawyer
- Court
- Filing Date
- Current Status
- Timeline

---

## 11. Appointments Management

**Route:** `/admin/appointments`

Oversee lawyer-client appointments:

### Appointment Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `scheduled` | مجدولة | Blue |
| `completed` | مكتملة | Green |
| `cancelled` | ملغية | Red |
| `pending` | معلقة | Yellow |

### Statistics
- Total Appointments
- Today's Appointments
- Upcoming Appointments
- Completed Appointments

### Features
- **View All Appointments** - Full list
- **Filter by Status** - Show specific statuses
- **Filter by Date** - Date range selection
- **Appointment Details** - Full information
- **Update Status** - Change appointment status

---

## 12. Payments Management

**Route:** `/admin/payments`

Track invoices and payments:

### Invoice Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `pending` | معلقة | Yellow |
| `paid` | مدفوعة | Green |
| `overdue` | متأخرة | Red |
| `cancelled` | ملغية | Gray |

### Payment Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `pending` | قيد المعالجة | Yellow |
| `completed` | مكتملة | Green |
| `failed` | فاشلة | Red |
| `refunded` | مستردة | Blue |

### Statistics
- Total Revenue
- Pending Payments
- Paid Amount
- Outstanding Amount

### Features
- **View Invoices** - All invoices list
- **View Payments** - Payment transactions
- **Update Invoice Status** - Mark as paid/cancelled
- **Update Payment Status** - Process payments
- **Financial Statistics** - Revenue overview

---

## 13. System AI

**Route:** `/admin/system-ai`

AI-powered administrative assistant:

### Features
- **Chat Interface** - Conversational AI
- **Conversation History** - Save and resume chats
- **Multiple Conversations** - Manage many topics
- **Dark Mode Support** - Theme switching

### Capabilities
- Answer system questions
- Provide usage guidance
- Analyze data patterns
- Generate reports
- Troubleshoot issues

### Interface
- **Sidebar** - Conversation list
- **Chat Area** - Message display
- **Input Field** - Send messages
- **New Conversation** - Start fresh chat
- **Delete Conversation** - Remove history

---

## Role Hierarchy

### Permission Levels

```
Super Admin (مسؤول عام)
   ├── Full system access
   ├── Can create/manage admins
   ├── Can assign super_admin role
   └── Cannot be demoted by regular admins

Admin (مسؤول)
   ├── User/Lawyer verification
   ├── Court clerk management
   ├── Support ticket handling
   ├── Analytics viewing
   └── Cannot manage other admins
```

### Access Control
| Feature | Admin | Super Admin |
|---------|-------|-------------|
| User Verification | ✓ | ✓ |
| Lawyer Verification | ✓ | ✓ |
| Court Management | ✓ | ✓ |
| Support Tickets | ✓ | ✓ |
| Analytics | ✓ | ✓ |
| Promote to Admin | ✓ | ✓ |
| Demote Admin | ✗ | ✓ |
| Assign Super Admin | ✗ | ✓ |

---

## Technical Architecture

### Frontend Structure
```
src/
├── pages/
│   ├── AdminDashboard.jsx        # Main dashboard with tabs
│   ├── AdminVerification.jsx     # User verification page
│   ├── AdminCasesManagement.jsx  # Cases overview
│   └── admin/
│       ├── Analytics.jsx         # Statistics dashboard
│       ├── CasesManagement.jsx   # Detailed cases management
│       ├── AppointmentsManagement.jsx
│       ├── PaymentsManagement.jsx
│       ├── DeletionRequests.jsx
│       └── SystemAI.jsx
├── components/admin/
│   ├── AdminProfileModal.jsx
│   ├── analytics/
│   │   └── StatCard.jsx
│   └── systemAI/
│       ├── ChatSidebar.jsx
│       └── ChatArea.jsx
└── services/
    ├── analyticsApi.js
    ├── casesApi.js
    ├── appointmentsApi.js
    ├── paymentsApi.js
    ├── deletionRequestApi.js
    └── supportApi.js
```

### Database Tables
| Table | Purpose |
|-------|---------|
| `users` | Client accounts |
| `lawyers` | Lawyer accounts |
| `admins` | Admin accounts |
| `user_roles` | Multi-role support |
| `court_clerks` | Clerk assignments |
| `courts` | Court registry |
| `support_tickets` | Support requests |
| `deletion_requests` | Deletion requests |
| `cases` | Legal cases |
| `appointments` | Scheduled meetings |
| `invoices` | Billing records |
| `payments` | Payment transactions |

### API Endpoints

#### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| PUT | `/api/users/:id/status` | Update account status |
| POST | `/api/auth/assign-role` | Assign role to user |

#### Support
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/support/tickets` | Get all tickets |
| PUT | `/api/support/tickets/:id/status` | Update ticket status |
| POST | `/api/support/tickets/:id/reply` | Reply to ticket |

#### Deletion Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deletion-requests` | Get pending requests |
| PUT | `/api/deletion-requests/:id` | Approve/reject request |

#### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Get statistics |
| GET | `/api/analytics/cases` | Case statistics |
| GET | `/api/analytics/users` | User statistics |

---

## Authentication

### Admin Login
1. Admin logs in with credentials
2. System verifies role is `admin` or `super_admin`
3. JWT token issued with admin privileges
4. Role stored in localStorage

### Session Check
```javascript
const userData = JSON.parse(localStorage.getItem('user'));
if (!userData.role || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
    navigate('/login');
}
```

---

## Real-time Features

### Support Tickets
- Supabase real-time subscription
- Automatic ticket list refresh
- Live reply notifications

### Notifications
- Admin receives alerts for:
  - New user registrations
  - New support tickets
  - Deletion requests
  - System alerts

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project
- Admin account in database

### Accessing Admin Panel
1. Login with admin credentials
2. Navigate to `/admin/dashboard`
3. User must have `role: 'admin'` or `role: 'super_admin'`

### Creating First Admin
```sql
INSERT INTO admins (id_number, first_name, last_name, email, password_hash, role)
VALUES ('123456789', 'Admin', 'User', 'admin@example.com', '<hashed_password>', 'super_admin');
```

---

## Notes

- All actions require admin authentication
- Super admin actions are validated server-side
- Deletion requests permanently remove data
- Ban status prevents user login
- Real-time updates via Supabase subscriptions
- Dark mode preference is persisted
- Arabic RTL interface
