import { supabase } from "../supabaseClient";

/* ------------------------------------------
   CREATE Conversation (client or lawyer)
------------------------------------------- */
export async function createConversation({
  clientUserId = null,
  lawyerUserId = null,
  title = "محادثة جديدة",
  metadata = null,
}) {
  try {
    if (!clientUserId && !lawyerUserId) {
      throw new Error("Must provide either clientUserId or lawyerUserId");
    }

    const insertData = {
      title: (title || "محادثة جديدة").slice(0, 120),
      metadata,
      client_user_id: clientUserId ? String(clientUserId) : null,
      lawyer_user_id: lawyerUserId ? String(lawyerUserId) : null,
      // last_message_at defaults in DB
    };

    const { data, error } = await supabase
      .from("ai_conversations")
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("createConversation error:", err);
    throw err;
  }
}

/* ------------------------------------------
   ADD MESSAGE
------------------------------------------- */
export async function addMessage(conversationId, { role, content, model = null, tokens = null }) {
  try {
    const { data, error } = await supabase
        .from("ai_messages")
        .insert([{ conversation_id: conversationId, role, content, model, tokens }])
        .select()
        .single();

    if (!error) {
      // update last_message_at
      await supabase
          .from("ai_conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);
    }

    return data;
  } catch (err) {
    console.error("addMessage error:", err);
    return null;
  }
}

/* ------------------------------------------
   GET messages for a conversation
------------------------------------------- */
export async function getConversationMessages(conversationId) {
  try {
    const { data, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("getConversationMessages error:", err);
    return [];
  }
}

/* ------------------------------------------
   LIST conversations (DISTINGUISH client vs lawyer)
------------------------------------------- */
export async function listConversations(userId, type = "client") {
  try {
    const column = type === "lawyer" ? "lawyer_user_id" : "client_user_id";
    if (!userId) return [];

    const { data, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq(column, String(userId))
      .order("last_message_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("listConversations error:", err);
    return [];
  }
}

/* ------------------------------------------
   UPDATE conversation title
------------------------------------------- */
export async function updateConversationTitle(conversationId, newTitle) {
  try {
    if (!conversationId) throw new Error("Missing conversation ID");
    const safeTitle = (newTitle || "محادثة").trim().slice(0, 120);
    const { data, error } = await supabase
      .from("ai_conversations")
      .update({ title: safeTitle })
      .eq("id", conversationId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("updateConversationTitle error:", err);
    return null;
  }
}

/* ------------------------------------------
   DELETE conversation (and messages via FK cascade)
------------------------------------------- */
export async function deleteConversation(conversationId) {
  try {
    if (!conversationId) throw new Error("Missing conversation ID");

    const { error } = await supabase
        .from("ai_conversations")
        .delete()
        .eq("id", conversationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("deleteConversation error:", err);
    return false;
  }
}
