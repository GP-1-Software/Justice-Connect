# Dashboard Features

## Overview
Both clients and lawyers have comprehensive dashboards providing overviews, statistics, and quick access to key features.

## Client Dashboard

### Page
- **Route**: `/client/dashboard`
- **Component**: `src/pages/client/Dashboard/Dashboard.jsx`

### Features

#### Welcome Section
- Personalized greeting with client name
- Current date display
- Gradient banner with welcome message

#### Statistics Cards
Displays key metrics:
- **Active Cases**: Number of active cases
- **Upcoming Appointments**: Count of upcoming appointments
- **Unread Messages**: Messages count (future feature)
- **Balance**: Account balance (future feature)

#### Recent Activity
- Chronological list of recent activities
- Shows:
  - Case updates
  - New appointments
  - File uploads
  - Status changes
- Activity types:
  - Case created
  - Case status changed
  - Appointment booked
  - File uploaded
  - Timeline event added
- Click to view full activity details

#### Quick Actions
Quick access buttons:
- **Create New Case**: Navigate to case creation
- **Search Lawyers**: Find and book lawyers
- **View My Cases**: Go to cases list
- **Book Appointment**: Quick appointment booking

#### Upcoming Appointments Widget
- Shows next upcoming appointment
- Displays:
  - Lawyer name
  - Date and time
  - Appointment type (online/in-person)
  - Status badge
- "View All" link to appointments page
- Empty state with "Book Appointment" button

#### Active Cases Widget
- Shows active cases preview
- Displays:
  - Case title
  - Last update date
  - Status badge
- "View All" link to cases page
- Empty state when no active cases

### Data Fetching
- Fetches dashboard summary via `clientApi.getDashboardSummary()`
- Fetches recent activity via `clientApi.getRecentActivity()`
- Fetches appointments via `getClientAppointments()`
- All data fetched in parallel for performance

### Components
- `StatsCards`: Statistics display
- `RecentActivity`: Activity timeline
- `QuickActions`: Quick action buttons

## Lawyer Dashboard

### Page
- **Route**: `/lawyer/dashboard`
- **Component**: `src/pages/lawyer/Dashboard/Dashboard.jsx`

### Features

#### Welcome Banner
- Personalized greeting
- Lawyer name display
- Motivating message
- Quick stats preview

#### Statistics Cards
Four key metrics:
- **Total Cases**: All cases assigned
- **Active Cases**: Currently active cases
- **Upcoming Appointments**: Scheduled appointments
- **Completed Cases**: Successfully completed cases

#### Quick Actions
- **Add New Case**: Create case (if applicable)
- **View All Cases**: Navigate to cases list
- **Calendar**: Open calendar view
- **Profile**: Edit profile

#### Calendar Preview
- Mini calendar widget
- Shows current month
- Highlights:
  - Today's date
  - Days with appointments
  - Days with hearings
- Click to view full calendar

#### Quick Revenue (Future)
- Revenue overview
- Monthly earnings
- Pending payments

#### Today's Appointments List
- List of today's appointments
- Shows:
  - Client name
  - Time
  - Status
  - Related case (if any)
- Quick actions:
  - View details
  - Mark as completed
  - Reschedule

#### Cases Assigned Widget
- Recent cases list
- Shows:
  - Case title
  - Client name
  - Status
  - Priority
  - Last update
- Quick link to case details

### Data Fetching
- Fetches statistics from Supabase:
  - Total cases count
  - Active cases count
  - Upcoming appointments count
  - Completed cases count
- Fetches appointments for today
- Fetches recent cases
- Real-time updates via subscriptions

### Components
- `WelcomeBanner`: Personalized welcome
- `StatsCard`: Reusable stat card component
- `QuickActions`: Action buttons
- `CalendarPreview`: Mini calendar
- `QuickRevenue`: Revenue widget (future)
- `TodayAppointmentsList`: Today's appointments
- `CasesAssigned`: Recent cases widget

## Admin Dashboard

### Page
- **Route**: `/admin/dashboard`
- **Component**: `src/pages/AdminDashboard.jsx`

### Features

#### Tabs
- **Users**: Manage client users
- **Lawyers**: Manage lawyer accounts
- **Admins**: Manage admin accounts
- **Super Admins**: Manage super admin accounts
- **Deletion Requests**: Handle account deletion requests

#### Status Filtering
For each user type:
- **Pending**: Awaiting verification
- **Approved**: Verified and active
- **Rejected**: Rejected verifications

#### User Management
- View user details
- Approve/reject lawyer registrations
- View user statistics
- Search and filter users

#### Verification System
- Review lawyer documentation
- Approve with one click
- Reject with reason
- View verification history

#### Deletion Requests
- View pending deletion requests
- Review request details
- Approve or deny deletions
- Add admin notes
- Process requests

#### Statistics
- Total users count
- Total lawyers count
- Pending verifications count
- Pending deletion requests count

## Dashboard Data Structure

### Client Dashboard Summary
```javascript
{
  activeCases: number,
  upcomingAppointments: number,
  unreadMessages: number,
  balance: number
}
```

### Recent Activity
```javascript
[
  {
    id: number,
    type: string,
    title: string,
    description: string,
    timestamp: string,
    link: string
  }
]
```

### Lawyer Dashboard Stats
```javascript
{
  totalCases: number,
  activeCases: number,
  upcomingAppointments: number,
  completedCases: number
}
```

## Real-time Updates

### Client Dashboard
- Subscribes to case updates
- Subscribes to appointment updates
- Auto-refreshes activity feed

### Lawyer Dashboard
- Subscribes to case changes
- Subscribes to appointment changes
- Real-time statistics updates

## Responsive Design

### Mobile View
- Stacked statistics cards
- Collapsible sections
- Optimized layouts
- Touch-friendly buttons

### Tablet View
- 2-column grid for stats
- Optimized spacing
- Side-by-side widgets

### Desktop View
- Full grid layout
- All widgets visible
- Optimal spacing
- Hover effects

## Performance Optimization

### Data Fetching
- Parallel API calls
- Caching strategies
- Lazy loading for heavy data
- Pagination for lists

### Rendering
- Component memoization
- Virtual scrolling for long lists
- Image lazy loading
- Optimized re-renders

## Usage Examples

### Accessing Dashboard Data
```javascript
import { clientApi } from '../services/clientApi';

const summary = await clientApi.getDashboardSummary(userId);
const activities = await clientApi.getRecentActivity(userId);
```

### Updating Statistics
```javascript
// Statistics automatically update when data changes
// No manual refresh needed with real-time subscriptions
```

## Related Files

### Client Dashboard
- `src/pages/client/Dashboard/Dashboard.jsx`
- `src/pages/client/Dashboard/components/StatsCards.jsx`
- `src/pages/client/Dashboard/components/RecentActivity.jsx`
- `src/pages/client/Dashboard/components/QuickActions.jsx`
- `src/services/clientApi.js`

### Lawyer Dashboard
- `src/pages/lawyer/Dashboard/Dashboard.jsx`
- `src/pages/lawyer/Dashboard/components/WelcomeBanner.jsx`
- `src/pages/lawyer/Dashboard/components/StatsCard.jsx`
- `src/pages/lawyer/Dashboard/components/QuickActions.jsx`
- `src/pages/lawyer/Dashboard/components/CalendarPreview.jsx`
- `src/pages/lawyer/Dashboard/components/TodayAppointmentsList.jsx`
- `src/pages/lawyer/Dashboard/components/CasesAssigned.jsx`

### Admin Dashboard
- `src/pages/AdminDashboard.jsx`
- `src/pages/admin/DeletionRequests.jsx`
- `src/pages/AdminVerification.jsx`





