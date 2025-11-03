import { supabase } from '../supabaseClient';

// Note: RLS policies need to be disabled or modified since we're not using Supabase Auth
// Current workaround: Disable RLS on account_deletion_requests table

// Create a new deletion request
export const createDeletionRequest = async (userId, userType, reason) => {
  try {
    const requestData = {
      user_type: userType,
      reason: reason,
      status: 'pending'
    };

    // Add user_id for clients, lawyer_id for lawyers
    if (userType === 'client') {
      requestData.user_id = userId;
      requestData.lawyer_id = null;
    } else if (userType === 'lawyer') {
      requestData.lawyer_id = userId;
      requestData.user_id = null;
    }

    const { data, error } = await supabase
      .from('account_deletion_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating deletion request:', error);
    return { success: false, error: error.message, message: error.message };
  }
};

// Get user's deletion request status (works for both clients and lawyers)
export const getUserDeletionRequest = async (userId, userType = 'client') => {
  try {
    let query = supabase
      .from('account_deletion_requests')
      .select('*');

    // Filter by user_id for clients, lawyer_id for lawyers
    if (userType === 'client') {
      query = query.eq('user_id', userId);
    } else if (userType === 'lawyer') {
      query = query.eq('lawyer_id', userId);
    }

    const { data, error } = await query
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching deletion request:', error);
    return { success: false, error: error.message };
  }
};

// Get all pending deletion requests (for admin)
export const getPendingDeletionRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('account_deletion_requests')
      .select(`
        *,
        users:user_id (
          user_id,
          first_name,
          last_name,
          email,
          phone
        ),
        lawyers:lawyer_id (
          lawyer_id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching pending deletion requests:', error);
    return { success: false, error: error.message };
  }
};

// Update deletion request status (for admin)
export const updateDeletionRequestStatus = async (requestId, status, adminId, adminNotes) => {
  try {
    const { data, error } = await supabase
      .from('account_deletion_requests')
      .update({
        status: status,
        reviewed_by: adminId,
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString()
      })
      .eq('request_id', requestId)
      .select()
      .single();

    if (error) throw error;

    // If approved, delete the account (client or lawyer)
    if (status === 'approved') {
      if (data.user_id) {
        // Delete client account
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('user_id', data.user_id);

        if (deleteError) {
          console.error('Error deleting user account:', deleteError);
          return { success: false, error: 'Failed to delete user account' };
        }
      } else if (data.lawyer_id) {
        // Delete lawyer account
        const { error: deleteError } = await supabase
          .from('lawyers')
          .delete()
          .eq('lawyer_id', data.lawyer_id);

        if (deleteError) {
          console.error('Error deleting lawyer account:', deleteError);
          return { success: false, error: 'Failed to delete lawyer account' };
        }
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating deletion request:', error);
    return { success: false, error: error.message };
  }
};






