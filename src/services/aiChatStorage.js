import { supabase } from '../supabaseClient';

// Create a new conversation (or return existing by id)
export async function createConversation({ clientUserId, title = 'محادثة جديدة', metadata = null }) {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert([{ client_user_id: String(clientUserId), title, metadata }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('createConversation error:', err);
    throw err;
  }
}

export async function addMessage(conversationId, { role, content, model = null, tokens = null }) {
  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .insert([{ conversation_id: conversationId, role, content, model, tokens }])
      .select()
      .single();

    if (error) throw error;
    // Update last_message_at on conversation
    await supabase
      .from('ai_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  } catch (err) {
    console.error('addMessage error:', err);
    // Don't block UI if storage fails
    return null;
  }
}

export async function getConversationMessages(conversationId) {
  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getConversationMessages error:', err);
    return [];
  }
}

export async function listConversations(clientUserId) {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('client_user_id', String(clientUserId))
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('listConversations error:', err);
    return [];
  }
}

export async function deleteConversation(conversationId) {
  try {
    if (!conversationId) return;
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteConversation error:', err);
    return false;
  }
}

// Update conversation title (e.g., first user question snippet)
export async function updateConversationTitle(conversationId, title) {
  try {
    if (!conversationId) return null;
    const safeTitle = title?.trim() ? title.trim().slice(0, 120) : 'محادثة';
    const { data, error } = await supabase
      .from('ai_conversations')
      .update({ title: safeTitle })
      .eq('id', conversationId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateConversationTitle error:', err);
    return null;
  }
}
