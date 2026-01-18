// src/services/systemAiApi.js

const API_BASE_URL = "https://justice-connect-mobile.onrender.com/api/system-ai";

/**
 * Get all conversations for an admin
 * @param {number} adminId - Admin ID
 * @returns {Promise<Array>} List of conversations
 */
export const getConversations = async (adminId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${adminId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch conversations");
    }
    
    return data.conversations;
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    throw error;
  }
};

/**
 * Create a new conversation
 * @param {number} adminId - Admin ID
 * @param {string} title - Conversation title
 * @returns {Promise<Object>} Created conversation
 */
export const createConversation = async (adminId, title = "محادثة جديدة") => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ adminId, title }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to create conversation");
    }
    
    return data.conversation;
  } catch (error) {
    console.error("❌ Error creating conversation:", error);
    throw error;
  }
};

/**
 * Update conversation title
 * @param {string} conversationId - Conversation ID
 * @param {string} title - New title
 * @returns {Promise<Object>} Updated conversation
 */
export const updateConversationTitle = async (conversationId, title) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to update conversation title");
    }

    return data.conversation;
  } catch (error) {
    console.error("❌ Error updating conversation title:", error);
    throw error;
  }
};

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Array>} List of messages
 */
export const getMessages = async (conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch messages");
    }
    
    return data.messages;
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    throw error;
  }
};

/**
 * Send a message to a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} message - Message text
 * @returns {Promise<Object>} Response with user message and AI message
 */
export const sendMessage = async (conversationId, message) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to send message");
    }
    
    return {
      userMessage: data.userMessage,
      aiMessage: data.aiMessage,
    };
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }
};

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<void>}
 */
export const deleteConversation = async (conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: "DELETE",
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to delete conversation");
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error deleting conversation:", error);
    throw error;
  }
};
