# Admin Features

## Overview
Administrative features for managing users, verifying lawyers, handling deletion requests, and maintaining system integrity.

## Admin Dashboard

### Page
- **Route**: `/admin/dashboard`
- **Component**: `src/pages/AdminDashboard.jsx`
- **Access**: Requires admin or super_admin role

### Main Tabs

#### 1. Users Tab
- View all client users
- Filter by status:
  - **Pending**: Awaiting approval
  - **Approved**: Active users
  - **Rejected**: Rejected registrations
- User information:
  - Name
  - Email
  - Phone
  - Registration date
  - Status
- Actions:
  - View details
  - Approve/Reject
  - View user cases

#### 2. Lawyers Tab
- View all lawyer accounts
- Filter by verification status:
  - **Pending**: Awaiting verification
  - **Approved**: Verified and active
  - **Rejected**: Rejected verifications
- Lawyer information:
  - Name
  - Email
  - Specialization
  - License number
  - Years of experience
  - Verification status
- Actions:
  - View details
  - Verify/Reject
  - View lawyer cases

#### 3. Admins Tab
- View all admin accounts
- Admin information:
  - Name
  - Email
  - Role (admin/super_admin)
  - Created date
- Actions:
  - View details
  - Manage permissions (super_admin only)

#### 4. Super Admins Tab
- View super admin accounts
- Full system access
- Can manage other admins

#### 5. Deletion Requests Tab
- Handle account deletion requests
- Request information:
  - User information
  - Request reason
  - Request date
  - Status
- Actions:
  - Approve deletion
  - Deny deletion
  - Add admin notes

### Statistics
Dashboard displays:
- Total users count
- Total lawyers count
- Pending verifications count
- Pending deletion requests count

## Lawyer Verification System

### Verification Page
- **Route**: `/admin/verification`
- **Component**: `src/pages/AdminVerification.jsx`

### Verification Process

#### 1. View Pending Verifications
- List of lawyers awaiting verification
- Shows:
  - Lawyer name
  - Email
  - Specialization
  - License number
  - Registration date
  - Documents uploaded

#### 2. Review Documents
- View lawyer's license
- View professional documents
- Verify information matches documents

#### 3. Verification Actions

##### Approve
- Click "Approve" button
- Lawyer account activated
- Lawyer receives confirmation
- Lawyer can access full platform features

##### Reject
- Click "Reject" button
- Enter rejection reason (required)
- Lawyer account marked as rejected
- Lawyer receives notification with reason
- Lawyer can resubmit after corrections

### Verification Criteria
- Valid license number
- Matching documentation
- Complete profile information
- Professional credentials verified

## Deletion Requests Management

### Deletion Requests Page
- **Route**: `/admin/deletion-requests`
- **Component**: `src/pages/admin/DeletionRequests.jsx`

### Features

#### View Requests
- List of all deletion requests
- Filter by status:
  - **Pending**: Awaiting review
  - **Approved**: Deletion approved
  - **Denied**: Request denied
- Request information:
  - User name and type
  - Request reason
  - Request date
  - Status
  - Admin notes

#### Process Requests

##### Approve Deletion
1. Review request details
2. Verify user information
3. Check for active cases/appointments
4. Add admin notes (optional)
5. Click "Approve"
6. User account deleted
7. Related data handled per policy

##### Deny Deletion
1. Review request
2. Add denial reason (required)
3. Add admin notes
4. Click "Deny"
5. User receives notification
6. Account remains active

### Deletion Policies
- Active cases: Warning before deletion
- Pending appointments: Must be cancelled
- Financial obligations: Must be resolved
- Data retention: Per policy

## User Management

### View User Details
- Full profile information
- Account status
- Registration date
- Last login
- Activity history
- Related cases
- Related appointments

### User Actions
- **Suspend**: Temporarily disable account
- **Activate**: Reactivate suspended account
- **Delete**: Permanently delete account
- **Reset Password**: Force password reset
- **Send Email**: Contact user directly

### Search & Filter
- Search by name, email, phone
- Filter by:
  - User type
  - Status
  - Registration date
  - Activity status

## System Statistics

### Overview Stats
- Total users
- Total lawyers
- Total cases
- Total appointments
- Active users (last 30 days)
- New registrations (this month)

### Activity Metrics
- Cases created (by period)
- Appointments booked (by period)
- Platform usage trends
- User engagement metrics

## Security Features

### Access Control
- Role-based access (admin/super_admin)
- Session management
- Secure API endpoints
- Audit logging

### Audit Log
- Track admin actions:
  - User verifications
  - Deletion approvals
  - Account modifications
  - System changes
- Log includes:
  - Admin who performed action
  - Timestamp
  - Action details
  - Target user/entity

## API Functions

### Deletion Requests
Located in `src/services/deletionRequestApi.js`:

- `getPendingDeletionRequests()`: Get pending requests
- `updateDeletionRequestStatus(requestId, status, notes)`: Update request status
- `createDeletionRequest(userId, reason)`: Create deletion request

### Verification
- Verification handled via Supabase admin functions
- Direct database updates for verification status

## Usage Examples

### Approving Lawyer Verification
```javascript
// In AdminVerification component
const handleApprove = async (lawyerId) => {
  const { error } = await supabase
    .from('lawyers')
    .update({ 
      verification_status: 'approved',
      verified_at: new Date().toISOString()
    })
    .eq('lawyer_id', lawyerId);
  
  if (!error) {
    // Send notification to lawyer
    // Refresh list
  }
};
```

### Processing Deletion Request
```javascript
import { updateDeletionRequestStatus } from '../services/deletionRequestApi';

const handleApproveDeletion = async (requestId) => {
  await updateDeletionRequestStatus(
    requestId,
    'approved',
    'Admin notes here'
  );
  
  // Delete user account
  // Handle related data
};
```

## Database Schema

### Users Table
- Admin role field
- Verification status
- Account status

### Lawyers Table
- `verification_status`: 'pending', 'approved', 'rejected'
- `verified_at`: Timestamp
- `verified_by`: Admin ID
- `license_number`: For verification
- `verification_documents`: JSON array

### Deletion Requests Table
- `request_id`: Primary key
- `user_id`: Foreign key
- `user_type`: 'client' or 'lawyer'
- `reason`: Request reason
- `status`: 'pending', 'approved', 'denied'
- `admin_notes`: Admin notes
- `processed_by`: Admin ID
- `processed_at`: Timestamp
- `created_at`: Request date

## Related Files
- `src/pages/AdminDashboard.jsx`
- `src/pages/AdminVerification.jsx`
- `src/pages/admin/DeletionRequests.jsx`
- `src/services/deletionRequestApi.js`





