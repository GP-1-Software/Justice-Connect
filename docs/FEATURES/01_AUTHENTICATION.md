# Authentication & Authorization Feature

## Overview
The authentication system provides secure user registration, login, and role-based access control for Clients, Lawyers, and Admins.

## Features

### User Registration
- **Signup Page**: `/signup`
- Supports multiple user types:
  - Clients (regular users)
  - Lawyers (requires verification)
- Registration fields:
  - First name, Last name
  - Email
  - Phone number
  - Password
  - User type selection
  - Additional fields for lawyers (license number, specialization, etc.)

### User Login
- **Login Page**: `/login`
- Email/password authentication
- Session management
- Automatic redirect based on user role

### Role-Based Access Control

#### Client Access
- Accessible routes: `/client/*`
- Features available:
  - Dashboard
  - Search lawyers
  - Case management
  - Appointments
  - Profile settings

#### Lawyer Access
- Accessible routes: `/lawyer/*`
- Requires verification (pending status shown if not verified)
- Features available:
  - Dashboard
  - Case management
  - Calendar
  - Profile management

#### Admin Access
- Accessible routes: `/admin/*`
- Requires admin role
- Features available:
  - User verification
  - User management
  - Deletion requests
  - System statistics

### Authentication Hooks

#### `useClientAuth`
- Location: `src/hooks/useClientAuth.jsx`
- Purpose: Client authentication and profile management
- Returns:
  - `userProfile`: Client profile data
  - `loading`: Loading state
  - `logout`: Logout function

#### `useLawyerAuth`
- Location: `src/hooks/useLawyerAuth.jsx`
- Purpose: Lawyer authentication and profile management
- Returns:
  - `lawyer`: Lawyer profile data
  - `loading`: Loading state
  - `logout`: Logout function

### Protected Routes
- Routes are protected using authentication hooks
- Unauthenticated users are redirected to `/login`
- Role-based route access enforced

### Verification System
- Lawyers must be verified by admin before full access
- Pending verification page: `/pending-verification`
- Admin verification page: `/admin/verification`

## Implementation Details

### Session Management
- Uses Supabase authentication
- Session stored securely
- Auto-refresh enabled

### Security Features
- Password hashing (handled by Supabase)
- Row Level Security (RLS) policies
- Secure token storage
- Protected API endpoints

## Usage Examples

### Client Login Flow
```javascript
import { useClientAuth } from '../hooks/useClientAuth';

function ClientComponent() {
  const { userProfile, loading } = useClientAuth();
  
  if (loading) return <Loading />;
  if (!userProfile) return <Navigate to="/login" />;
  
  return <ClientDashboard />;
}
```

### Lawyer Login Flow
```javascript
import { useLawyerAuth } from '../hooks/useLawyerAuth';

function LawyerComponent() {
  const { lawyer, loading } = useLawyerAuth();
  
  if (loading) return <Loading />;
  if (!lawyer) return <Navigate to="/login" />;
  
  return <LawyerDashboard />;
}
```

## Related Files
- `src/pages/Login.jsx`
- `src/pages/Signup.jsx`
- `src/pages/PendingVerification.jsx`
- `src/hooks/useClientAuth.jsx`
- `src/hooks/useLawyerAuth.jsx`
- `src/routes/clientRoutes.jsx`
- `src/routes/lawyerRoutes.jsx`





