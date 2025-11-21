import { supabase } from '../supabaseClient';

/**
 * Get all appointments with client and lawyer details
 */
export const getAllAppointments = async () => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users!appointments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city,
          id_number
        ),
        lawyer:lawyers!appointments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          city,
          specialization
        ),
        case:cases(
          case_id,
          title,
          case_number,
          case_type
        )
      `)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

/**
 * Get appointments statistics
 */
export const getAppointmentsStatistics = async () => {
  try {
    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get counts by status
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'];
    const statusCounts = {};

    for (const status of statuses) {
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (error) throw error;
      statusCounts[status] = count || 0;
    }

    // Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount, error: todayError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today);

    if (todayError) throw todayError;

    // Get upcoming appointments (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const { count: upcomingCount, error: upcomingError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', today)
      .lte('appointment_date', nextWeek.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed']);

    if (upcomingError) throw upcomingError;

    return {
      totalAppointments: totalCount || 0,
      statusCounts,
      todayAppointments: todayCount || 0,
      upcomingAppointments: upcomingCount || 0
    };
  } catch (error) {
    console.error('Error fetching appointments statistics:', error);
    throw error;
  }
};

/**
 * Get appointments by status
 */
export const getAppointmentsByStatus = async (status) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users!appointments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          id_number
        ),
        lawyer:lawyers!appointments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .eq('status', status)
      .order('appointment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching appointments by status:', error);
    throw error;
  }
};

/**
 * Get appointment by ID with full details
 */
export const getAppointmentById = async (appointmentId) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users!appointments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city,
          id_number
        ),
        lawyer:lawyers!appointments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          city,
          specialization,
          license_number
        ),
        case:cases(
          case_id,
          title,
          case_number,
          case_type,
          status,
          description
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    throw error;
  }
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (appointmentId, newStatus, rejectionReason = null) => {
  try {
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};

/**
 * Search appointments
 */
export const searchAppointments = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users!appointments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          id_number
        ),
        lawyer:lawyers!appointments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .or(`appointment_number.ilike.%${searchTerm}%`)
      .order('appointment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching appointments:', error);
    throw error;
  }
};

/**
 * Get appointments by date range
 */
export const getAppointmentsByDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users!appointments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          id_number
        ),
        lawyer:lawyers!appointments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching appointments by date range:', error);
    throw error;
  }
};

/**
 * Get today's appointments
 */
export const getTodayAppointments = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users!appointments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone
        ),
        lawyer:lawyers!appointments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .eq('appointment_date', today)
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching today appointments:', error);
    throw error;
  }
};

/**
 * Get upcoming appointments (next 7 days)
 */
export const getUpcomingAppointments = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users!appointments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone
        ),
        lawyer:lawyers!appointments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .gte('appointment_date', today)
      .lte('appointment_date', nextWeek.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed'])
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    throw error;
  }
};

/**
 * Get appointments by lawyer
 */
export const getAppointmentsByLawyer = async (lawyerId) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users!appointments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone
        ),
        lawyer:lawyers!appointments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .eq('lawyer_id', lawyerId)
      .order('appointment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching appointments by lawyer:', error);
    throw error;
  }
};

/**
 * Get appointments by client
 */
export const getAppointmentsByClient = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users!appointments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone
        ),
        lawyer:lawyers!appointments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .eq('client_id', clientId)
      .order('appointment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching appointments by client:', error);
    throw error;
  }
};

/**
 * Get appointments by type
 */
export const getAppointmentsByType = async (appointmentType) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users!appointments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone
        ),
        lawyer:lawyers!appointments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .eq('appointment_type', appointmentType)
      .order('appointment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching appointments by type:', error);
    throw error;
  }
};
