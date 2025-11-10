import { supabase } from '../supabaseClient';

/**
 * Generate a unique Jitsi meeting link
 * @param {string} type - 'appointment' or 'case'
 * @param {string|number} id - appointment_id or case_id
 * @returns {string} Jitsi meeting URL
 */
export const generateJitsiLink = (type, id) => {
  const timestamp = Date.now();
  const prefix = type === 'appointment' ? 'justiceconnect-appointment' : 'justiceconnect-case';
  const roomName = `${prefix}-${id}-${timestamp}`;
  // Remove special characters and make it URL-safe
  const safeRoomName = roomName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  return `https://meet.jit.si/${safeRoomName}`;
};

/**
 * Create a new meeting
 * @param {Object} meetingData - Meeting data
 * @returns {Promise<Object>} Created meeting
 */
export const createMeeting = async (meetingData) => {
  try {
    // Generate Jitsi link if not provided
    const meetingLink = meetingData.meeting_link || generateJitsiLink(
      meetingData.meeting_type,
      meetingData.meeting_type === 'appointment' 
        ? meetingData.related_appointment_id 
        : meetingData.related_case_id
    );

    const { data, error } = await supabase
      .from('meetings')
      .insert([{
        ...meetingData,
        meeting_link: meetingLink,
        meeting_provider: 'jitsi',
        meeting_status: meetingData.meeting_status || 'pending'
      }])
      .select(`
        *,
        appointment:related_appointment_id (
          id,
          appointment_date,
          appointment_time,
          status,
          client_id,
          lawyer_id,
          lawyers (
            lawyer_id,
            first_name,
            last_name,
            profile_image_url
          )
        ),
        case:related_case_id (
          case_id,
          title,
          case_number,
          status,
          client_id,
          assigned_lawyer_id
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
};

/**
 * Get meeting by appointment ID
 * @param {string} appointmentId - Appointment UUID
 * @returns {Promise<Object|null>} Meeting or null
 */
export const getMeetingByAppointment = async (appointmentId) => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        appointment:related_appointment_id (
          id,
          appointment_date,
          appointment_time,
          status,
          duration_minutes,
          lawyers (
            lawyer_id,
            first_name,
            last_name,
            profile_image_url
          )
        )
      `)
      .eq('related_appointment_id', appointmentId)
      .eq('meeting_type', 'appointment')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching meeting by appointment:', error);
    throw error;
  }
};

/**
 * Get meeting by case ID
 * @param {number} caseId - Case ID
 * @returns {Promise<Object|null>} Meeting or null
 */
export const getMeetingByCase = async (caseId) => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        case:related_case_id (
          case_id,
          title,
          case_number,
          status
        )
      `)
      .eq('related_case_id', caseId)
      .eq('meeting_type', 'case')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching meeting by case:', error);
    throw error;
  }
};

/**
 * Update meeting status
 * @param {string} meetingId - Meeting UUID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional fields to update
 * @returns {Promise<Object>} Updated meeting
 */
export const updateMeetingStatus = async (meetingId, status, additionalData = {}) => {
  try {
    const updateData = {
      meeting_status: status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    // Set started_at if status is confirmed
    if (status === 'confirmed' && !updateData.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    // Set ended_at if status is completed or cancelled
    if ((status === 'completed' || status === 'cancelled') && !updateData.ended_at) {
      updateData.ended_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('meeting_id', meetingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating meeting status:', error);
    throw error;
  }
};

/**
 * Delete a meeting
 * @param {string} meetingId - Meeting UUID
 * @returns {Promise<void>}
 */
export const deleteMeeting = async (meetingId) => {
  try {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('meeting_id', meetingId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
};

/**
 * Get all meetings for a user (client or lawyer)
 * @param {number} userId - User ID
 * @param {string} userType - 'client' or 'lawyer'
 * @returns {Promise<Array>} List of meetings
 */
export const getUserMeetings = async (userId, userType) => {
  try {
    // First, get appointment IDs and case IDs for the user
    let appointmentIds = [];
    let caseIds = [];

    if (userType === 'client') {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', userId);
      appointmentIds = appointments?.map(a => a.id) || [];

      const { data: cases } = await supabase
        .from('cases')
        .select('case_id')
        .eq('client_id', userId);
      caseIds = cases?.map(c => c.case_id) || [];
    } else if (userType === 'lawyer') {
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('lawyer_id', userId);
      appointmentIds = appointments?.map(a => a.id) || [];

      const { data: cases } = await supabase
        .from('cases')
        .select('case_id')
        .eq('assigned_lawyer_id', userId);
      caseIds = cases?.map(c => c.case_id) || [];
    }

    // Build query
    let query = supabase
      .from('meetings')
      .select(`
        *,
        appointment:related_appointment_id (
          id,
          appointment_date,
          appointment_time,
          status,
          lawyers (
            lawyer_id,
            first_name,
            last_name,
            profile_image_url
          )
        ),
        case:related_case_id (
          case_id,
          title,
          case_number,
          status
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by appointment or case IDs
    if (appointmentIds.length > 0 && caseIds.length > 0) {
      query = query.or(`related_appointment_id.in.(${appointmentIds.join(',')}),related_case_id.in.(${caseIds.join(',')})`);
    } else if (appointmentIds.length > 0) {
      query = query.in('related_appointment_id', appointmentIds);
    } else if (caseIds.length > 0) {
      query = query.in('related_case_id', caseIds);
    } else {
      return []; // No appointments or cases, return empty
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user meetings:', error);
    throw error;
  }
};

/**
 * Check if meeting time has arrived
 * @param {Object} meeting - Meeting object
 * @returns {boolean} True if meeting time has arrived
 */
export const isMeetingTimeReady = (meeting) => {
  if (!meeting.scheduled_date || !meeting.scheduled_time) {
    return true; // If no scheduled time, allow joining
  }

  const now = new Date();
  const meetingDateTime = new Date(`${meeting.scheduled_date}T${meeting.scheduled_time}`);
  
  // Allow joining 5 minutes before scheduled time
  const fiveMinutesBefore = new Date(meetingDateTime.getTime() - 5 * 60 * 1000);
  
  return now >= fiveMinutesBefore;
};

/**
 * Check if meeting has ended (after scheduled time + duration)
 * @param {Object} meeting - Meeting object
 * @param {Object} appointment - Appointment object (optional, for duration)
 * @returns {boolean} True if meeting has ended
 */
export const isMeetingEnded = (meeting, appointment = null) => {
  // If meeting is already completed or cancelled, it's ended
  if (meeting.meeting_status === 'completed' || meeting.meeting_status === 'cancelled') {
    return true;
  }

  if (!meeting.scheduled_date || !meeting.scheduled_time) {
    return false; // If no scheduled time, don't hide
  }

  // Get current time in local timezone
  const now = new Date();
  
  // Parse the meeting date and time properly with timezone consideration
  // Handle both formats: "HH:mm:ss" and "HH:mm"
  const timeParts = meeting.scheduled_time.split(':');
  const timeString = timeParts.length === 2 
    ? `${meeting.scheduled_time}:00` 
    : meeting.scheduled_time;
  
  // Create date string - treat as local time, not UTC
  // Using the Date constructor with date and time parts separately
  const [year, month, day] = meeting.scheduled_date.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timeString.split(':').map(Number);
  const meetingDateTime = new Date(year, month - 1, day, hours, minutes, seconds);
  
  // Validate the parsed date
  if (isNaN(meetingDateTime.getTime())) {
    console.error('Invalid meeting date/time:', { date: meeting.scheduled_date, time: meeting.scheduled_time });
    return false;
  }
  

// const duration = meeting.meeting_type === 'appointment' ? 30 : 60;


  // Default duration: 30 minutes for appointments, 60 minutes for cases
  // const defaultDuration = meeting.meeting_type === 'appointment' ? 30 : 60;
  // const duration = appointment?.duration_minutes || defaultDuration;
  
  const duration = meeting.meeting_type === 'appointment' ? 30 : 60;

  // Meeting ends after scheduled time + duration + 10 minutes buffer
  const totalMinutes = duration ;
  const meetingEndTime = new Date(meetingDateTime.getTime() + totalMinutes * 60 * 1000);
  

  const hasEnded = now > meetingEndTime;
  
  // Debug logging
  console.log('🔍 Meeting End Check:', {
    meetingId: meeting.meeting_id,
    meetingType: meeting.meeting_type,
    scheduledDate: meeting.scheduled_date,
    scheduledTime: meeting.scheduled_time,
    parsedDateTime: meetingDateTime.toLocaleString('ar-SA'),
    currentTime: now.toLocaleString('ar-SA'),
    duration: duration,
    buffer: 10,
    totalMinutes: totalMinutes,
    meetingEndTime: meetingEndTime.toLocaleString('ar-SA'),
    timeDiffMinutes: Math.round((now - meetingDateTime) / 60000),
    timeUntilEnd: Math.round((meetingEndTime - now) / 60000),
    hasEnded: hasEnded,
    shouldHide: hasEnded ? '✅ YES - Meeting should be hidden' : '❌ NO - Meeting still visible'
  });
  
  return hasEnded;
};

