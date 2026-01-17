import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    MessageCircle,
    X,
    Send,
    Bot,
    Minimize2,
    Maximize2,
    Copy,
    Check,
    Loader2,
    Plus,
    MessageSquare,
    Trash2,
    Paperclip,
    FileText
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import {
    createConversation,
    addMessage,
    getConversationMessages,
    listConversations,
    updateConversationTitle,
    deleteConversation
} from "../../services/aiChatStorage";

/**
 * FloatingAIChat - A floating chatbot widget that syncs with the main JusticeAI page
 */
export default function FloatingAIChat({ userProfile, userType = 'client' }) {
    const { darkMode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showConversations, setShowConversations] = useState(false);
    const [conversations, setConversations] = useState([]);

    // Use different localStorage keys for client vs lawyer
    const storageKey = userType === 'lawyer' ? 'justice_ai_lawyer_conversation_id' : 'justice_ai_conversation_id';

    // Get user ID based on user type (lawyer uses lawyer_id, client uses user_id)
    const getUserId = () => {
        if (userType === 'lawyer') {
            return userProfile?.lawyer_id || userProfile?.user_id;
        }
        return userProfile?.user_id;
    };

    const [conversationId, setConversationId] = useState(() => {
        return localStorage.getItem(storageKey) || null;
    });
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "مرحبًا 👋، أنا JusticeAI. كيف يمكنني مساعدتك قانونيًا؟",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [tokenUsage, setTokenUsage] = useState(null); // Token usage from last AI response
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [pendingFile, setPendingFile] = useState(null); // File waiting to be sent
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    const getLocalKey = (id) => `justice_ai_${userType}_messages_${id || 'temp'}`;

    // Auto scroll when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Close with ESC
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && isOpen) {
                if (showConversations) {
                    setShowConversations(false);
                } else {
                    setIsOpen(false);
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, showConversations]);

    // Load or restore conversation when opened
    useEffect(() => {
        const initConversation = async () => {
            if (!isOpen || !getUserId()) return;

            try {
                // Try to get existing conversations
                const convList = await listConversations(getUserId(), userType);
                setConversations(convList);

                // If we have a stored conversation ID, load its messages
                const storedId = localStorage.getItem(storageKey);
                if (storedId) {
                    const msgs = await getConversationMessages(storedId);
                    if (msgs && msgs.length) {
                        setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
                        setConversationId(storedId);
                        return;
                    }
                }

                // If no stored ID or no messages, use the latest conversation
                if (convList.length > 0) {
                    const latest = convList[0];
                    const msgs = await getConversationMessages(latest.id);
                    if (msgs && msgs.length) {
                        setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
                    }
                    setConversationId(latest.id);
                    localStorage.setItem(storageKey, latest.id);
                }
            } catch (err) {
                console.warn('FloatingAIChat init error:', err);
            }
        };

        initConversation();
    }, [isOpen, userProfile, userType, storageKey]);

    // Load conversations list
    const loadConversations = async () => {
        if (!getUserId()) return;
        setLoadingConversations(true);
        try {
            const list = await listConversations(getUserId(), userType);
            setConversations(list);
        } catch (err) {
            console.warn('Failed to load conversations:', err);
        } finally {
            setLoadingConversations(false);
        }
    };

    // Open a specific conversation
    const openConversation = async (id) => {
        if (!id || id === conversationId) {
            setShowConversations(false);
            return;
        }
        try {
            const msgs = await getConversationMessages(id);
            const mapped = msgs.length
                ? msgs.map(m => ({ role: m.role, content: m.content }))
                : [{ role: 'assistant', content: 'مرحبًا 👋، أنا JusticeAI. كيف يمكنني مساعدتك قانونيًا؟' }];
            setMessages(mapped);
            setConversationId(id);
            localStorage.setItem(storageKey, id);
            setShowConversations(false);
        } catch (err) {
            console.warn('Open conversation failed:', err);
        }
    };

    // Start new conversation
    const startNewConversation = async () => {
        if (!getUserId()) return;
        try {
            const convData = userType === 'lawyer'
                ? { lawyerUserId: getUserId(), title: 'محادثة جديدة' }
                : { clientUserId: getUserId(), title: 'محادثة جديدة' };

            const conv = await createConversation(convData);
            const greeting = { role: 'assistant', content: 'مرحبًا 👋، أنا JusticeAI. كيف يمكنني مساعدتك قانونيًا؟' };
            setMessages([greeting]);
            setConversationId(conv.id);
            localStorage.setItem(storageKey, conv.id);

            // Save greeting
            await addMessage(conv.id, greeting);

            // Refresh list
            await loadConversations();
            setShowConversations(false);
        } catch (err) {
            console.warn('Create new conversation failed:', err);
        }
    };

    // Delete conversation
    const handleDeleteConversation = async (id, e) => {
        e?.stopPropagation();
        if (!window.confirm('هل تريد حذف هذه المحادثة؟')) return;

        try {
            await deleteConversation(id);
            localStorage.removeItem(getLocalKey(id));

            const updatedList = await listConversations(getUserId(), userType);
            setConversations(updatedList);

            if (id === conversationId) {
                if (updatedList.length > 0) {
                    await openConversation(updatedList[0].id);
                } else {
                    await startNewConversation();
                }
            }
        } catch (err) {
            console.warn('Delete conversation failed:', err);
        }
    };

    // Streaming effect (char by char)
    const streamReply = useCallback(async (fullText, convId) => {
        let currentText = "";
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));

        for (let i = 0; i < fullText.length; i++) {
            currentText += fullText[i];
            setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: currentText },
            ]);
            await delay(8);
        }

        // Persist the assistant message
        try {
            if (convId) {
                await addMessage(convId, { role: "assistant", content: fullText });
            }
        } catch { }
    }, []);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");

        // Create conversation if doesn't exist
        let activeConvId = conversationId;
        if (!activeConvId && getUserId()) {
            try {
                const convData = userType === 'lawyer'
                    ? { lawyerUserId: getUserId(), title: input.slice(0, 50) }
                    : { clientUserId: getUserId(), title: input.slice(0, 50) };

                const conv = await createConversation(convData);
                activeConvId = conv.id;
                setConversationId(conv.id);
                localStorage.setItem(storageKey, conv.id);

                // Add greeting message
                await addMessage(conv.id, { role: 'assistant', content: 'مرحبًا 👋، أنا JusticeAI. كيف يمكنني مساعدتك قانونيًا؟' });
            } catch (err) {
                console.warn('Failed to create conversation:', err);
            }
        }

        // Persist user message
        try {
            if (activeConvId) {
                await addMessage(activeConvId, userMessage);

                // Update title if first user message
                const conv = conversations.find(c => c.id === activeConvId);
                if (conv?.title === 'محادثة جديدة') {
                    await updateConversationTitle(activeConvId, input.slice(0, 50));
                }
            }
        } catch { }

        // Temporary empty message for streaming animation
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setLoading(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/justice-chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage.content }),
            });

            const data = await res.json();
            const reply = data.reply || "⚠️ لم أستطع توليد إجابة.";

            // Log token usage to console
            if (data.usage) {
                console.log('==================================================');
                console.log('🔢 Token Usage:');
                console.log(`  Total Tokens: ${data.usage.total_tokens}`);
                console.log(`  📤 Prompt Tokens: ${data.usage.prompt_tokens}`);
                console.log(`  📥 Completion Tokens: ${data.usage.completion_tokens}`);
                console.log('==================================================');
            }

            // Streaming reply
            await streamReply(reply, activeConvId);
        } catch (err) {
            setMessages((prev) => [
                ...prev.slice(0, -1),
                {
                    role: "assistant",
                    content: "⚠️ حدث خطأ أثناء الاتصال بالذكاء القانوني.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Handle PDF file selection (just store, don't send yet)
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (file.type !== "application/pdf") {
            alert("فقط ملفات PDF مسموحة");
            return;
        }

        // Validate file size (20MB max)
        if (file.size > 20 * 1024 * 1024) {
            alert("حجم الملف يجب أن يكون أقل من 20MB");
            return;
        }

        // Store file for later sending
        setPendingFile(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Remove pending file
    const removePendingFile = () => {
        setPendingFile(null);
    };

    // Send message with optional file
    const sendMessageWithFile = async () => {
        if ((!input.trim() && !pendingFile) || loading) return;

        const question = input.trim() || "لخص هذا المستند القانوني بالتفصيل";
        const file = pendingFile;

        // Clear input and pending file
        setInput("");
        setPendingFile(null);

        // Add user message
        const userContent = file
            ? `📄 ${file.name}${input.trim() ? `\n\n${input.trim()}` : ''}`
            : input.trim();
        const userMessage = { role: "user", content: userContent };
        setMessages((prev) => [...prev, userMessage]);

        // Auto title if still default
        try {
            if (conversationId && conversations.find(c => c.id === conversationId)?.title === 'محادثة جديدة') {
                await updateConversationTitle(conversationId, userContent.slice(0, 50));
                // Refresh list silently
                if (showConversations) {
                    try { setConversations(await listConversations(getUserId(), userType === 'lawyer' ? 'lawyer' : undefined)); } catch { }
                }
            }
        } catch { }

        // persist user message
        try {
            if (conversationId) {
                await addMessage(conversationId, userMessage);
            }
        } catch { }

        // Add temporary loading message
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setLoading(true);

        try {
            let reply;

            if (file) {
                // Send file to document analysis endpoint
                const formData = new FormData();
                formData.append("file", file);
                formData.append("question", question);

                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/document-analysis/analyze", {
                    method: "POST",
                    body: formData,
                });

                const data = await res.json();
                if (data.error) throw new Error(data.error);
                reply = data.answer || "⚠️ لم أستطع تحليل المستند.";
            } else {
                // Regular text message
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/justice-chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: question }),
                });

                const data = await res.json();
                reply = data.reply || "⚠️ لم أستطع توليد إجابة.";

                // Log token usage to console
                if (data.usage) {
                    console.log('==================================================');
                    console.log('🔢 Token Usage:');
                    console.log(`  Total Tokens: ${data.usage.total_tokens}`);
                    console.log(`  📤 Prompt Tokens: ${data.usage.prompt_tokens}`);
                    console.log(`  📥 Completion Tokens: ${data.usage.completion_tokens}`);
                    console.log('==================================================');
                }
            }

            await streamReply(reply, conversationId);

        } catch (err) {
            console.error("Send error:", err);
            setMessages((prev) => [
                ...prev.slice(0, -1),
                {
                    role: "assistant",
                    content: `⚠️ ${err.message || "حدث خطأ أثناء المعالجة."}`,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button - Hidden on Mobile */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`hidden md:flex fixed bottom-6 right-6 z-[999] w-14 h-14 rounded-full shadow-2xl items-center justify-center transition-all duration-300 ${isOpen
                    ? 'bg-red-500 hover:bg-red-600 rotate-0'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 animate-pulse hover:animate-none'
                    }`}
                title={isOpen ? "إغلاق المحادثة" : "تحدث مع JusticeAI"}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Chat Popup - Hidden on Mobile */}
            {isOpen && (
                <div
                    className={`hidden md:flex fixed z-[998] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex-col overflow-hidden transition-all duration-300 ${isExpanded
                        ? 'bottom-4 right-4 left-4 top-20 sm:left-auto sm:w-[600px] sm:h-[80vh]'
                        : 'bottom-24 right-6 w-[360px] sm:w-[400px] h-[500px]'
                        }`}
                    dir="rtl"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-3 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">JusticeAI</h3>
                                <p className="text-xs text-white/80">الذكاء القانوني</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Conversations List Button */}
                            <button
                                onClick={() => {
                                    setShowConversations(!showConversations);
                                    if (!showConversations) loadConversations();
                                }}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="المحادثات السابقة"
                            >
                                <MessageSquare className="w-4 h-4" />
                            </button>
                            {/* New Conversation */}
                            <button
                                onClick={startNewConversation}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="محادثة جديدة"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            {/* Expand/Collapse */}
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title={isExpanded ? "تصغير" : "توسيع"}
                            >
                                {isExpanded ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                            </button>
                            {/* Close */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                title="إغلاق"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Conversations Sidebar (Overlay) */}
                    {showConversations && (
                        <>
                            <div
                                className="absolute inset-0 bg-black/30 z-10 rounded-b-2xl"
                                onClick={() => setShowConversations(false)}
                            />
                            <div className="absolute top-12 right-2 left-2 bottom-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-20 flex flex-col rounded-xl shadow-xl overflow-hidden">
                                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">المحادثات</h4>
                                    <button
                                        onClick={startNewConversation}
                                        className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                        title="محادثة جديدة"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                    {loadingConversations && (
                                        <div className="text-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                                        </div>
                                    )}
                                    {!loadingConversations && conversations.length === 0 && (
                                        <p className="text-center text-xs text-gray-500 py-4">لا توجد محادثات</p>
                                    )}
                                    {conversations.map(conv => (
                                        <div
                                            key={conv.id}
                                            className={`group mx-2 mb-1 rounded-lg cursor-pointer ${conv.id === conversationId
                                                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                            onClick={() => openConversation(conv.id)}
                                        >
                                            <div className="p-2.5 flex items-start gap-2">
                                                <MessageSquare className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {conv.title || 'محادثة جديدة'}
                                                    </p>
                                                    {conv.last_message_at && (
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                            {new Date(conv.last_message_at).toLocaleDateString('ar')}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-3 h-3 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Close button */}
                                <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                    <button
                                        onClick={() => setShowConversations(false)}
                                        className="w-full py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                                    >
                                        إغلاق القائمة
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900 scrollbar-thin">
                        {messages.map((msg, idx) => (
                            <ChatBubble key={idx} role={msg.role} content={msg.content} />
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs">جاري الكتابة...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Pending File Indicator */}
                        {pendingFile && (
                            <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="flex-1 text-xs text-blue-700 dark:text-blue-300 truncate">
                                    {pendingFile.name}
                                </span>
                                <button
                                    onClick={removePendingFile}
                                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded text-blue-600 dark:text-blue-400"
                                    title="إزالة الملف"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {/* PDF Upload Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${pendingFile
                                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                                    } disabled:opacity-50`}
                                title="رفع ملف PDF للتحليل"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>

                            <input
                                ref={inputRef}
                                type="text"
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-right text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={pendingFile ? "اكتب سؤالك عن الملف أو اضغط إرسال..." : "اكتب سؤالك..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessageWithFile()}
                                disabled={loading}
                            />
                            <button
                                onClick={sendMessageWithFile}
                                disabled={loading || (!input.trim() && !pendingFile)}
                                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="text-[10px]">
                                {conversationId ? `المحادثة: ${conversations.find(c => c.id === conversationId)?.title?.slice(0, 20) || '...'}` : ''}
                            </span>
                            <a
                                href={userType === 'lawyer' ? '/lawyer/justice-ai' : '/client/justice-ai'}
                                className="hover:text-blue-500 transition-colors"
                            >
                                فتح الصفحة الكاملة ←
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* Compact Chat Bubble */
function ChatBubble({ role, content }) {
    const isUser = role === "user";
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch { }
    };

    if (!content) return null;

    return (
        <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isUser
                    ? "bg-blue-500 text-white text-xs"
                    : "bg-white dark:bg-gray-800 text-blue-600 border border-gray-200 dark:border-gray-700"
                    }`}
            >
                {isUser ? "👤" : <Bot className="h-4 w-4" />}
            </div>

            {/* Message */}
            <div
                className={`relative max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed group ${isUser
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm"
                    }`}
            >
                {!isUser && (
                    <button
                        onClick={handleCopy}
                        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
                        title="نسخ"
                    >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                )}

                {isUser ? (
                    <span>{content}</span>
                ) : (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pr-4 space-y-0.5" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pr-4 space-y-0.5" {...props} />,
                            li: ({ node, ...props }) => <li {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
}
