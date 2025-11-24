import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get or create conversation between two users
router.post("/conversations/get-or-create", async (req, res) => {
    try {
        const { participant1_id, participant1_type, participant2_id, participant2_type } = req.body;

        // Validation
        if (!participant1_id || !participant1_type || !participant2_id || !participant2_type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!['client', 'lawyer'].includes(participant1_type) || !['client', 'lawyer'].includes(participant2_type)) {
            return res.status(400).json({ error: "Invalid participant type" });
        }

        // Check if conversation already exists (check both directions)
        const { data: existingConversation, error: fetchError } = await supabase
            .from("conversations")
            .select("*")
            .or(`and(participant1_id.eq.${participant1_id},participant1_type.eq.${participant1_type},participant2_id.eq.${participant2_id},participant2_type.eq.${participant2_type}),and(participant1_id.eq.${participant2_id},participant1_type.eq.${participant2_type},participant2_id.eq.${participant1_id},participant2_type.eq.${participant1_type})`)
            .single();

        if (existingConversation) {
            return res.json({ conversation: existingConversation });
        }

        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
            .from("conversations")
            .insert({
                participant1_id,
                participant1_type,
                participant2_id,
                participant2_type
            })
            .select()
            .single();

        if (createError) {
            console.error("Error creating conversation:", createError);
            return res.status(500).json({ error: createError.message });
        }

        res.json({ conversation: newConversation });
    } catch (error) {
        console.error("Error in get-or-create conversation:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get all conversations for a user
router.get("/conversations/:userId/:userType", async (req, res) => {
    try {
        const { userId, userType } = req.params;

        // Validation
        if (!['client', 'lawyer'].includes(userType)) {
            return res.status(400).json({ error: "Invalid user type" });
        }

        // Get conversations where user is either participant
        const { data: conversations, error } = await supabase
            .from("conversations")
            .select("*")
            .or(`and(participant1_id.eq.${userId},participant1_type.eq.${userType}),and(participant2_id.eq.${userId},participant2_type.eq.${userType})`)
            .order("last_message_at", { ascending: false });

        if (error) {
            console.error("Error fetching conversations:", error);
            return res.status(500).json({ error: error.message });
        }

        // Get details for other participants
        const conversationsWithDetails = await Promise.all(
            conversations.map(async (conv) => {
                const isParticipant1 = conv.participant1_id === parseInt(userId) && conv.participant1_type === userType;
                const otherParticipantId = isParticipant1 ? conv.participant2_id : conv.participant1_id;
                const otherParticipantType = isParticipant1 ? conv.participant2_type : conv.participant1_type;

                // Fetch other participant details
                const tableName = otherParticipantType === 'lawyer' ? 'lawyers' : 'users';
                const idColumn = otherParticipantType === 'lawyer' ? 'lawyer_id' : 'user_id';

                const { data: participant, error: participantError } = await supabase
                    .from(tableName)
                    .select("*")
                    .eq(idColumn, otherParticipantId)
                    .single();

                // Get last message
                const { data: lastMessage } = await supabase
                    .from("messages")
                    .select("*")
                    .eq("conversation_id", conv.conversation_id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                // Get unread count
                const { count: unreadCount } = await supabase
                    .from("messages")
                    .select("*", { count: 'exact', head: true })
                    .eq("conversation_id", conv.conversation_id)
                    .eq("receiver_id", userId)
                    .eq("receiver_type", userType)
                    .eq("is_read", false);

                return {
                    ...conv,
                    other_participant: participant,
                    other_participant_type: otherParticipantType,
                    last_message: lastMessage,
                    unread_count: unreadCount || 0
                };
            })
        );

        res.json({ conversations: conversationsWithDetails });
    } catch (error) {
        console.error("Error in get conversations:", error);
        res.status(500).json({ error: error.message });
    }
});

// Send a message
router.post("/messages/send", async (req, res) => {
    try {
        const { conversation_id, sender_id, sender_type, receiver_id, receiver_type, content } = req.body;

        // Validation
        if (!conversation_id || !sender_id || !sender_type || !receiver_id || !receiver_type || !content) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!['client', 'lawyer'].includes(sender_type) || !['client', 'lawyer'].includes(receiver_type)) {
            return res.status(400).json({ error: "Invalid participant type" });
        }

        // Verify conversation exists and sender is a participant
        const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .select("*")
            .eq("conversation_id", conversation_id)
            .single();

        if (convError || !conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Verify sender is part of the conversation
        const isSenderParticipant = 
            (conversation.participant1_id === parseInt(sender_id) && conversation.participant1_type === sender_type) ||
            (conversation.participant2_id === parseInt(sender_id) && conversation.participant2_type === sender_type);

        if (!isSenderParticipant) {
            return res.status(403).json({ error: "Sender is not a participant in this conversation" });
        }

        // Insert message
        const { data: message, error: messageError } = await supabase
            .from("messages")
            .insert({
                conversation_id,
                sender_id,
                sender_type,
                receiver_id,
                receiver_type,
                content
            })
            .select()
            .single();

        if (messageError) {
            console.error("Error sending message:", messageError);
            return res.status(500).json({ error: messageError.message });
        }

        // Update conversation last_message_at
        await supabase
            .from("conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("conversation_id", conversation_id);

        res.json({ message });
    } catch (error) {
        console.error("Error in send message:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get messages for a conversation
router.get("/messages/:conversationId", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const { data: messages, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false })
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (error) {
            console.error("Error fetching messages:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ messages: messages.reverse() }); // Reverse to show oldest first
    } catch (error) {
        console.error("Error in get messages:", error);
        res.status(500).json({ error: error.message });
    }
});

// Mark messages as read
router.put("/messages/mark-read", async (req, res) => {
    try {
        const { conversation_id, user_id, user_type } = req.body;

        // Validation
        if (!conversation_id || !user_id || !user_type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!['client', 'lawyer'].includes(user_type)) {
            return res.status(400).json({ error: "Invalid user type" });
        }

        const { data, error } = await supabase
            .from("messages")
            .update({ 
                is_read: true, 
                read_at: new Date().toISOString() 
            })
            .eq("conversation_id", conversation_id)
            .eq("receiver_id", user_id)
            .eq("receiver_type", user_type)
            .eq("is_read", false)
            .select();

        if (error) {
            console.error("Error marking messages as read:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ updated_count: data?.length || 0 });
    } catch (error) {
        console.error("Error in mark-read:", error);
        res.status(500).json({ error: error.message });
    }
});

// Search for users to start a conversation
router.get("/search/:searchTerm/:searcherType", async (req, res) => {
    try {
        const { searchTerm, searcherType } = req.params;

        console.log('Search request:', { searchTerm, searcherType });

        // Validation
        if (!['client', 'lawyer'].includes(searcherType)) {
            return res.status(400).json({ error: "Invalid searcher type" });
        }

        let results = [];

        // Search in lawyers - always allow searching lawyers
        const { data: lawyers, error: lawyersError } = await supabase
            .from("lawyers")
            .select("lawyer_id, first_name, last_name, email, city, specialization, profile_image_url, account_status")
            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            .eq("account_status", "approved")
            .limit(10);

        if (lawyersError) {
            console.error('Error searching lawyers:', lawyersError);
        }

        if (lawyers) {
            console.log(`Found ${lawyers.length} lawyers`);
            results = results.concat(
                lawyers.map(lawyer => ({
                    ...lawyer,
                    id: lawyer.lawyer_id,
                    role: 'lawyer',
                    full_name: `${lawyer.first_name} ${lawyer.last_name}`
                }))
            );
        }

        // Search in clients - always allow searching clients
        const { data: clients, error: clientsError } = await supabase
            .from("users")
            .select("user_id, first_name, last_name, email, city, profile_image_url, account_status")
            .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            .eq("account_status", "approved")
            .eq("user_type", "client")
            .limit(10);

        if (clientsError) {
            console.error('Error searching clients:', clientsError);
        }

        if (clients) {
            console.log(`Found ${clients.length} clients`);
            results = results.concat(
                clients.map(client => ({
                    ...client,
                    id: client.user_id,
                    role: 'client',
                    full_name: `${client.first_name} ${client.last_name}`
                }))
            );
        }

        console.log(`Total results: ${results.length}`);
        res.json({ results });
    } catch (error) {
        console.error("Error in search:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a message
router.delete("/messages/:messageId/:userId/:userType", async (req, res) => {
    try {
        const { messageId, userId, userType } = req.params;

        // Validation
        if (!['client', 'lawyer'].includes(userType)) {
            return res.status(400).json({ error: "Invalid user type" });
        }

        // Verify the message belongs to the user
        const { data: message, error: fetchError } = await supabase
            .from("messages")
            .select("*")
            .eq("message_id", messageId)
            .single();

        if (fetchError || !message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Check if user is the sender
        if (message.sender_id !== parseInt(userId) || message.sender_type !== userType) {
            return res.status(403).json({ error: "You can only delete your own messages" });
        }

        const { error: deleteError } = await supabase
            .from("messages")
            .delete()
            .eq("message_id", messageId);

        if (deleteError) {
            console.error("Error deleting message:", deleteError);
            return res.status(500).json({ error: deleteError.message });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error in delete message:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
