# Lawyer & Client Modules - المحامي والعميل

## Overview

This document covers the complete feature set for both **Lawyer** and **Client** modules in the Justice Connect platform. These modules enable lawyers to manage their practice and clients to access legal services seamlessly.

---

# Part 1: Lawyer Module - نظام المحامي

## Table of Contents - Lawyer

1. [Lawyer Dashboard](#1-lawyer-dashboard)
2. [Cases Management](#2-cases-management)
3. [Case Details](#3-case-details)
4. [Appointments Management](#4-appointments-management)
5. [Calendar](#5-calendar)
6. [Electronic Filing](#6-electronic-filing-file-case)
7. [Invoices](#7-invoices)
8. [Profile](#8-lawyer-profile)
9. [Settings](#9-lawyer-settings)
10. [Justice AI](#10-lawyer-justice-ai)

---

## 1. Lawyer Dashboard

**Route:** `/lawyer/dashboard`

Central hub displaying key metrics and quick actions.

### Statistics Cards
| Metric | Arabic | Description |
|--------|--------|-------------|
| Total Cases | إجمالي القضايا | All assigned cases |
| Active Cases | القضايا النشطة | Currently active cases |
| Upcoming Appointments | المواعيد القادمة | Pending/confirmed appointments |
| Completed Cases | القضايا المنجزة | Fully executed cases |

### Rating Display
- Average star rating (1-5)
- Total ratings count
- Visual star indicators

### Components
- **Welcome Banner** - Personalized greeting
- **Stats Cards** - Key metrics
- **Quick Actions** - Navigation shortcuts
- **Palestinian News** - Legal news feed

---

## 2. Cases Management

**Route:** `/lawyer/cases`

Manage all assigned legal cases.

### Features
- **Case List** - All cases with cards
- **Search** - Find by case number/title
- **Filters** - Status, case type, date range
- **Add Case** - Create new case manually
- **Refresh** - Update case list

### Case Card Information
- Case number
- Case type/title
- Client name
- Status badge
- Filing date
- Court information
- Quick actions

### Case Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `active` | نشطة | Green |
| `pending` | معلقة | Yellow |
| `closed` | مغلقة | Gray |
| `archived` | مؤرشفة | Blue |

---

## 3. Case Details

**Route:** `/lawyer/cases/:case_id`

Comprehensive case view with 11 component sections.

### Components

#### Case Header
- Case number and title
- Status and stage badges
- Court information
- Quick actions menu

#### Client Info
- Client details (name, ID, contact)
- Plaintiff/Defendant information
- Add/edit client data

#### Court Filing Tracker
- Filing status tracking
- Stage progression visualization
- Timeline of filing events
- Document status

#### Evidence Uploader
- Upload case documents
- Manage evidence files
- File categorization
- Download/preview files

#### Meeting Manager
- Schedule video meetings
- Meeting links (Jitsi/custom)
- Meeting history
- Join meeting functionality

#### Private Notes
- Lawyer-only notes
- Timestamped entries
- Edit/delete notes
- Search notes

#### Task Manager
- Case-related tasks
- Task status tracking
- Due dates
- Priority levels

#### Timeline
- Complete case history
- All events chronologically
- Event categorization
- Filtering options

#### Filing Update Response
- Respond to court requests
- Submit amendments
- Upload additional documents

#### Update Composer
- Send case updates
- Notify relevant parties
- Attach documents

---

## 4. Appointments Management

**Route:** `/lawyer/appointments`

Manage client appointments and video consultations.

### Appointment Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `pending` | قيد الانتظار | Yellow |
| `confirmed` | مؤكد | Green |
| `completed` | مكتمل | Blue |
| `cancelled` | ملغي | Red |
| `rejected` | مرفوض | Gray |

### Appointment Methods
| Method | Arabic | Icon |
|--------|--------|------|
| `video` | فيديو | Video |
| `phone` | هاتف | Phone |
| `in_person` | حضوري | MapPin |

### Features
- **Accept Appointment** - Confirm pending request
- **Reject Appointment** - Decline with reason
- **Complete Appointment** - Mark as done
- **View Client Info** - Full client details modal
- **Join Meeting** - Video call integration
- **End Meeting** - Close video session

### Statistics
- Total appointments
- Today's appointments
- Pending requests
- Completed count

### Filtering & Sorting
- Filter by status
- Filter by method
- Search by client name
- Sort by date/time

---

## 5. Calendar

**Route:** `/lawyer/calendar`

Visual calendar for appointments and hearings.

### Features
- **Month View** - Full month display
- **Appointment Markers** - Color-coded entries
- **Hearing Dates** - Court date indicators
- **Click to View** - Appointment details
- **Navigation** - Previous/next month

### Calendar Components
- Monthly grid view
- Day details panel
- Event list for selected date
- Status indicators

---

## 6. Electronic Filing (File Case)

**Route:** `/lawyer/file-case`

Submit electronic filings to court.

### Filing Form Sections

#### Case Information
- Case type selection
- Case subject
- Case reasons/grounds
- Monetary claim amount

#### Court Selection
- City selection
- Court type selection
- Auto court assignment

#### Plaintiff Information
- Full name
- ID number
- Address
- Phone number
- Email (optional)

#### Defendant Information
- Full name
- ID number
- Address
- Phone number

#### Attachments
- Upload documents (PDF)
- Multiple file support
- File size validation
- Remove attachments

### Submission Process
1. Fill all required fields
2. Attach supporting documents
3. Validate form data
4. Submit to court system
5. Receive filing number
6. Track filing status

### Linking Options
- Create new case
- Link to existing case

---

## 7. Invoices

### Create Invoice
**Route:** `/lawyer/invoices/create`

#### Features
- **Client Selection** - Search by case or client
- **Case/Appointment Linking** - Auto-fill from case
- **Multi-Item Invoice** - Add multiple line items
- **Tax Calculation** - Automatic tax computation
- **Discount Application** - Percentage or fixed
- **Due Date Setting** - Payment deadline

#### Invoice Items
- Description
- Quantity
- Unit price
- Line total

#### Search Options
- Search by case number
- Search by filing number
- Search by appointment number

### Invoice List
**Route:** `/lawyer/invoices`

- View all created invoices
- Filter by status
- Track payment status
- Invoice details view

---

## 8. Lawyer Profile

**Route:** `/lawyer/profile`

Professional profile management.

### Profile Sections

#### Basic Information
- First name, Last name
- Email address
- Phone number
- Profile photo

#### Professional Details
- Bar association number
- Specialization
- Years of experience
- Consultation fee

#### Office Information
- Office address
- City
- Working hours

#### Availability Settings
- Available days
- Time slots configuration
- Consultation duration

---

## 9. Lawyer Settings

**Route:** `/lawyer/settings`

Account and preference settings.

### Sections

#### Security Settings
- Change password
- Current password verification
- Password strength requirements

#### Notification Preferences
- Email notifications toggle
- SMS notifications toggle
- Push notifications toggle

#### Account Management
- Request account deletion
- View deletion request status
- Delete request reasons

---

## 10. Lawyer Justice AI

**Route:** `/lawyer/justice-ai`

AI-powered legal assistant.

### Features
- Legal document analysis
- Case research assistance
- Law reference lookup
- Palestinian legal database search
- Document drafting help

---

# Part 2: Client Module - نظام العميل

## Table of Contents - Client

1. [Client Dashboard](#11-client-dashboard)
2. [Search Lawyers](#12-search-lawyers)
3. [Lawyer Profile View](#13-lawyer-profile-view)
4. [Book Appointment](#14-book-appointment)
5. [My Appointments](#15-my-appointments)
6. [My Cases](#16-my-cases)
7. [Create Case Request](#17-create-case-request)
8. [Case Details](#18-case-details)
9. [Invoices](#19-client-invoices)
10. [Court Fees](#20-court-fees)
11. [Client Settings](#21-client-settings)
12. [Client Justice AI](#22-client-justice-ai)

---

## 11. Client Dashboard

**Route:** `/client/dashboard`

Overview of client's legal matters.

### Features
- Welcome banner
- Active cases summary
- Upcoming appointments
- Recent invoices
- Quick action buttons

### Quick Actions
- Search lawyers
- View my cases
- View appointments
- Pay invoices

---

## 12. Search Lawyers

**Route:** `/client/search-lawyers`

Find and filter lawyers.

### Filter Options
| Filter | Arabic | Type |
|--------|--------|------|
| Specialization | التخصص | Dropdown |
| City | المدينة | Dropdown |
| Rating | التقييم | Range |
| Experience | الخبرة | Range |
| Fee Range | نطاق الأتعاب | Range |
| Availability | التوفر | Toggle |

### Search Features
- Text search (name)
- Multiple filters
- Clear all filters
- Grid/List view toggle

### Results Display
- Lawyer cards with:
  - Profile photo
  - Name and specialization
  - Rating (stars)
  - Experience years
  - Consultation fee
  - City/location
  - Book button

### Pagination
- Page navigation
- Items per page
- Total results count

---

## 13. Lawyer Profile View

**Route:** `/client/lawyers/:lawyer_id`

Detailed lawyer profile for clients.

### Profile Sections
- Photo and basic info
- Specialization details
- Experience and credentials
- Rating and reviews
- Consultation fee
- Office location
- Available time slots

### Actions
- Book appointment button
- View availability
- Contact options

---

## 14. Book Appointment

**Route:** `/client/book-appointment/:lawyer_id`

Schedule appointment with lawyer.

### Booking Steps

#### Step 1: Select Date
- Calendar display
- Available dates highlighted
- Holiday indicators

#### Step 2: Select Time
- Available time slots
- Slot duration display
- Already booked indicators

#### Step 3: Select Method
- Video call
- Phone call
- In-person meeting

#### Step 4: Case Details (Optional)
- Link existing case
- Describe new issue
- Add notes

#### Step 5: Confirmation
- Review booking details
- Fee summary
- Confirm booking

### Fee Calculation
- Base consultation fee
- Method adjustments
- Total amount display

---

## 15. My Appointments

**Route:** `/client/appointments`

View and manage appointments.

### Appointment Views
- **All Appointments** - Complete list
- **Upcoming** - Future appointments
- **Past** - Completed appointments

### Appointment Card
- Lawyer name and photo
- Date and time
- Method (video/phone/in-person)
- Status badge
- Associated case
- Actions

### Client Actions
- **View Details** - Full information
- **Cancel Appointment** - With reason
- **Join Meeting** - Video link
- **Reschedule** - Change date/time (if allowed)
- **View Case** - Go to linked case

### Status Filters
- All statuses
- Pending
- Confirmed
- Completed
- Cancelled

---

## 16. My Cases

**Route:** `/client/cases`

View all client cases.

### Case Categories

#### Cases as Plaintiff (مدعي)
- Cases where client filed
- Full case access
- Timeline view
- Document access

#### Cases Against Me (مدعى عليه)
- Cases filed against client
- Limited access view
- Notification of updates
- Defense preparation

### Case Statistics
- Total cases count
- Active cases
- Pending cases
- Closed cases

### Features
- Search by case number
- Filter by status
- Filter by type
- Sort options

---

## 17. Create Case Request

**Route:** `/client/cases/create`

Submit new case request to lawyer.

### Form Sections

#### Lawyer Selection
- Pre-selected or search
- Lawyer confirmation

#### Case Type
- Case category selection
- Type of legal matter

#### Case Details
- Case title/subject
- Full description
- Priority level

#### Defendant Information
- Opponent name
- Opponent details
- Known contact info

#### Supporting Documents
- Upload files
- Document descriptions
- Multiple file support

### Submission
- Review before submit
- Confirmation message
- Tracking number

---

## 18. Case Details

**Route:** `/client/cases/:case_id`

View case information.

### Visible Information
- Case number and title
- Case type and status
- Assigned lawyer
- Filing date
- Court information
- Timeline events

### Available Actions
- View documents
- View timeline
- Contact lawyer
- View hearings schedule
- View court fees

### Cases Against Me Details
**Route:** `/client/cases-against-me/:filing_id`
- View filing details
- Plaintiff information
- Case allegations
- Court dates
- Response options

---

## 19. Client Invoices

### Invoice List
**Route:** `/client/invoices`

View invoices from lawyers.

#### Statistics
- Total amount due
- Pending invoices count
- Paid amount
- Overdue count

#### Invoice Card
- Invoice number
- Lawyer name
- Amount
- Due date
- Status badge
- Pay button

### Invoice Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `pending` | معلقة | Yellow |
| `paid` | مدفوعة | Green |
| `overdue` | متأخرة | Red |
| `cancelled` | ملغاة | Gray |

### Pay Invoice
**Route:** `/client/invoices/:invoice_id/pay`

#### Payment Methods
- **Credit Card** - Visa, MasterCard
- **Bank Transfer** - Bank details provided

#### Payment Form (Card)
- Card number
- Expiry date
- CVV
- Cardholder name

#### Payment Process
1. Select payment method
2. Enter payment details
3. Review amount
4. Confirm payment
5. Receive confirmation

---

## 20. Court Fees

**Route:** `/client/court-fees`

View and pay court-issued fees.

### Fee Information
- Fee type
- Case reference
- Amount
- Due date
- Status

### Fee Statuses
| Status | Arabic | Color |
|--------|--------|-------|
| `pending` | معلقة | Yellow |
| `paid` | مدفوعة | Green |
| `overdue` | متأخرة | Red |

### Payment Features
- View fee details
- Pay individual fees
- Payment confirmation
- Receipt generation

---

## 21. Client Settings

**Route:** `/client/settings`

Account and preference management.

### Profile Settings
- Update personal info
- Change email
- Update phone

### Security
- Change password
- Password requirements

### Notifications
- Email notifications
- SMS notifications
- Push notifications

### Account
- Request account deletion
- Deletion request status
- Cancel deletion request

---

## 22. Client Justice AI

**Route:** `/client/justice-ai`

AI legal assistant for clients.

### Features
- Ask legal questions
- Understand legal processes
- Get case guidance
- Document explanation
- Rights information

### Capabilities
- Palestinian law queries
- Case type guidance
- Process explanations
- Document requirements
- General legal advice

---

# Technical Architecture

## Frontend Structure

```
src/pages/
├── lawyer/
│   ├── Dashboard/
│   │   ├── Dashboard.jsx
│   │   └── components/
│   │       ├── WelcomeBanner.jsx
│   │       ├── StatsCard.jsx
│   │       ├── QuickActions.jsx
│   │       └── TodayAppointmentsList.jsx
│   ├── Cases/
│   │   ├── CasesList.jsx
│   │   └── components/
│   │       ├── CaseCard.jsx
│   │       ├── EmptyState.jsx
│   │       └── AddCaseModal.jsx
│   ├── CaseDetail/
│   │   ├── CaseDetail.jsx
│   │   └── components/
│   │       ├── CaseHeader.jsx
│   │       ├── ClientInfo.jsx
│   │       ├── CourtFilingTracker.jsx
│   │       ├── EvidenceUploader.jsx
│   │       ├── MeetingManager.jsx
│   │       ├── PrivateNotes.jsx
│   │       ├── TaskManager.jsx
│   │       ├── Timeline.jsx
│   │       └── FilingUpdateResponse.jsx
│   ├── Appointments/
│   │   ├── Appointments.jsx
│   │   └── components/
│   ├── Calendar/
│   │   └── Calendar.jsx
│   ├── Profile/
│   │   └── Profile.jsx
│   ├── JusticeAI/
│   ├── FileCaseLawyer.jsx
│   ├── CreateInvoice.jsx
│   ├── LawyerInvoices.jsx
│   └── Settings.jsx
│
├── client/
│   ├── Dashboard/
│   │   └── Dashboard.jsx
│   ├── SearchLawyers.jsx
│   ├── LawyerProfile.jsx
│   ├── BookAppointment.jsx
│   ├── Appointments.jsx
│   ├── MyCases.jsx
│   ├── CreateCase.jsx
│   ├── CaseDetails.jsx
│   ├── CaseAgainstMeDetails.jsx
│   ├── ClientInvoices.jsx
│   ├── PayInvoice.jsx
│   ├── InvoiceDetails.jsx
│   ├── ClientCourtFees.jsx
│   ├── JusticeAI/
│   ├── Profile.jsx
│   └── Settings.jsx
```

## Services

```
src/services/
├── lawyerApi.js          # Lawyer search, profiles
├── appointmentApi.js     # Appointment booking
├── caseApi.js            # Case operations
├── invoiceService.js     # Invoice management
├── courtClerkApi.js      # Filing submissions
├── courtFeesService.js   # Court fees
├── meetingApi.js         # Video meetings
└── deletionRequestApi.js # Account deletion
```

## Hooks

```
src/hooks/
├── useLawyerAuth.js      # Lawyer authentication
├── useClientAuth.js      # Client authentication
├── useInvoices.js        # Invoice operations
├── usePayments.js        # Payment operations
└── useMessages.js        # Messaging
```

---

## Database Tables

### Lawyer-Related
| Table | Purpose |
|-------|---------|
| `lawyers` | Lawyer profiles |
| `lawyer_availability` | Available time slots |
| `cases` | Legal cases |
| `appointments` | Client appointments |
| `invoices` | Billing invoices |
| `invoice_items` | Invoice line items |
| `meetings` | Video meeting records |

### Client-Related
| Table | Purpose |
|-------|---------|
| `users` | Client profiles |
| `appointments` | Booked appointments |
| `cases` | Associated cases |
| `payments` | Payment records |
| `court_fees` | Court-issued fees |

---

## Video Meeting Integration

### Jitsi Meet Integration
- Automatic room creation
- Unique meeting IDs
- Join from browser
- Mobile compatible

### Meeting Flow
1. Lawyer creates meeting for appointment
2. Meeting link generated
3. Both parties receive link
4. Join via button click
5. Meeting recorded (optional)
6. Mark as completed

---

## Notes

- All interfaces support Arabic (RTL)
- Dark mode available throughout
- Mobile-responsive design
- Real-time updates via Supabase
- Secure authentication required
- Role-based access control
