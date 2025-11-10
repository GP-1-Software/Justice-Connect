# Appointments Feature

## Overview
The appointments system allows clients to book consultations with lawyers and enables lawyers to manage their appointment calendar.

## Client Features

### Search Lawyers
- **Page**: `/client/search-lawyers`
- Advanced search with filters:
  - Search term (name/specialization)
  - Specialization filter
  - City filter
  - Experience range
  - Price range
  - Sort options (newest, oldest, experience, price)
- Grid and list view modes
- Lawyer cards showing:
  - Profile image
  - Name
  - Specialization
  - Years of experience
  - City
  - Consultation fee
  - Rating (if available)

### Lawyer Profile
- **Page**: `/client/lawyer/:lawyerId`
- View detailed lawyer information:
  - Full profile
  - Specializations
  - Experience
  - Bio
  - License information
  - Contact information
- Book appointment button
- View lawyer's cases (if public)

### Book Appointment
- **Page**: `/client/book-appointment/:lawyerId`
- Select appointment date
- View available time slots
- Time slots:
  - 30-minute intervals
  - 9 AM to 5 PM default
  - Shows only available slots
  - Excludes already booked times
- Appointment details:
  - Date
  - Time
  - Duration (default 30 minutes)
  - Lawyer information
  - Consultation type (in-person/online)
  - Notes (optional)
- Confirm booking

### View Appointments
- **Page**: `/client/appointments`
- List all appointments:
  - Upcoming appointments
  - Past appointments
  - Filter by status
- Appointment information:
  - Lawyer name and photo
  - Date and time
  - Status badge
  - Related case (if any)
  - Location/type
- Actions:
  - View details
  - Reschedule
  - Cancel
  - View related case

### Appointment Statuses
- `scheduled`: Appointment is scheduled
- `confirmed`: Confirmed by lawyer
- `rescheduled`: Rescheduled to new time
- `completed`: Appointment completed
- `cancelled`: Cancelled
- `no_show`: Client didn't show up

## Lawyer Features

### Calendar View
- **Page**: `/lawyer/calendar`
- **View Modes**:
  - Month view: Calendar grid showing appointments
  - List view: Chronological list of appointments
- Shows:
  - Appointments
  - Case hearings (next_hearing_date)
  - Available time slots
- Filters:
  - By status
  - By date range
  - By case (if related)
- Navigation:
  - Previous/next month
  - Jump to today
  - Date picker

### Appointment Management
- View all appointments
- Filter by status
- Update appointment status:
  - Confirm
  - Mark as completed
  - Cancel
  - Mark as no-show
- Reschedule appointments
- View appointment details:
  - Client information
  - Date and time
  - Duration
  - Type (in-person/online)
  - Notes
  - Related case (if any)

### Availability Management
- Set working hours (future feature)
- View booked time slots
- Block time slots (future feature)

## Appointment API Functions

Located in `src/services/appointmentApi.js`:

### Client Functions
- `getClientAppointments(clientId)`: Get all client appointments
- `getAppointmentsByStatus(clientId, status)`: Filter by status
- `createAppointment(appointmentData)`: Book new appointment
- `updateAppointmentStatus(appointmentId, status)`: Update status
- `cancelAppointment(appointmentId)`: Cancel appointment
- `rescheduleAppointment(appointmentId, newDate, newTime)`: Reschedule

### Availability Functions
- `getLawyerAvailableSlots(lawyerId, date)`: Get available time slots

## Appointment Data Structure

### Appointment Object
```javascript
{
  id: number,
  client_id: number,
  lawyer_id: number,
  case_id: number | null,
  appointment_date: string (YYYY-MM-DD),
  appointment_time: string (HH:MM),
  duration_minutes: number,
  status: string,
  consultation_type: 'in_person' | 'online',
  notes: string | null,
  created_at: timestamp,
  updated_at: timestamp,
  lawyers: {
    lawyer_id: number,
    first_name: string,
    last_name: string,
    specialization: string,
    profile_image_url: string
  },
  cases: {
    case_id: number,
    case_number: string,
    title: string,
    case_type: string,
    status: string
  }
}
```

## Time Slot Availability

### How It Works
1. System generates time slots (9 AM - 5 PM, 30-minute intervals)
2. Checks existing appointments for the date
3. Excludes conflicting time slots
4. Returns available slots

### Conflict Detection
- Checks appointment start time and duration
- Prevents overlapping appointments
- Considers 30-minute buffer (configurable)

## Usage Examples

### Booking an Appointment
```javascript
import { createAppointment, getLawyerAvailableSlots } from '../services/appointmentApi';

// Get available slots
const slots = await getLawyerAvailableSlots(lawyerId, selectedDate);

// Create appointment
const appointment = await createAppointment({
  client_id: userProfile.user_id,
  lawyer_id: lawyerId,
  appointment_date: selectedDate,
  appointment_time: selectedTime,
  duration_minutes: 30,
  consultation_type: 'online',
  status: 'scheduled',
  notes: 'Initial consultation'
});
```

### Rescheduling
```javascript
import { rescheduleAppointment } from '../services/appointmentApi';

await rescheduleAppointment(
  appointmentId,
  newDate,
  newTime
);
```

### Cancelling
```javascript
import { cancelAppointment } from '../services/appointmentApi';

await cancelAppointment(appointmentId);
```

## Database Schema

### Appointments Table
- `id`: Primary key
- `client_id`: Foreign key to users
- `lawyer_id`: Foreign key to lawyers
- `case_id`: Foreign key to cases (nullable)
- `appointment_date`: Date
- `appointment_time`: Time (HH:MM)
- `duration_minutes`: Duration in minutes
- `status`: Appointment status
- `consultation_type`: 'in_person' or 'online'
- `notes`: Optional notes
- `created_at`, `updated_at`: Timestamps

## Dashboard Integration

### Client Dashboard
- Shows upcoming appointments count
- Displays next appointment preview
- Quick link to view all appointments

### Lawyer Dashboard
- Shows today's appointments count
- Displays today's appointments list
- Calendar preview widget
- Quick link to calendar page

## Related Files
- `src/pages/client/SearchLawyers.jsx`
- `src/pages/client/LawyerProfile.jsx`
- `src/pages/client/BookAppointment.jsx`
- `src/pages/client/Appointments.jsx`
- `src/pages/lawyer/Calendar/Calendar.jsx`
- `src/services/appointmentApi.js`
- `src/components/client/LawyerCard.jsx`
- `src/components/client/SearchFilters.jsx`





