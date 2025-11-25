import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMessages } from '../../hooks/useMessages';
import { searchUsers, getOrCreateConversation, blockUser, unblockUser, checkIfBlocked, deleteConversation } from '../../services/messageService';
import { useTranslation } from 'react-i18next';
import { Send, Search, User, MessageCircle, X, Phone, Video, MoreVertical } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const Messages = ({ userId, userType }) => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const {
        conversations,
        setConversations,
        activeConversation,
        setActiveConversation,
        messages,
        setMessages,
        loading,
        error,
        isOtherUserTyping,
        selectConversation,
        handleSendMessage,
        handleUserTyping,
        loadConversations
    } = useMessages(userId, userType);

    const [messageInput, setMessageInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockedByMe, setBlockedByMe] = useState(false);
    const messagesEndRef = useRef(null);

    // Get active conversation details
    const activeConvDetails = conversations.find(c => c.conversation_id === activeConversation);

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Check block status when conversation changes
    useEffect(() => {
        const checkBlockStatus = async () => {
            if (!activeConversation || !activeConvDetails) return;
            
            const otherUserId = activeConvDetails.other_participant?.id || 
                              (activeConvDetails.participant1_id === parseInt(userId) 
                                  ? activeConvDetails.participant2_id 
                                  : activeConvDetails.participant1_id);
            const otherUserType = activeConvDetails.other_participant_type;
            
            try {
                const result = await checkIfBlocked(userId, userType, otherUserId, otherUserType);
                console.log('Block status result:', result);
                // Block UI if either user has blocked the other
                setIsBlocked(result.isBlocked);
                setBlockedByMe(result.blockedByMe);
            } catch (error) {
                console.error('Error checking block status:', error);
            }
        };
        
        checkBlockStatus();
    }, [activeConversation, activeConvDetails, userId, userType]);

    // Real-time subscription for block status changes
    useEffect(() => {
        if (!userId || !userType) return;

        console.log('Setting up block status real-time subscription for user:', userId, userType);

        // Subscribe to ALL blocked_users changes involving this user
        const blockChannel = supabase
            .channel(`block-status-user-${userId}-${userType}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'blocked_users'
                },
                async (payload) => {
                    console.log('Block table changed:', payload);
                    
                    // Check if this change involves the current user
                    const record = payload.new || payload.old;
                    const involvesCurrentUser = 
                        (record.blocker_id == userId && record.blocker_type === userType) ||
                        (record.blocked_id == userId && record.blocked_type === userType);
                    
                    if (involvesCurrentUser && activeConversation && activeConvDetails) {
                        const otherUserId = activeConvDetails.other_participant?.id || 
                                          (activeConvDetails.participant1_id === parseInt(userId) 
                                              ? activeConvDetails.participant2_id 
                                              : activeConvDetails.participant1_id);
                        const otherUserType = activeConvDetails.other_participant_type;
                        
                        // Refresh block status for active conversation
                        try {
                            const result = await checkIfBlocked(userId, userType, otherUserId, otherUserType);
                            console.log('Updated block status:', result);
                            setIsBlocked(result.isBlocked);
                            setBlockedByMe(result.blockedByMe);
                        } catch (error) {
                            console.error('Error updating block status:', error);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            console.log('Cleaning up block status subscription');
            supabase.removeChannel(blockChannel);
        };
    }, [userId, userType, activeConversation, activeConvDetails]);

    // Check for conversation parameter in URL (only once when conversations load initially)
    useEffect(() => {
        const conversationId = searchParams.get('conversation');
        if (conversationId && conversations.length > 0 && !activeConversation) {
            console.log('Opening conversation from URL:', conversationId);
            selectConversation(conversationId);
        }
    }, [searchParams, conversations.length]);

    // Search users instantly as they type
    useEffect(() => {
        const searchInstantly = async () => {
            if (!searchTerm.trim()) {
                setSearchResults([]);
                return;
            }

            try {
                setSearchLoading(true);
                console.log('Searching for:', searchTerm, 'as', userType);
                const results = await searchUsers(searchTerm, userType);
                console.log('Search results:', results);
                console.log('Lawyers:', results.filter(r => r.role === 'lawyer').length);
                console.log('Clients:', results.filter(r => r.role === 'client').length);
                setSearchResults(results);
            } catch (err) {
                console.error('Error searching users:', err);
            } finally {
                setSearchLoading(false);
            }
        };

        // Debounce search - wait 300ms after user stops typing
        const delaySearch = setTimeout(() => {
            searchInstantly();
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [searchTerm, userType]);

    // Start new conversation
    const handleStartConversation = async (otherUser) => {
        try {
            console.log('Starting conversation with:', otherUser);
            
            // Create or get existing conversation (this will remove from deleted_conversations)
            const conversation = await getOrCreateConversation(
                userId,
                userType,
                otherUser.id,
                otherUser.role
            );
            
            console.log('Got conversation:', conversation);
            
            // Add to conversations list if not already there
            setConversations(prev => {
                const exists = prev.find(c => c.conversation_id === conversation.conversation_id);
                if (exists) {
                    return prev;
                }
                // Add new conversation with participant details
                return [{
                    ...conversation,
                    other_participant: otherUser,
                    other_participant_type: otherUser.role,
                    unread_count: 0
                }, ...prev];
            });
            
            // Close search
            setShowSearch(false);
            setSearchTerm('');
            setSearchResults([]);
            
            // Select the conversation
            setActiveConversation(conversation.conversation_id);
            setMessages([]);
        } catch (err) {
            console.error('Error starting conversation:', err);
        }
    };

    // Handle block/unblock
    const handleToggleBlock = async () => {
        if (!activeConvDetails) return;
        
        const otherUserId = activeConvDetails.other_participant?.id || 
                          (activeConvDetails.participant1_id === parseInt(userId) 
                              ? activeConvDetails.participant2_id 
                              : activeConvDetails.participant1_id);
        const otherUserType = activeConvDetails.other_participant_type;
        
        try {
            if (blockedByMe) {
                await unblockUser(userId, userType, otherUserId, otherUserType);
                setIsBlocked(false);
                setBlockedByMe(false);
            } else {
                await blockUser(userId, userType, otherUserId, otherUserType);
                setIsBlocked(true);
                setBlockedByMe(true);
            }
            setShowOptionsMenu(false);
        } catch (error) {
            console.error('Error toggling block:', error);
            alert('حدث خطأ أثناء تنفيذ العملية');
        }
    };

    // Handle delete conversation
    const handleDeleteConversation = async () => {
        if (!activeConversation) return;
        
        if (!confirm('هل أنت متأكد من حذف هذه المحادثة؟')) return;
        
        try {
            await deleteConversation(activeConversation, userId, userType);
            
            // Remove from local state
            setConversations(prev => prev.filter(c => c.conversation_id !== activeConversation));
            setActiveConversation(null);
            setMessages([]);
            setShowOptionsMenu(false);
        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert('حدث خطأ أثناء حذف المحادثة');
        }
    };

    // Send message handler
    const onSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        handleSendMessage(messageInput);
        setMessageInput('');
    };

    // Format time
    const formatTime = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return messageDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'أمس';
        } else {
            return messageDate.toLocaleDateString('ar-SA');
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full bg-white dark:bg-gray-900 overflow-hidden">
            {/* Conversations List */}
            <div className="w-full sm:w-96 md:w-96 lg:w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                {/* Header */}
                <div className="p-4 bg-slate-800 dark:bg-gray-900">
                    <h2 className="text-xl font-bold text-white mb-3">الرسائل</h2>
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        <MessageCircle size={18} />
                        محادثة جديدة
                    </button>
                </div>

                {/* Search Section */}
                {showSearch && (
                    <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2 mb-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="ابحث..."
                                    className="w-full px-4 py-2 pr-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:ring-2 focus:ring-blue-500 dark:text-white transition-all text-sm"
                                    autoFocus
                                />
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                            <button
                                onClick={() => {
                                    setShowSearch(false);
                                    setSearchResults([]);
                                    setSearchTerm('');
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search Results */}
                        {searchLoading && <p className="text-center text-gray-500 text-sm py-3">جاري البحث...</p>}
                        {searchResults.length > 0 && (
                            <div className="max-h-80 overflow-y-auto">
                                {searchResults.map((user) => (
                                    <div
                                        key={`${user.role}-${user.id}`}
                                        onClick={() => handleStartConversation(user)}
                                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors flex items-center gap-3"
                                    >
                                        {user.profile_image_url ? (
                                            <img
                                                src={user.profile_image_url}
                                                alt={user.full_name}
                                                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                                <User className="text-gray-500 dark:text-gray-400" size={24} />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{user.full_name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    user.role === 'lawyer' 
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                    {user.role === 'lawyer' ? 'محامي' : 'عميل'}
                                                </span>
                                                {user.city && <span className="text-xs text-gray-500">{user.city}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!searchLoading && searchResults.length === 0 && searchTerm && (
                            <p className="text-center text-gray-500 text-sm py-6">لا توجد نتائج</p>
                        )}
                    </div>
                )}

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
                    {loading && conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">جاري التحميل...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <MessageCircle size={48} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">لا توجد محادثات</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.conversation_id}
                                onClick={() => selectConversation(conv.conversation_id)}
                                className={`p-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 ${
                                    activeConversation === conv.conversation_id
                                        ? 'bg-gray-100 dark:bg-gray-700'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {conv.other_participant?.profile_image_url ? (
                                        <img
                                            src={conv.other_participant.profile_image_url}
                                            alt={`${conv.other_participant.first_name} ${conv.other_participant.last_name}`}
                                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                            <User className="text-gray-500 dark:text-gray-400" size={24} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex flex-col">
                                                <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                                                    {conv.other_participant?.first_name} {conv.other_participant?.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {conv.other_participant_type === 'lawyer' ? 'محامي' : 'عميل'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-0.5">
                                                {conv.last_message && (
                                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                                        {formatTime(conv.last_message.created_at)}
                                                    </span>
                                                )}
                                                {conv.last_message && conv.last_message.sender_id === parseInt(userId) && conv.last_message.sender_type === userType && (
                                                    conv.last_message.is_read ? (
                                                        <span className="text-xs flex-shrink-0 text-blue-400">
                                                            ✓✓
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs flex-shrink-0 text-gray-400 dark:text-gray-500">
                                                            ✓
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                {conv.last_message?.content || 'لا توجد رسائل'}
                                            </p>
                                            {conv.unread_count > 0 && (
                                                <span className="bg-blue-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeConversation && activeConvDetails ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-4 py-3 flex items-center justify-between backdrop-blur-sm" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e5e7eb\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundColor: 'rgba(30, 41, 59, 0.05)'}}>
                            <div className="flex items-center gap-3">
                                {activeConvDetails.other_participant?.profile_image_url ? (
                                    <img
                                        src={activeConvDetails.other_participant.profile_image_url}
                                        alt={`${activeConvDetails.other_participant.first_name} ${activeConvDetails.other_participant.last_name}`}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                                        <User className="text-gray-300" size={24} />
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-white text-base">
                                        {activeConvDetails.other_participant?.first_name}{' '}
                                        {activeConvDetails.other_participant?.last_name}
                                    </p>
                                    {isOtherUserTyping ? (
                                        <p className="text-sm text-blue-400 flex items-center gap-1.5">
                                            <span className="flex gap-1 items-center">
                                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                            </span>
                                            يكتب الآن
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">
                                            {activeConvDetails.other_participant_type === 'lawyer' ? 'محامي' : 'عميل'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="relative flex items-center gap-1">
                                <button 
                                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                                    className="p-2.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <MoreVertical size={20} />
                                </button>
                                
                                {/* Dropdown Menu */}
                                {showOptionsMenu && (
                                    <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                                        <button
                                            onClick={handleToggleBlock}
                                            className="w-full px-4 py-3 text-right hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200"
                                        >
                                            <span>{blockedByMe ? 'إلغاء الحظر' : 'حظر'}</span>
                                        </button>
                                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                                        <button
                                            onClick={handleDeleteConversation}
                                            className="w-full px-4 py-3 text-right hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 text-sm text-red-600 dark:text-red-400"
                                        >
                                            <span>حذف المحادثة</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e5e7eb\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}>
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-gray-400">
                                        <MessageCircle size={56} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">لا توجد رسائل</p>
                                        <p className="text-xs mt-1">ابدأ المحادثة الآن</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((message) => {
                                        const isSender = message.sender_id === parseInt(userId) && message.sender_type === userType;
                                        return (
                                            <div
                                                key={message.message_id}
                                                className={`flex ${isSender ? 'justify-end' : 'justify-start'} mx-8`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${
                                                        isSender
                                                            ? 'bg-blue-600 text-white rounded-br-none'
                                                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                                                    }`}
                                                >
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                                    <div
                                                        className={`text-xs mt-1 flex items-center gap-1 justify-end ${
                                                            isSender ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        <span>{formatTime(message.created_at)}</span>
                                                        {isSender && (
                                                            message.is_read ? (
                                                                <span className="text-blue-400">✓✓</span>
                                                            ) : (
                                                                <span className="text-gray-300">✓</span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                        {isBlocked ? (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-center">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {blockedByMe 
                                        ? 'لا يمكن إرسال الرسائل. قم بإلغاء الحظر أولاً.'
                                        : 'لا يمكن إرسال الرسائل.'}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={onSendMessage} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex gap-2 items-end">
                                    <textarea
                                        value={messageInput}
                                        onChange={(e) => {
                                            setMessageInput(e.target.value);
                                            handleUserTyping();
                                        }}
                                        placeholder="اكتب رسالة..."
                                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white transition-all text-sm resize-none max-h-32 overflow-y-auto"
                                        rows="1"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                onSendMessage(e);
                                            }
                                        }}
                                        onInput={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-all flex-shrink-0"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                        <div className="text-center text-gray-400">
                            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle size={64} className="opacity-40" />
                            </div>
                            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">اختر محادثة للبدء</p>
                            <p className="text-sm text-gray-400 mt-2">اختر محادثة من القائمة أو ابدأ محادثة جديدة</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    {error}
                </div>
            )}
        </div>
    );
};

export default Messages;
