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
            // Remove from deleted_conversations if it was previously deleted
            await supabase
                .from("deleted_conversations")
                .delete()
                .eq("conversation_id", existingConversation.conversation_id);
            
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

        // Get deleted conversations for this user
        const { data: deletedConvs } = await supabase
            .from("deleted_conversations")
            .select("conversation_id")
            .eq("deleted_by_user_id", userId)
            .eq("deleted_by_user_type", userType);

        const deletedIds = new Set(deletedConvs?.map(d => d.conversation_id) || []);

        // Filter out deleted conversations
        const activeConversations = conversations.filter(conv => !deletedIds.has(conv.conversation_id));

        // Get details for other participants
        const conversationsWithDetails = await Promise.all(
            activeConversations.map(async (conv) => {
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

        // Check if either user has blocked the other
        const { data: blockData, error: blockError } = await supabase
            .from("blocked_users")
            .select("*")
            .or(`and(blocker_id.eq.${sender_id},blocker_type.eq.${sender_type},blocked_id.eq.${receiver_id},blocked_type.eq.${receiver_type}),and(blocker_id.eq.${receiver_id},blocker_type.eq.${receiver_type},blocked_id.eq.${sender_id},blocked_type.eq.${sender_type})`);

        if (blockData && blockData.length > 0) {
            console.log('Message blocked due to blocking:', blockData);
            return res.status(403).json({ error: "Cannot send message. User is blocked." });
        }

        // Remove from deleted_conversations if conversation was previously deleted by sender
        await supabase
            .from("deleted_conversations")
            .delete()
            .eq("conversation_id", conversation_id)
            .eq("deleted_by_user_id", sender_id)
            .eq("deleted_by_user_type", sender_type);

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

// Block user
router.post("/block", async (req, res) => {
    try {
        const { blocker_id, blocker_type, blocked_id, blocked_type, reason } = req.body;

        // Validation
        if (!blocker_id || !blocker_type || !blocked_id || !blocked_type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Insert block record
        const { data, error } = await supabase
            .from("blocked_users")
            .insert({
                blocker_id,
                blocker_type,
                blocked_id,
                blocked_type,
                reason
            })
            .select()
            .single();

        if (error) {
            console.error("Error blocking user:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, block: data });
    } catch (error) {
        console.error("Error in block user:", error);
        res.status(500).json({ error: error.message });
    }
});

// Unblock user
router.post("/unblock", async (req, res) => {
    try {
        const { blocker_id, blocker_type, blocked_id, blocked_type } = req.body;

        // Validation
        if (!blocker_id || !blocker_type || !blocked_id || !blocked_type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Delete block record
        const { error } = await supabase
            .from("blocked_users")
            .delete()
            .eq("blocker_id", blocker_id)
            .eq("blocker_type", blocker_type)
            .eq("blocked_id", blocked_id)
            .eq("blocked_type", blocked_type);

        if (error) {
            console.error("Error unblocking user:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error in unblock user:", error);
        res.status(500).json({ error: error.message });
    }
});

// Check if user is blocked
router.get("/check-blocked/:userId/:userType/:otherUserId/:otherUserType", async (req, res) => {
    try {
        const { userId, userType, otherUserId, otherUserType } = req.params;

        console.log('Checking block status:', { userId, userType, otherUserId, otherUserType });

        // Check both directions
        const { data, error } = await supabase
            .from("blocked_users")
            .select("*")
            .or(`and(blocker_id.eq.${userId},blocker_type.eq.${userType},blocked_id.eq.${otherUserId},blocked_type.eq.${otherUserType}),and(blocker_id.eq.${otherUserId},blocker_type.eq.${otherUserType},blocked_id.eq.${userId},blocked_type.eq.${userType})`);

        if (error) {
            console.error("Error checking block status:", error);
            return res.status(500).json({ error: error.message });
        }

        console.log('Block data found:', data);

        const isBlocked = data && data.length > 0;
        const blockedByMe = data && data.find(b => b.blocker_id === parseInt(userId) && b.blocker_type === userType);
        const blockedByThem = data && data.find(b => b.blocker_id === parseInt(otherUserId) && b.blocker_type === otherUserType);

        const result = { 
            isBlocked,
            blockedByMe: !!blockedByMe,
            blockedByThem: !!blockedByThem
        };

        console.log('Block check result:', result);

        res.json(result);
    } catch (error) {
        console.error("Error in check blocked:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete conversation (soft delete)
router.post("/conversations/:conversationId/delete", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { user_id, user_type } = req.body;

        // Validation
        if (!user_id || !user_type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Insert delete record
        const { error } = await supabase
            .from("deleted_conversations")
            .insert({
                conversation_id: conversationId,
                deleted_by_user_id: user_id,
                deleted_by_user_type: user_type
            });

        if (error) {
            // If already deleted, update the timestamp
            if (error.code === '23505') { // Unique violation
                const { error: updateError } = await supabase
                    .from("deleted_conversations")
                    .update({ deleted_at: new Date().toISOString() })
                    .eq("conversation_id", conversationId)
                    .eq("deleted_by_user_id", user_id)
                    .eq("deleted_by_user_type", user_type);

                if (updateError) {
                    return res.status(500).json({ error: updateError.message });
                }
            } else {
                console.error("Error deleting conversation:", error);
                return res.status(500).json({ error: error.message });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error in delete conversation:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
