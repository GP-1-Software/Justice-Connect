# Case Management Feature

## Overview
Comprehensive case management system allowing clients to create and track legal cases, and lawyers to manage assigned cases with detailed updates, files, tasks, and notes.

## Client-Side Features

### Case Creation
- **Page**: `/client/create-case`
- **Fields Required**:
  - Case title
  - Case type (criminal, civil, commercial, family, labor, real estate, administrative, other)
  - Description
  - Priority (low, normal, high, urgent)
  - Assigned lawyer selection
  - Optional fields:
    - Court name
    - Filing date
    - Next hearing date

### Case List View
- **Page**: `/client/cases`
- Displays all client cases
- Filtering options:
  - By status
  - By case type
  - By priority
- Search functionality
- Case cards showing:
  - Case number
  - Title
  - Status badge
  - Assigned lawyer
  - Last update date

### Case Details View
- **Page**: `/client/cases/:caseId`
- **Tabs Available**:
  1. **Overview**: Case summary, client/lawyer info, key dates
  2. **Timeline**: Chronological events and updates
  3. **Tasks**: Assigned tasks with status
  4. **Files**: Uploaded documents and evidence
  5. **Notes**: Shared notes between client and lawyer

### Case Statuses
- `pending`: Awaiting lawyer acceptance
- `active`: Case is active
- `in_progress`: Actively being worked on
- `on_hold`: Temporarily paused
- `completed`: Successfully completed
- `closed`: Case closed
- `cancelled`: Case cancelled
- `rejected`: Rejected by lawyer

## Lawyer-Side Features

### Cases List
- **Page**: `/lawyer/cases`
- View all assigned cases
- Filter by status, type, priority
- Search cases
- Quick actions

### Case Detail Management
- **Page**: `/lawyer/cases/:caseId`
- **Components**:
  1. **Case Header**: Case info, status update, priority
  2. **Update Composer**: Add timeline updates
  3. **Timeline**: View all events (can delete)
  4. **Private Notes**: Lawyer-only notes
  5. **Evidence Uploader**: Upload case files
  6. **Task Manager**: Create and manage tasks

### Case Timeline
- Automatic events:
  - Case creation
  - Status changes
  - File uploads
  - Task completions
- Manual updates from lawyers
- Real-time updates via Supabase subscriptions

### Case Notes
- **Shared Notes**: Visible to both client and lawyer
- **Private Notes**: Lawyer-only notes
- Notes include:
  - Author information
  - Timestamp
  - Content
  - Visibility setting

### Case Tasks
- Create tasks with:
  - Title
  - Description
  - Due date
  - Priority
  - Assignee (optional)
- Task statuses:
  - `pending`
  - `in_progress`
  - `completed`
  - `cancelled`

### File Management
- Upload files to cases
- Supported file types: All (PDFs, images, documents, etc.)
- File metadata:
  - File name
  - File type
  - File size
  - Upload date
  - Uploader
- Files stored in Supabase Storage
- Download capability
- Delete capability (with permissions)

## Case API Functions

### Client Functions
Located in `src/services/caseApi.js`:

- `createCase(caseData)`: Create new case
- `getUserCases(userId, userType, filters)`: Get cases for user
- `getCaseById(caseId)`: Get case details
- `uploadCaseFile(fileData)`: Upload file to case
- `deleteCaseFile(fileId)`: Delete case file

### Timeline Functions
- `createTimelineEvent(eventData)`: Create timeline event
- `getCaseTimeline(caseId)`: Get all timeline events

### Helper Functions
- `getCaseTypes()`: Get available case types
- `getCasePriorities()`: Get priority options
- `getCaseStatuses()`: Get status options

## Real-time Updates
- Uses Supabase real-time subscriptions
- Automatic updates when:
  - Case status changes
  - Timeline events added
  - Files uploaded
  - Tasks updated

## Case Report Generation
- Generate comprehensive PDF reports
- Includes all case information
- Full Arabic support
- See [PDF Report Feature](./05_PDF_REPORTS.md) for details

## Database Schema

### Cases Table
- `case_id`: Primary key
- `client_id`: Foreign key to users
- `assigned_lawyer_id`: Foreign key to lawyers
- `title`: Case title
- `case_type`: Type of case
- `description`: Case description
- `status`: Current status
- `priority`: Priority level
- `case_number`: Auto-generated case number
- `court_name`: Optional court name
- `filing_date`: Date filed
- `next_hearing_date`: Next hearing date
- `created_at`, `updated_at`: Timestamps

### Timeline Events Table
- `event_id`: Primary key
- `case_id`: Foreign key
- `event_type`: Type of event
- `author_id`: User who created event
- `author_type`: 'client' or 'lawyer'
- `title`: Event title
- `description`: Event description
- `visibility`: 'all' or 'lawyer'
- `files`: JSON array of related files
- `created_at`: Timestamp

### Case Files Table
- `file_id`: Primary key
- `case_id`: Foreign key
- `uploaded_by`: User ID
- `uploader_type`: 'client' or 'lawyer'
- `file_name`: Original filename
- `file_url`: Storage URL
- `file_type`: MIME type
- `file_size`: File size in bytes
- `description`: Optional description
- `created_at`: Timestamp

### Case Tasks Table
- `task_id`: Primary key
- `case_id`: Foreign key
- `title`: Task title
- `description`: Task description
- `status`: Task status
- `priority`: Task priority
- `due_date`: Optional due date
- `assigned_to`: Optional assignee
- `created_at`, `updated_at`: Timestamps

### Case Notes Table
- `note_id`: Primary key
- `case_id`: Foreign key
- `lawyer_id`: Foreign key to lawyers
- `content`: Note content
- `is_shared`: Boolean (visible to client)
- `created_at`, `updated_at`: Timestamps

## Usage Examples

### Creating a Case
```javascript
import { createCase } from '../services/caseApi';

const newCase = await createCase({
  client_id: userProfile.user_id,
  assigned_lawyer_id: selectedLawyerId,
  title: 'Case Title',
  case_type: 'civil',
  description: 'Case description',
  status: 'pending',
  priority: 'normal'
});
```

### Adding Timeline Update
```javascript
import { createTimelineEvent } from '../services/caseApi';

await createTimelineEvent({
  case_id: caseId,
  event_type: 'update',
  author_id: lawyer.lawyer_id,
  author_type: 'lawyer',
  title: 'Court Hearing Scheduled',
  description: 'Hearing scheduled for next week',
  visibility: 'all'
});
```

### Uploading File
```javascript
import { uploadCaseFile } from '../services/caseApi';

const fileData = await uploadCaseFile({
  file: selectedFile,
  case_id: caseId,
  uploaded_by: userId,
  uploader_type: 'client',
  description: 'Contract document'
});
```

## Related Files
- `src/pages/client/CreateCase.jsx`
- `src/pages/client/MyCases.jsx`
- `src/pages/client/CaseDetails.jsx`
- `src/pages/lawyer/Cases/CasesList.jsx`
- `src/pages/lawyer/CaseDetail/CaseDetail.jsx`
- `src/services/caseApi.js`
- `src/components/client/case-details/` (all components)





