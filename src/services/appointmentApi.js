import { supabase } from '../supabaseClient';

// Get appointments for a specific client
export const getClientAppointments = async (clientId) => {
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
          profile_image,
          hourly_rate
        )
      `)
      .eq('client_id', parseInt(clientId))
      .order('appointment_date', { ascending: true });

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
          profile_image,
          hourly_rate
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
    // Ensure client_id and lawyer_id are integers
    const dataToInsert = {
      ...appointmentData,
      client_id: parseInt(appointmentData.client_id),
      lawyer_id: parseInt(appointmentData.lawyer_id)
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
          profile_image,
          hourly_rate
        )
      `)
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createAppointment:', error);
    throw error;
  }
};

// Update appointment status
export const updateAppointmentStatus = async (appointmentId, status) => {
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
          profile_image,
          hourly_rate
        )
      `)
      .single();

    if (error) {
      console.error('Error updating appointment status:', error);
      throw error;
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
          profile_image,
          hourly_rate
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
      .in('status', ['scheduled', 'confirmed']);

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
