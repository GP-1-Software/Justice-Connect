import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = "http://localhost:5000/api/messages";

// Typing indicators management
const typingTimeouts = {};

// Broadcast typing status
export const broadcastTyping = async (conversationId, userId, userType, isTyping) => {
    try {
        const channel = supabase.channel(`typing:${conversationId}`);
        await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId, userType, isTyping }
        });
    } catch (error) {
        console.error('Error broadcasting typing:', error);
    }
};

// Subscribe to typing status
export const subscribeToTyping = (conversationId, callback) => {
    const channel = supabase.channel(`typing:${conversationId}`);
    
    channel
        .on('broadcast', { event: 'typing' }, (payload) => {
            callback(payload.payload);
        })
        .subscribe();
    
    return channel;
};

// Get or create conversation
export const getOrCreateConversation = async (participant1_id, participant1_type, participant2_id, participant2_type) => {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations/get-or-create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                participant1_id,
                participant1_type,
                participant2_id,
                participant2_type
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to get or create conversation");
        }

        const data = await response.json();
        return data.conversation;
    } catch (error) {
        console.error("Error in getOrCreateConversation:", error);
        throw error;
    }
};

// Get all conversations for a user
export const getUserConversations = async (userId, userType) => {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations/${userId}/${userType}`);

        if (!response.ok) {
            throw new Error("Failed to fetch conversations");
        }

        const data = await response.json();
        return data.conversations;
    } catch (error) {
        console.error("Error in getUserConversations:", error);
        throw error;
    }
};

// Send a message
export const sendMessage = async (conversationId, senderId, senderType, receiverId, receiverType, content) => {
    try {
        const response = await fetch(`${API_BASE_URL}/messages/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                conversation_id: conversationId,
                sender_id: senderId,
                sender_type: senderType,
                receiver_id: receiverId,
                receiver_type: receiverType,
                content
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to send message");
        }

        const data = await response.json();
        return data.message;
    } catch (error) {
        console.error("Error in sendMessage:", error);
        throw error;
    }
};

// Get messages for a conversation
export const getConversationMessages = async (conversationId, limit = 50, offset = 0) => {
    try {
        const response = await fetch(`${API_BASE_URL}/messages/${conversationId}?limit=${limit}&offset=${offset}`);

        if (!response.ok) {
            throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        return data.messages;
    } catch (error) {
        console.error("Error in getConversationMessages:", error);
        throw error;
    }
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId, userId, userType) => {
    try {
        const response = await fetch(`${API_BASE_URL}/messages/mark-read`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                conversation_id: conversationId,
                user_id: userId,
                user_type: userType
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to mark messages as read");
        }

        const data = await response.json();
        return data.updated_count;
    } catch (error) {
        console.error("Error in markMessagesAsRead:", error);
        throw error;
    }
};

// Search for users
export const searchUsers = async (searchTerm, searcherType) => {
    try {
        const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(searchTerm)}/${searcherType}`);

        if (!response.ok) {
            throw new Error("Failed to search users");
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Error in searchUsers:", error);
        throw error;
    }
};

// Delete a message
export const deleteMessage = async (messageId, userId, userType) => {
    try {
        const response = await fetch(`${API_BASE_URL}/messages/${messageId}/${userId}/${userType}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Failed to delete message");
        }

        return true;
    } catch (error) {
        console.error("Error in deleteMessage:", error);
        throw error;
    }
};

// Subscribe to new messages in a conversation (Realtime)
export const subscribeToMessages = (conversationId, callback) => {
    const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return channel;
};

// Subscribe to message updates (read status)
export const subscribeToMessageUpdates = (conversationId, callback) => {
    const channel = supabase
        .channel(`message-updates:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return channel;
};

// Subscribe to conversation updates
export const subscribeToConversations = (userId, userType, callback) => {
    const channel = supabase
        .channel(`conversations:${userId}:${userType}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'conversations'
            },
            (payload) => {
                // Check if user is a participant
                const conv = payload.new || payload.old;
                if (
                    (conv.participant1_id === parseInt(userId) && conv.participant1_type === userType) ||
                    (conv.participant2_id === parseInt(userId) && conv.participant2_type === userType)
                ) {
                    callback(payload);
                }
            }
        )
        .subscribe();

    return channel;
};

// Unsubscribe from a channel
export const unsubscribeFromChannel = async (channel) => {
    if (channel) {
        await supabase.removeChannel(channel);
    }
};
