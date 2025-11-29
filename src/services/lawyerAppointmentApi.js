import { supabase } from '../supabaseClient';
import { createMeeting } from './meetingApi';
import { notifyAppointmentConfirmed, notifyAppointmentRejected } from './notificationService';

/**
 * Get all appointments for a lawyer with client info
 * @param {number} lawyerId - Lawyer ID
 * @returns {Promise<Array>} List of appointments
 */
export const getLawyerAppointments = async (lawyerId) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clients:users!appointments_client_id_fkey (
          user_id,
          user_type,
          first_name,
          last_name,
          email,
          phone,
          city,
          id_number,
          account_status,
          created_at,
          profile_image_url
        )
      `)
      .eq('lawyer_id', parseInt(lawyerId))
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (error) {
      console.error('Error fetching lawyer appointments:', error);
      throw error;
    }

    // Fetch cases separately if case_id exists
    const appointmentsWithCases = await Promise.all(
      (data || []).map(async (apt) => {
        if (apt.case_id) {
          try {
            const { data: caseData } = await supabase
              .from('cases')
              .select('case_id, case_number, title, case_type, status')
              .eq('case_id', apt.case_id)
              .single();
            return { ...apt, cases: caseData || null };
          } catch (caseError) {
            console.error('Error fetching case:', caseError);
            return { ...apt, cases: null };
          }
        }
        return { ...apt, cases: null };
      })
    );

    return appointmentsWithCases || [];
  } catch (error) {
    console.error('Error in getLawyerAppointments:', error);
    throw error;
  }
};

/**
 * Update appointment status (with automatic meeting creation for video calls)
 * @param {string} appointmentId - Appointment UUID
 * @param {string} status - New status
 * @param {number} lawyerId - Lawyer ID
 * @param {string} rejectionReason - Optional rejection reason
 * @returns {Promise<Object>} Updated appointment
 */
export const updateLawyerAppointmentStatus = async (appointmentId, status, lawyerId, rejectionReason = null) => {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select(`
        *,
        clients:users!appointments_client_id_fkey (
          user_id,
          user_type,
          first_name,
          last_name,
          email,
          phone,
          city,
          id_number,
          account_status,
          created_at,
          profile_image_url
        )
      `)
      .single();

    if (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }

    // Fetch case separately if case_id exists
    if (data?.case_id) {
      try {
        const { data: caseData } = await supabase
          .from('cases')
          .select('case_id, case_number, title, case_type, status')
          .eq('case_id', data.case_id)
          .single();
        data.cases = caseData || null;
      } catch (caseError) {
        console.error('Error fetching case:', caseError);
        data.cases = null;
      }
    } else {
      data.cases = null;
    }

    // Get lawyer name for notification
    const { data: lawyerData } = await supabase
      .from('lawyers')
      .select('first_name, last_name')
      .eq('lawyer_id', lawyerId)
      .single();

    const lawyerName = lawyerData
      ? `${lawyerData.first_name} ${lawyerData.last_name}`
      : 'المحامي';

    // Send notification to client based on status
    if (status === 'confirmed' && data.clients?.user_id) {
      try {
        await notifyAppointmentConfirmed(
          data.clients.user_id,
          data.appointment_date,
          data.appointment_time,
          lawyerName,
          appointmentId
        );
      } catch (notifError) {
        console.error('Error sending confirmation notification:', notifError);
        // Don't throw - appointment is still confirmed
      }
    } else if (status === 'cancelled' && data.clients?.user_id) {
      try {
        await notifyAppointmentRejected(
          data.clients.user_id,
          data.appointment_date,
          data.appointment_time,
          lawyerName,
          rejectionReason,
          appointmentId
        );
      } catch (notifError) {
        console.error('Error sending rejection notification:', notifError);
        // Don't throw - appointment is still cancelled
      }
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
            created_by_role: 'lawyer',
            created_by_id: lawyerId,
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
    console.error('Error in updateLawyerAppointmentStatus:', error);
    throw error;
  }
};

/**
 * Get appointment statistics for lawyer
 * @param {number} lawyerId - Lawyer ID
 * @returns {Promise<Object>} Statistics object
 */
export const getLawyerAppointmentStats = async (lawyerId) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('status, appointment_date')
      .eq('lawyer_id', parseInt(lawyerId));

    if (error) throw error;

    const today = new Date().toISOString().split('T')[0];
    const stats = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      today: 0
    };

    (data || []).forEach(apt => {
      if (apt.status) stats[apt.status] = (stats[apt.status] || 0) + 1;
      if (apt.appointment_date === today) stats.today += 1;
    });

    return stats;
  } catch (error) {
    console.error('Error in getLawyerAppointmentStats:', error);
    return { pending: 0, confirmed: 0, completed: 0, cancelled: 0, today: 0 };
  }
};

