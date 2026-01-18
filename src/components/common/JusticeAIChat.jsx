import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Trash2, Bot, Mic, MessageSquare, Pencil, Paperclip, Loader2, FileText, X } from "lucide-react";
import { deleteConversation } from "../../services/aiChatStorage.js";
import { useClientAuth } from "../../hooks/useClientAuth.jsx";
import { useLawyerAuth } from "../../hooks/useLawyerAuth.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { createConversation, addMessage, getConversationMessages, listConversations, updateConversationTitle } from "../../services/aiChatStorage.js";

/**
 * Unified JusticeAI Chat Component
 * Supports both client and lawyer roles through conditional logic
 * @param {string} userType - 'client' or 'lawyer'
 */
export default function JusticeAIChat({ userType = 'client' }) {
    // Auth hooks - use appropriate hook based on userType
    const { userProfile } = useClientAuth();
    const { lawyer } = useLawyerAuth();

    const { darkMode } = useTheme();
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "مرحبًا 👋، أنا JusticeAI. كيف يمكنني مساعدتك قانونيًا اليوم؟",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Dynamic storage key based on userType
    const storageKey = userType === 'lawyer' ? 'justice_ai_lawyer_conversation_id' : 'justice_ai_conversation_id';

    const [conversationId, setConversationId] = useState(() =>
        typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    );
    const [showPanel, setShowPanel] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [panelLoading, setPanelLoading] = useState(false);
    const [pendingFile, setPendingFile] = useState(null); // File waiting to be sent
    const [tokenUsage, setTokenUsage] = useState(null); // Token usage from last AI response

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Get user ID based on userType
    const getUserId = () => {
        if (userType === 'lawyer') {
            return lawyer?.lawyer_id;
        }
        return userProfile?.user_id;
    };

    // Dynamic local storage key
    const getLocalKey = (id) => `justice_ai_${userType}_messages_${id || 'temp'}`;

    // 🔽 Auto scroll when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Try to restore conversation id (if was set elsewhere)
    useEffect(() => {
        if (!conversationId) {
            const id = localStorage.getItem(storageKey);
            if (id) setConversationId(id);
        }
    }, [storageKey]);

    // Optimistic: restore cached messages from localStorage immediately
    useEffect(() => {
        try {
            const cached = localStorage.getItem(getLocalKey(conversationId));
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length) {
                    setMessages(parsed);
                }
            }
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    // Persist messages locally to survive remounts/resizes/navigation
    useEffect(() => {
        try {
            localStorage.setItem(getLocalKey(conversationId), JSON.stringify(messages));
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, conversationId]);

    // Initialize or restore conversation
    useEffect(() => {
        const init = async () => {
            try {
                const userId = getUserId();
                if (!userId) return; // wait for auth

                // 1) الاستئناف عبر الأجهزة: جلب أحدث محادثة من Supabase (الأولوية الأعلى)
                try {
                    const convList = await listConversations(userId, userType === 'lawyer' ? 'lawyer' : undefined);
                    if (convList && convList.length) {
                        const latest = convList[0];
                        setConversationId(latest.id);
                        localStorage.setItem(storageKey, latest.id);

                        const existing = await getConversationMessages(latest.id);
                        if (existing && existing.length) {
                            setMessages(existing.map(m => ({ role: m.role, content: m.content })));
                            try { localStorage.setItem(getLocalKey(latest.id), JSON.stringify(existing.map(m => ({ role: m.role, content: m.content })))); } catch { }
                        } else {
                            // إن لم توجد رسائل، أضف التحية لحفظ اتساق التجربة
                            const greeting = { role: 'assistant', content: messages[0].content };
                            setMessages([greeting]);
                            try { await addMessage(latest.id, greeting); } catch { }
                            try { localStorage.setItem(getLocalKey(latest.id), JSON.stringify([greeting])); } catch { }
                        }
                        return;
                    }
                } catch (err) {
                    console.warn('listConversations failed, will try local fallback', err?.message || err);
                }

                // 2) fallback محلي: إن وُجد معرف محلي صالح برسائل، استخدمه (وضع عدم الاتصال)
                const storedId = localStorage.getItem(storageKey);
                if (storedId) {
                    setConversationId(storedId);
                    const existing = await getConversationMessages(storedId);
                    if (existing && existing.length) {
                        setMessages(existing.map(m => ({ role: m.role, content: m.content })));
                        try { localStorage.setItem(getLocalKey(storedId), JSON.stringify(existing.map(m => ({ role: m.role, content: m.content })))); } catch { }
                        return;
                    }
                }

                // Create new conversation and persist greeting
                const convData = userType === 'lawyer'
                    ? { lawyerUserId: userId, title: "محادثة جديدة" }
                    : { clientUserId: userId, title: "محادثة جديدة" };

                const conv = await createConversation(convData);
                setConversationId(conv.id);
                localStorage.setItem(storageKey, conv.id);

                // save greeting message
                await addMessage(conv.id, { role: "assistant", content: messages[0].content });
                try { localStorage.setItem(getLocalKey(conv.id), JSON.stringify([{ role: 'assistant', content: messages[0].content }])); } catch { }
            } catch (e) {
                console.warn("AI chat init (storage) warning:", e?.message || e);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getUserId()]);

    // Load conversations list when panel opens
    useEffect(() => {
        const loadList = async () => {
            const userId = getUserId();
            if (!showPanel || !userId) return;
            setPanelLoading(true);
            try {
                const list = await listConversations(userId, userType === 'lawyer' ? 'lawyer' : undefined);
                setConversations(list);
            } catch (e) {
                console.warn('Failed to load conversations list', e?.message || e);
            } finally {
                setPanelLoading(false);
            }
        };
        loadList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPanel, getUserId()]);

    // Close panel with ESC
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') setShowPanel(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const openConversation = async (id) => {
        if (!id || id === conversationId) return;
        try {
            const msgs = await getConversationMessages(id);
            setConversationId(id);
            localStorage.setItem(storageKey, id);
            const mapped = msgs.length ? msgs.map(m => ({ role: m.role, content: m.content })) : [{ role: 'assistant', content: messages[0].content }];
            setMessages(mapped);
            try { localStorage.setItem(getLocalKey(id), JSON.stringify(mapped)); } catch { }
            setShowPanel(false);
        } catch (e) {
            console.warn('Open conversation failed', e?.message || e);
        }
    };

    const startNewConversation = async () => {
        const userId = getUserId();
        if (!userId) return;
        try {
            const convData = userType === 'lawyer'
                ? { lawyerUserId: userId, title: 'محادثة جديدة' }
                : { clientUserId: userId, title: 'محادثة جديدة' };

            const conv = await createConversation(convData);
            setConversationId(conv.id);
            localStorage.setItem(storageKey, conv.id);
            const greeting = { role: 'assistant', content: messages[0].content };
            setMessages([greeting]);
            await addMessage(conv.id, greeting);
            try { localStorage.setItem(getLocalKey(conv.id), JSON.stringify([greeting])); } catch { }
            // refresh list if panel open
            if (showPanel) {
                try {
                    setConversations(await listConversations(userId, userType === 'lawyer' ? 'lawyer' : undefined));
                } catch { }
            }
        } catch (e) {
            console.warn('Create new conversation failed', e?.message || e);
        }
    };

    const handleDeleteConversation = async (id, e) => {
        e?.stopPropagation();
        const ok = window.confirm('سيتم حذف هذه المحادثة بالكامل. هل أنت متأكد؟');
        if (!ok) return;
        try {
            await deleteConversation(id);
            try { localStorage.removeItem(getLocalKey(id)); } catch { }

            // Refresh list
            const userId = getUserId();
            const updatedList = await listConversations(userId, userType === 'lawyer' ? 'lawyer' : undefined);
            setConversations(updatedList);

            // If deleted current conversation, start new one
            if (id === conversationId) {
                if (updatedList.length > 0) {
                    await openConversation(updatedList[0].id);
                } else {
                    await startNewConversation();
                }
            }
        } catch (e) {
            console.warn('Delete conversation failed', e?.message || e);
        }
    };

    // 🔥 Streaming effect (char by char)
    const streamReply = async (fullText) => {
        let currentText = "";
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));

        for (let i = 0; i < fullText.length; i++) {
            currentText += fullText[i];
            setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: currentText },
            ]);
            await delay(5); // سرعة الكتابة
        }

        // persist assistant message once done
        try {
            if (conversationId) {
                await addMessage(conversationId, { role: "assistant", content: fullText });
            }
        } catch { }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");

        // Auto title if still default
        try {
            if (conversationId && conversations.find(c => c.id === conversationId)?.title === 'محادثة جديدة') {
                await updateConversationTitle(conversationId, userMessage.content.slice(0, 50));
                // Refresh list silently
                const userId = getUserId();
                if (showPanel && userId) {
                    try {
                        setConversations(await listConversations(userId, userType === 'lawyer' ? 'lawyer' : undefined));
                    } catch { }
                }
            }
        } catch { }

        // persist user message
        try {
            if (conversationId) {
                await addMessage(conversationId, userMessage);
            }
        } catch { }

        // Temporary empty message for streaming animation
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setLoading(true);

        try {
            const res = await fetch("https://justice-connect-mobile.onrender.com/api/justice-chat", {
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
            await streamReply(reply);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
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

        if (file.type !== "application/pdf") {
            alert("فقط ملفات PDF مسموحة");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            alert("حجم الملف يجب أن يكون أقل من 20MB");
            return;
        }

        setPendingFile(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removePendingFile = () => setPendingFile(null);

    // Send message with optional file
    const sendMessageWithFile = async () => {
        if ((!input.trim() && !pendingFile) || loading) return;

        const question = input.trim() || "لخص هذا المستند القانوني بالتفصيل";
        const file = pendingFile;

        setInput("");
        setPendingFile(null);

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
                const userId = getUserId();
                if (showPanel && userId) {
                    try {
                        setConversations(await listConversations(userId, userType === 'lawyer' ? 'lawyer' : undefined));
                    } catch { }
                }
            }
        } catch { }

        // persist user message
        try {
            if (conversationId) {
                await addMessage(conversationId, userMessage);
            }
        } catch { }

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setLoading(true);

        try {
            let reply;
            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("question", question);
                const res = await fetch("https://justice-connect-mobile.onrender.com/api/document-analysis/analyze", { method: "POST", body: formData });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                reply = data.answer || "⚠️ لم أستطع تحليل المستند.";
            } else {
                const res = await fetch("https://justice-connect-mobile.onrender.com/api/justice-chat", {
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
            await streamReply(reply);
        } catch (err) {
            setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: `⚠️ ${err.message || "حدث خطأ."}` },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 -m-4 sm:-m-6 lg:-m-8" dir="rtl">

            {/* Header */}
            <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-cyan-500 p-4 sm:p-6 text-white shadow-lg rounded-b-2xl mx-2 sm:mx-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 font-semibold text-lg sm:text-xl">
                        <button
                            onClick={() => setShowPanel(v => !v)}
                            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-full transition text-sm shadow"
                            title="عرض محادثاتي"
                        >
                            <MessageSquare className="h-4 w-4" />
                        </button>
                        <span className="text-2xl">⚖️</span>
                        <span>JusticeAI – الذكاء القانوني</span>
                    </div>
                </div>
            </div>

            {/* Conversations Side Panel (always mounted for smooth animation) */}
            {/* Backdrop overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/20 dark:bg-black/50 transition-opacity duration-200 ${showPanel ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setShowPanel(false)}
            />
            {/* Sliding panel */}
            <div
                className={`fixed top-[80px] right-4 bottom-4 w-72 sm:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden transform-gpu transition-all duration-300 ${showPanel ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
                dir="rtl"
            >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                    <h3 className="font-bold text-lg mb-3">المحادثات</h3>
                    <button
                        onClick={startNewConversation}
                        className="w-full py-2.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 transition flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Pencil className="h-4 w-4" />
                        <span>محادثة جديدة</span>
                    </button>
                </div>

                {/* Conversations list */}
                <div className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {panelLoading && <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-3">تحميل...</div>}
                    {!panelLoading && conversations.length === 0 && (
                        <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-6">لا توجد محادثات</div>
                    )}
                    {conversations.map(c => {
                        const active = c.id === conversationId;
                        return (
                            <div
                                key={c.id}
                                className={`group relative mx-3 mb-2 rounded-xl ${active ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition`}
                            >
                                <button
                                    onClick={() => openConversation(c.id)}
                                    className="w-full text-right px-3 py-3 flex items-start gap-2.5 transform-gpu transition hover:-translate-x-0.5"
                                >
                                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${active ? 'text-blue-700 dark:text-blue-100' : 'text-gray-700 dark:text-gray-100'}`}>{c.title || 'محادثة جديدة'}</p>
                                        {c.last_message_at && (
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                {new Date(c.last_message_at).toLocaleDateString('ar', { month: 'short', day: 'numeric' })}
                                            </p>
                                        )}
                                    </div>
                                </button>
                                <button
                                    onClick={(e) => handleDeleteConversation(c.id, e)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                    title="حذف"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <button
                        onClick={() => setShowPanel(false)}
                        className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                        إغلاق القائمة
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                    {messages.map((msg, idx) => (
                        <MessageBubble key={idx} role={msg.role} content={msg.content} />
                    ))}

                    {loading && (
                        <div className="flex items-center gap-2 text-gray-600 animate-fadeIn">
                            <span className="animate-bounce">●</span>
                            <span className="animate-bounce delay-150">●</span>
                            <span className="animate-bounce delay-300">●</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="px-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-t dark:border-gray-700 rounded-t-3xl" dir="rtl">
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
                    <div className="max-w-4xl mx-auto flex items-center gap-2 mb-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="flex-1 text-sm text-blue-700 dark:text-blue-300 truncate">
                            {pendingFile.name}
                        </span>
                        <button
                            onClick={removePendingFile}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded text-blue-600 dark:text-blue-400"
                            title="إزالة الملف"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
                    {/* PDF Upload Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className={`p-3 rounded-full transition-colors disabled:opacity-50 ${pendingFile
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                            }`}
                        title="رفع ملف PDF للتحليل"
                    >
                        <Paperclip className="h-5 w-5" />
                    </button>
                    <input
                        className="flex-1 px-4 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder={pendingFile ? "اكتب سؤالك عن الملف أو اضغط إرسال..." : "اكتب سؤالك القانوني…"}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessageWithFile()}
                    />
                    <button
                        onClick={sendMessageWithFile}
                        disabled={loading || (!input.trim() && !pendingFile)}
                        className="px-5 sm:px-6 py-3 bg-gradient-to-l from-blue-600 to-blue-700 text-white rounded-full shadow hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
                    >
                        إرسال
                    </button>
                </div>
            </div>
        </div>
    );
}

/* Chat Bubble Component */
function MessageBubble({ role, content }) {
    const isUser = role === "user";
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const text = content || "";
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for non-secure contexts
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.top = '-9999px';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (e) {
            console.warn('Copy failed:', e);
        }
    };

    return (
        <div
            className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"
                } animate-slideUp`}
        >
            {/* Avatar */}
            <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${isUser ? "bg-gradient-to-l from-blue-400 to-blue-500 text-white" : "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-gray-700"
                    }`}
            >
                {isUser ? "👤" : <Bot className="h-5 w-5" />}
            </div>

            {/* Message */}
            <div
                className={`relative max-w-[75%] p-4 sm:p-5 rounded-3xl leading-relaxed shadow whitespace-pre-wrap break-words text-right select-text ${isUser ? "bg-gradient-to-l from-blue-400 to-blue-500 text-white shadow-blue-200/40" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-md"
                    }`}
            >
                {!isUser && (
                    <button
                        onClick={handleCopy}
                        className={`absolute top-2 right-2 z-10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition`}
                        aria-label="نسخ"
                        title={copied ? 'تم النسخ' : 'نسخ'}
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                )}
                {isUser ? (
                    <span className="font-medium">{content}</span>
                ) : (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ node, ...props }) => (
                                <p className="mb-2 leading-relaxed" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                                <ul className="list-disc pr-6 space-y-1" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                                <ol className="list-decimal pr-6 space-y-1" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                                <li className="leading-relaxed" {...props} />
                            ),
                            strong: ({ node, ...props }) => (
                                <strong className="font-bold" {...props} />
                            ),
                            h1: ({ node, ...props }) => (
                                <h1 className="text-lg font-extrabold mb-3" {...props} />
                            ),
                            h2: ({ node, ...props }) => (
                                <h2 className="text-base font-bold mb-2" {...props} />
                            ),
                            br: () => <br />
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
}
