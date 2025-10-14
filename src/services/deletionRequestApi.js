import { supabase } from '../supabaseClient';

// Create a new deletion request
export const createDeletionRequest = async (userId, userType, reason) => {
  try {
    const { data, error } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: userId,
        user_type: userType,
        reason: reason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating deletion request:', error);
    return { success: false, error: error.message };
  }
};

// Get user's deletion request status
export const getUserDeletionRequest = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
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

    // If approved, delete the user account
    if (status === 'approved' && data.user_id) {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', data.user_id);

      if (deleteError) {
        console.error('Error deleting user account:', deleteError);
        return { success: false, error: 'Failed to delete user account' };
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating deletion request:', error);
    return { success: false, error: error.message };
  }
};






