import { supabase } from '../supabaseClient';

/**
 * Get all cases with client and lawyer details
 */
export const getAllCases = async () => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:users!cases_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city
        ),
        lawyer:lawyers!cases_assigned_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all cases:', error);
    throw error;
  }
};

/**
 * Get cases statistics
 */
export const getCasesStatistics = async () => {
  try {
    // Get total cases
    const { count: totalCases, error: totalError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get cases by status
    const { data: statusData, error: statusError } = await supabase
      .from('cases')
      .select('status');

    if (statusError) throw statusError;

    // Count by status
    const statusCounts = {
      pending: 0,
      active: 0,
      in_progress: 0,
      completed: 0,
      closed: 0,
      rejected: 0
    };

    statusData?.forEach(item => {
      if (statusCounts.hasOwnProperty(item.status)) {
        statusCounts[item.status]++;
      }
    });

    // Get cases by priority
    const { data: priorityData, error: priorityError } = await supabase
      .from('cases')
      .select('priority');

    if (priorityError) throw priorityError;

    const priorityCounts = {
      high: 0,
      medium: 0,
      low: 0
    };

    priorityData?.forEach(item => {
      if (item.priority && priorityCounts.hasOwnProperty(item.priority)) {
        priorityCounts[item.priority]++;
      }
    });

    return {
      totalCases: totalCases || 0,
      statusCounts,
      priorityCounts
    };
  } catch (error) {
    console.error('Error fetching cases statistics:', error);
    throw error;
  }
};

/**
 * Get cases by status
 */
export const getCasesByStatus = async (status) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:users!cases_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city
        ),
        lawyer:lawyers!cases_assigned_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching cases with status ${status}:`, error);
    throw error;
  }
};

/**
 * Get case by ID with full details
 */
export const getCaseById = async (caseId) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:users!cases_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city,
          id_number
        ),
        lawyer:lawyers!cases_assigned_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization,
          license_number
        ),
        case_files(
          file_id,
          file_name,
          file_url,
          file_type,
          file_size,
          uploaded_by,
          uploader_type,
          created_at
        ),
        case_notes(
          note_id,
          content,
          created_at,
          created_by_type,
          created_by_id,
          is_shared
        ),
        appointments(
          id,
          appointment_date,
          appointment_time,
          status,
          meeting_method
        )
      `)
      .eq('case_id', caseId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching case ${caseId}:`, error);
    throw error;
  }
};

/**
 * Update case status
 */
export const updateCaseStatus = async (caseId, newStatus) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('case_id', caseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating case ${caseId} status:`, error);
    throw error;
  }
};

/**
 * Search cases by title or case number
 */
export const searchCases = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:users!cases_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city
        ),
        lawyer:lawyers!cases_assigned_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .or(`title.ilike.%${searchTerm}%,case_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching cases:', error);
    throw error;
  }
};

/**
 * Get cases by priority
 */
export const getCasesByPriority = async (priority) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:users!cases_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city
        ),
        lawyer:lawyers!cases_assigned_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .eq('priority', priority)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching cases with priority ${priority}:`, error);
    throw error;
  }
};

/**
 * Get recent cases (last 30 days)
 */
export const getRecentCases = async (days = 30) => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:users!cases_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email
        ),
        lawyer:lawyers!cases_assigned_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email
        )
      `)
      .gte('created_at', dateFrom.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent cases:', error);
    throw error;
  }
};

/**
 * Get cases by type
 */
export const getCasesByType = async (caseType) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:users!cases_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city
        ),
        lawyer:lawyers!cases_assigned_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        )
      `)
      .eq('case_type', caseType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching cases with type ${caseType}:`, error);
    throw error;
  }
};
