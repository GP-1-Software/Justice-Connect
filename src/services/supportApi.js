import { supabase } from '../supabaseClient';

export const getSupportTickets = async (userType, userId) => {
  let query = supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (userType === 'client') {
    query = query.eq('user_id', userId);
  } else if (userType === 'lawyer') {
    query = query.eq('lawyer_id', userId);
  }
  // If admin, no filter needed (or specific admin logic)

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createSupportTicket = async (ticketData) => {
  const { error } = await supabase
    .from('support_tickets')
    .insert([ticketData]);

  if (error) throw error;
  return { success: true };
};

export const updateTicketStatus = async (ticketId, status, adminResponse) => {
  const { error } = await supabase
    .from('support_tickets')
    .update({
      status,
      admin_response: adminResponse,
      updated_at: new Date()
    })
    .eq('ticket_id', ticketId);

  if (error) throw error;
  return { success: true };
};

export const getAllTicketsForAdmin = async () => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
        *,
        users (first_name, last_name, email, phone),
        lawyers (first_name, last_name, email, phone)
      `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const addReplyToTicket = async (ticketId, senderType, senderId, senderName, message) => {
  // First, get the current ticket to retrieve existing replies and submitter info
  const { data: ticket, error: fetchError } = await supabase
    .from('support_tickets')
    .select('replies, user_id, lawyer_id, submitter_type, subject')
    .eq('ticket_id', ticketId)
    .single();

  if (fetchError) throw fetchError;

  // Create new reply object
  const newReply = {
    sender_type: senderType,
    sender_id: senderId,
    sender_name: senderName,
    message: message,
    created_at: new Date().toISOString()
  };

  // Append new reply to existing replies
  const updatedReplies = [...(ticket.replies || []), newReply];

  // Update the ticket with new replies
  const { error: updateError } = await supabase
    .from('support_tickets')
    .update({
      replies: updatedReplies,
      updated_at: new Date()
    })
    .eq('ticket_id', ticketId);

  if (updateError) throw updateError;

  // Create notification if sender is admin
  if (senderType === 'admin') {
    const recipientId = ticket.submitter_type === 'client' ? ticket.user_id : ticket.lawyer_id;
    const recipientType = ticket.submitter_type;

    await supabase.from('notifications').insert([{
      user_id: recipientId,
      user_type: recipientType,
      title: 'رد جديد على تذكرة الدعم الفني',
      message: `تلقيت رداً جديداً من ${senderName} على تذكرة: ${ticket.subject}`,
      type: 'support_reply',
      related_id: ticketId,
      related_type: 'support_ticket',
      is_read: false
    }]);
  }

  return { success: true };
};
