import { supabase } from '../supabaseClient';
import { createMeeting } from './meetingApi';

/**
 * Generate unique appointment number
 * @returns {Promise<string>} Appointment number (e.g., APT-2025-00001)
 */
const generateAppointmentNumber = async () => {
  const year = new Date().getFullYear();
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;

  const aptNum = (count || 0) + 1;
  return `APT-${year}-${String(aptNum).padStart(5, '0')}`;
};

// Get all appointments for a client with related case info
export const getClientAppointments = async (clientId) => {
  try {
    console.log('=== DEBUG: getClientAppointments ===');
    console.log('Searching for client_id:', clientId);
    console.log('Parsed client_id:', parseInt(clientId));

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        lawyers (
          lawyer_id,
          first_name,
          last_name,
          specialization,
          profile_image_url,
          years_of_experience
        ),
        cases (
          case_id,
          case_number,
          title,
          case_type,
          status
        )
      `)
      .eq('client_id', parseInt(clientId))
      .order('appointment_date', { ascending: false });

    console.log('Query result - data:', data);
    console.log('Query result - error:', error);
    console.log('Number of appointments found:', data?.length || 0);

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getClientAppointments:', error);
    throw error;
  }
};

// Get appointments by status
export const getAppointmentsByStatus = async (clientId, status) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        lawyers (
          lawyer_id,
          first_name,
          last_name,
          specialization,
          profile_image_url
        )
      `)
      .eq('client_id', parseInt(clientId))
      .eq('status', status)
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error fetching appointments by status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getAppointmentsByStatus:', error);
    throw error;
  }
};

// Create a new appointment
export const createAppointment = async (appointmentData) => {
  try {
    // Generate appointment number
    const appointmentNumber = await generateAppointmentNumber();

    // Ensure client_id and lawyer_id are integers
    const dataToInsert = {
      ...appointmentData,
      client_id: parseInt(appointmentData.client_id),
      lawyer_id: parseInt(appointmentData.lawyer_id),
      appointment_number: appointmentNumber
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert([dataToInsert])
      .select(`
        *,
        lawyers (
          lawyer_id,
          first_name,
          last_name,
          specialization,
          profile_image_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }

    // Send notifications to both parties
    try {
      const notifications = [];

      // Notification for client
      notifications.push(
        fetch('http://localhost:5000/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: appointmentData.client_id,
            userType: 'client',
            type: 'APPOINTMENT_CREATED',
            title: 'موعد جديد',
            message: `تم حجز موعد من طرفك، بانتظار التأكيد من قبل المحامي`,
            priority: 'high',
            relatedId: data.id,
            relatedType: 'appointment',
            actionUrl: `/client/appointments/${data.id}`
          })
        })
      );

      // Notification for lawyer
      notifications.push(
        fetch('http://localhost:5000/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: appointmentData.lawyer_id,
            userType: 'lawyer',
            type: 'APPOINTMENT_REQUEST',
            title: 'موعد جديد',
            message: `موعد جديد بانتظار التأكيد أو الرفض`,
            priority: 'high',
            relatedId: data.id,
            relatedType: 'appointment',
            actionUrl: `/lawyer/appointments/${data.id}`
          })
        })
      );

      await Promise.all(notifications);
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
    }

    return data;
  } catch (error) {
    console.error('Error in createAppointment:', error);
    throw error;
  }
};

// Update appointment status
export const updateAppointmentStatus = async (appointmentId, status, userRole = null, userId = null) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
      .select(`
        *,
        lawyers (
          lawyer_id,
          first_name,
          last_name,
          specialization,
          profile_image_url
        )
      `)
      .single();

    if (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }

    // Send notifications based on status change
    try {
      const notifications = [];

      if (status === 'confirmed') {
        // Notify both parties about confirmation
        notifications.push(
          fetch('http://localhost:5000/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.client_id,
              userType: 'client',
              type: 'APPOINTMENT_CONFIRMED',
              title: 'تم تأكيد الموعد',
              message: `تم تأكيد موعدك بتاريخ ${data.appointment_date}`,
              priority: 'high',
              relatedId: appointmentId,
              relatedType: 'appointment',
              actionUrl: `/client/appointments/${appointmentId}`
            })
          })
        );

        notifications.push(
          fetch('http://localhost:5000/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.lawyer_id,
              userType: 'lawyer',
              type: 'APPOINTMENT_CONFIRMED',
              title: 'تم تأكيد الموعد',
              message: `تم تأكيد الموعد مع العميل بتاريخ ${data.appointment_date}`,
              priority: 'normal',
              relatedId: appointmentId,
              relatedType: 'appointment',
              actionUrl: `/lawyer/appointments/${appointmentId}`
            })
          })
        );

        // Schedule reminder notifications for video/call appointments
        if (data.meeting_method === 'video_call' || data.meeting_method === 'phone_call') {
          const appointmentDateTime = new Date(`${data.appointment_date}T${data.appointment_time}`);
          const fiveMinsBefore = new Date(appointmentDateTime.getTime() - 5 * 60000);

          // Schedule 5-minute reminder for both
          notifications.push(
            fetch('http://localhost:5000/api/notifications/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.client_id,
                userType: 'client',
                title: 'تذكير بالموعد',
                message: `سيبدأ موعدك خلال 5 دقائق`,
                type: 'APPOINTMENT_REMINDER',
                relatedId: appointmentId,
                relatedType: 'appointment',
                priority: 'urgent',
                actionUrl: `/client/appointments/${appointmentId}`,
                scheduledFor: fiveMinsBefore.toISOString()
              })
            })
          );

          notifications.push(
            fetch('http://localhost:5000/api/notifications/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.lawyer_id,
                userType: 'lawyer',
                title: 'تذكير بالموعد',
                message: `سيبدأ الموعد خلال 5 دقائق`,
                type: 'APPOINTMENT_REMINDER',
                relatedId: appointmentId,
                relatedType: 'appointment',
                priority: 'urgent',
                actionUrl: `/lawyer/appointments/${appointmentId}`,
                scheduledFor: fiveMinsBefore.toISOString()
              })
            })
          );
        }
      } else if (status === 'cancelled') {
        // Notify both parties about cancellation
        notifications.push(
          fetch('http://localhost:5000/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.client_id,
              userType: 'client',
              type: 'APPOINTMENT_CANCELLED',
              title: 'تم إلغاء الموعد',
              message: `تم إلغاء الموعد المحدد بتاريخ ${data.appointment_date}`,
              priority: 'high',
              relatedId: appointmentId,
              relatedType: 'appointment',
              actionUrl: `/client/appointments/${appointmentId}`
            })
          })
        );

        notifications.push(
          fetch('http://localhost:5000/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.lawyer_id,
              userType: 'lawyer',
              type: 'APPOINTMENT_CANCELLED',
              title: 'تم إلغاء الموعد',
              message: `تم إلغاء الموعد المحدد بتاريخ ${data.appointment_date}`,
              priority: 'normal',
              relatedId: appointmentId,
              relatedType: 'appointment',
              actionUrl: `/lawyer/appointments/${appointmentId}`
            })
          })
        );
      }

      await Promise.all(notifications);
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
    }

    // If appointment is confirmed and meeting_method is video_call, create meeting automatically
    if (status === 'confirmed' && data.meeting_method === 'video_call') {
      try {
        // Check if meeting already exists
        const { data: existingMeeting } = await supabase
          .from('meetings')
          .select('meeting_id')
          .eq('related_appointment_id', appointmentId)
          .eq('meeting_type', 'appointment')
          .maybeSingle();

        if (!existingMeeting) {
          // Create meeting automatically
          await createMeeting({
            meeting_type: 'appointment',
            related_appointment_id: appointmentId,
            scheduled_date: data.appointment_date,
            scheduled_time: data.appointment_time,
            created_by_role: userRole || 'lawyer',
            created_by_id: userId || data.lawyer_id,
            meeting_status: 'confirmed'
          });
        }
      } catch (meetingError) {
        console.error('Error creating meeting for appointment:', meetingError);
        // Don't throw - appointment is still confirmed even if meeting creation fails
      }
    }

    return data;
  } catch (error) {
    console.error('Error in updateAppointmentStatus:', error);
    throw error;
  }
};

// Cancel an appointment
export const cancelAppointment = async (appointmentId) => {
  return updateAppointmentStatus(appointmentId, 'cancelled');
};

// Reschedule an appointment
export const rescheduleAppointment = async (appointmentId, newDate, newTime) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        appointment_date: newDate,
        appointment_time: newTime,
        status: 'rescheduled',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        *,
        lawyers (
          lawyer_id,
          first_name,
          last_name,
          specialization,
          profile_image_url
        )
      `)
      .single();

    if (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in rescheduleAppointment:', error);
    throw error;
  }
};

// Get lawyer's available time slots for a specific date
export const getLawyerAvailableSlots = async (lawyerId, date) => {
  try {
    // Get existing appointments for the date
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('appointment_time, duration_minutes')
      .eq('lawyer_id', parseInt(lawyerId))
      .eq('appointment_date', date)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error('Error fetching existing appointments:', error);
      throw error;
    }

    // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const availableSlots = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Check if this slot is available
        const isAvailable = !existingAppointments.some(apt => {
          const aptTime = apt.appointment_time;
          const aptDuration = apt.duration_minutes || 30;

          // Check if the new slot conflicts with existing appointment
          const newSlotStart = hour * 60 + minute;
          const newSlotEnd = newSlotStart + 30;
          const aptStart = parseInt(aptTime.split(':')[0]) * 60 + parseInt(aptTime.split(':')[1]);
          const aptEnd = aptStart + aptDuration;

          return (newSlotStart < aptEnd && newSlotEnd > aptStart);
        });

        if (isAvailable) {
          availableSlots.push({
            time: timeString,
            available: true
          });
        }
      }
    }

    return availableSlots;
  } catch (error) {
    console.error('Error in getLawyerAvailableSlots:', error);
    throw error;
  }
};
