import { useEffect, useRef, useState } from 'react';
import {
    broadcastTyping,
    getConversationMessages,
    getUserConversations,
    markMessagesAsRead,
    sendMessage,
    subscribeToConversations,
    subscribeToMessages,
    subscribeToMessageUpdates,
    subscribeToTyping,
    unsubscribeFromChannel
} from '../services/messageService';

export const useMessages = (userId, userType) => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

    const messageChannel = useRef(null);
    const updateChannel = useRef(null);
    const conversationChannel = useRef(null);
    const typingChannel = useRef(null);
    const typingTimeout = useRef(null);

    // Load conversations
    const loadConversations = async () => {
        try {
            setLoading(true);
            const data = await getUserConversations(userId, userType);
            console.log('Loaded conversations, count:', data.length);
            setConversations(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error loading conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load messages for a conversation
    const loadMessages = async (conversationId) => {
        try {
            setLoading(true);
            const data = await getConversationMessages(conversationId);

            // Filter out messages deleted by current user
            const userKey = `${userId}_${userType}`;
            const filteredMessages = data.filter(msg => {
                const deletedFor = msg.deleted_for || [];
                return !deletedFor.includes(userKey);
            });

            console.log(`Filtered messages: ${data.length} -> ${filteredMessages.length}`);
            setMessages(filteredMessages);
            setError(null);

            // Mark messages as read
            await markMessagesAsRead(conversationId, userId, userType);
        } catch (err) {
            setError(err.message);
            console.error('Error loading messages:', err);
        } finally {
            setLoading(false);
        }
    };

    // Send a new message
    const handleSendMessage = async (content) => {
        if (!activeConversation) return;

        try {
            let conversation = conversations.find(c => c.conversation_id === activeConversation);
            if (!conversation) return;

            const isParticipant1 =
                conversation.participant1_id === parseInt(userId) &&
                conversation.participant1_type === userType;

            const receiverId = isParticipant1 ? conversation.participant2_id : conversation.participant1_id;
            const receiverType = isParticipant1 ? conversation.participant2_type : conversation.participant1_type;

            const message = await sendMessage(
                conversation.conversation_id,
                userId,
                userType,
                receiverId,
                receiverType,
                content
            );

            // Add message immediately with is_read = false
            const newMessage = {
                ...message,
                is_read: false,
                message_id: message.message_id || Date.now(),
                created_at: message.created_at || new Date().toISOString()
            };

            // Play send sound
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (e) {
                console.log('Send sound error:', e);
            }

            setMessages(prev => {
                const exists = prev.some(m => m.message_id === newMessage.message_id);
                if (exists) return prev;
                return [...prev, newMessage];
            });

            // Update conversation's last_message_at in local state instead of reloading all
            setConversations(prev => prev.map(c =>
                c.conversation_id === conversation.conversation_id
                    ? { ...c, last_message_at: newMessage.created_at }
                    : c
            ));

            setError(null);
        } catch (err) {
            // Check if error is due to blocking
            if (err.message.includes('blocked') || err.message.includes('User is blocked')) {
                setError('لا يمكن إرسال الرسالة. أحد المستخدمين محظور.');
            } else {
                setError(err.message);
            }
            console.error('Error sending message:', err);
        }
    };

    // Set active conversation and load its messages
    const selectConversation = async (conversationId) => {
        console.log('Selecting conversation:', conversationId);

        // Check if this is a temporary conversation
        const conversation = conversations.find(c => c.conversation_id === conversationId);
        if (conversation && conversation.isTemp) {
            // For temp conversations, just set it active with empty messages
            setActiveConversation(conversationId);
            setMessages([]);
            return;
        }

        // Unsubscribe from previous conversation
        if (messageChannel.current) {
            await unsubscribeFromChannel(messageChannel.current);
            messageChannel.current = null;
        }
        if (updateChannel.current) {
            await unsubscribeFromChannel(updateChannel.current);
            updateChannel.current = null;
        }
        if (typingChannel.current) {
            await unsubscribeFromChannel(typingChannel.current);
            typingChannel.current = null;
        }

        setActiveConversation(conversationId);
        setIsOtherUserTyping(false);
        await loadMessages(conversationId);

        // Clear unread count for this conversation
        setConversations(prev =>
            prev.map(c =>
                c.conversation_id === conversationId
                    ? { ...c, unread_count: 0 }
                    : c
            )
        );

        // Subscribe to typing status
        typingChannel.current = subscribeToTyping(conversationId, (typingData) => {
            // Only show typing if it's from the other user
            if (typingData.userId !== parseInt(userId) || typingData.userType !== userType) {
                setIsOtherUserTyping(typingData.isTyping);
            }
        });

        // Subscribe to new messages
        messageChannel.current = subscribeToMessages(conversationId, (newMessage) => {
            console.log('New message received:', newMessage);

            // Don't filter real-time messages - they are new messages sent after opening the conversation
            // Old deleted messages are already filtered when loading the conversation

            // Play receive sound if message is from other user
            if (newMessage.sender_id !== parseInt(userId) || newMessage.sender_type !== userType) {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = 600;
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.15);
                } catch (e) {
                    console.log('Receive sound error:', e);
                }
            }

            // Check if message already exists
            setMessages(prev => {
                const exists = prev.some(m => m.message_id === newMessage.message_id);
                if (exists) return prev;
                return [...prev, newMessage];
            });

            // Mark as read if it's not from current user
            if (newMessage.receiver_id === parseInt(userId) && newMessage.receiver_type === userType) {
                markMessagesAsRead(conversationId, userId, userType);
            }

            // Reload conversations to update last message WITHOUT changing active conversation
            loadConversations();
        });

        // Subscribe to message updates (read status)
        updateChannel.current = subscribeToMessageUpdates(conversationId, (updatedMessage) => {
            console.log('Message updated (read status):', updatedMessage);

            // Update message in current conversation
            setMessages(prev =>
                prev.map(msg =>
                    msg.message_id === updatedMessage.message_id
                        ? { ...msg, is_read: true, read_at: updatedMessage.read_at }
                        : msg
                )
            );
        });
    };

    // Handle user typing
    const handleUserTyping = () => {
        if (!activeConversation) return;

        // Broadcast that user is typing
        broadcastTyping(activeConversation, userId, userType, true);

        // Clear previous timeout
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        // Set timeout to stop typing indicator after 2 seconds
        typingTimeout.current = setTimeout(() => {
            broadcastTyping(activeConversation, userId, userType, false);
        }, 2000);
    };

    // Initial load
    useEffect(() => {
        if (userId && userType) {
            loadConversations();

            // Subscribe to conversation updates
            conversationChannel.current = subscribeToConversations(userId, userType, () => {
                loadConversations();
            });
        }

        return () => {
            // Cleanup subscriptions
            if (messageChannel.current) {
                unsubscribeFromChannel(messageChannel.current);
            }
            if (updateChannel.current) {
                unsubscribeFromChannel(updateChannel.current);
            }
            if (conversationChannel.current) {
                unsubscribeFromChannel(conversationChannel.current);
            }
            if (typingChannel.current) {
                unsubscribeFromChannel(typingChannel.current);
            }
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
        };
    }, [userId, userType]);

    return {
        conversations,
        setConversations,
        activeConversation,
        setActiveConversation,
        messages,
        setMessages,
        loading,
        error,
        isOtherUserTyping,
        loadConversations,
        selectConversation,
        handleSendMessage,
        handleUserTyping
    };
};
