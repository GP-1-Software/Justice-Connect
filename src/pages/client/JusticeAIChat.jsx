import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Trash2, Bot, Mic, MessageSquare, Pencil } from "lucide-react";
import { deleteConversation } from "../../services/aiChatStorage";
import { useClientAuth } from "../../hooks/useClientAuth";
import { useTheme } from "../../context/ThemeContext";
import { createConversation, addMessage, getConversationMessages, listConversations, updateConversationTitle } from "../../services/aiChatStorage";

export default function JusticeAIChat() {
    const { userProfile } = useClientAuth();
    const { darkMode } = useTheme();
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "مرحبًا 👋، أنا JusticeAI. كيف يمكنني مساعدتك قانونيًا اليوم؟",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState(() =>
        typeof window !== 'undefined' ? localStorage.getItem('justice_ai_conversation_id') : null
    );
    const [showPanel, setShowPanel] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [panelLoading, setPanelLoading] = useState(false);

    const messagesEndRef = useRef(null);

    const getLocalKey = (id) => `justice_ai_messages_${id || 'temp'}`;

    // 🔽 Auto scroll when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Try to restore conversation id (if was set elsewhere)
    useEffect(() => {
        if (!conversationId) {
            const id = localStorage.getItem('justice_ai_conversation_id');
            if (id) setConversationId(id);
        }
    }, []);

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
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    // Persist messages locally to survive remounts/resizes/navigation
    useEffect(() => {
        try {
            localStorage.setItem(getLocalKey(conversationId), JSON.stringify(messages));
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, conversationId]);

    // Initialize or restore conversation
    useEffect(() => {
        const init = async () => {
            try {
                if (!userProfile?.user_id) return; // wait for auth

                // 1) الاستئناف عبر الأجهزة: جلب أحدث محادثة من Supabase (الأولوية الأعلى)
                try {
                    const conversations = await listConversations(userProfile.user_id);
                    if (conversations && conversations.length) {
                        const latest = conversations[0];
                        setConversationId(latest.id);
                        localStorage.setItem("justice_ai_conversation_id", latest.id);

                        const existing = await getConversationMessages(latest.id);
                        if (existing && existing.length) {
                            setMessages(existing.map(m => ({ role: m.role, content: m.content })));
                            try { localStorage.setItem(getLocalKey(latest.id), JSON.stringify(existing.map(m => ({ role: m.role, content: m.content })))); } catch {}
                        } else {
                            // إن لم توجد رسائل، أضف التحية لحفظ اتساق التجربة
                            const greeting = { role: 'assistant', content: messages[0].content };
                            setMessages([greeting]);
                            try { await addMessage(latest.id, greeting); } catch {}
                            try { localStorage.setItem(getLocalKey(latest.id), JSON.stringify([greeting])); } catch {}
                        }
                        return;
                    }
                } catch (err) {
                    console.warn('listConversations failed, will try local fallback', err?.message || err);
                }

                // 2) fallback محلي: إن وُجد معرف محلي صالح برسائل، استخدمه (وضع عدم الاتصال)
                const storedId = localStorage.getItem("justice_ai_conversation_id");
                if (storedId) {
                    setConversationId(storedId);
                    const existing = await getConversationMessages(storedId);
                    if (existing && existing.length) {
                        setMessages(existing.map(m => ({ role: m.role, content: m.content })));
                        try { localStorage.setItem(getLocalKey(storedId), JSON.stringify(existing.map(m => ({ role: m.role, content: m.content })))); } catch {}
                        return;
                    }
                }

                // Create new conversation and persist greeting
                const conv = await createConversation({ clientUserId: userProfile.user_id, title: "محادثة جديدة" });
                setConversationId(conv.id);
                localStorage.setItem("justice_ai_conversation_id", conv.id);

                // save greeting message
                await addMessage(conv.id, { role: "assistant", content: messages[0].content });
                try { localStorage.setItem(getLocalKey(conv.id), JSON.stringify([{ role: 'assistant', content: messages[0].content }])); } catch {}
            } catch (e) {
                console.warn("AI chat init (storage) warning:", e?.message || e);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile?.user_id]);

    // Load conversations list when panel opens
    useEffect(() => {
        const loadList = async () => {
            if (!showPanel || !userProfile?.user_id) return;
            setPanelLoading(true);
            try {
                const list = await listConversations(userProfile.user_id);
                setConversations(list);
            } catch (e) {
                console.warn('Failed to load conversations list', e?.message || e);
            } finally {
                setPanelLoading(false);
            }
        };
        loadList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPanel, userProfile?.user_id]);

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
            localStorage.setItem('justice_ai_conversation_id', id);
            const mapped = msgs.length ? msgs.map(m => ({ role: m.role, content: m.content })) : [{ role: 'assistant', content: messages[0].content }];
            setMessages(mapped);
            try { localStorage.setItem(getLocalKey(id), JSON.stringify(mapped)); } catch {}
            setShowPanel(false);
        } catch (e) {
            console.warn('Open conversation failed', e?.message || e);
        }
    };

    const startNewConversation = async () => {
        if (!userProfile?.user_id) return;
        try {
            const conv = await createConversation({ clientUserId: userProfile.user_id, title: 'محادثة جديدة' });
            setConversationId(conv.id);
            localStorage.setItem('justice_ai_conversation_id', conv.id);
            const greeting = { role: 'assistant', content: messages[0].content };
            setMessages([greeting]);
            await addMessage(conv.id, greeting);
            try { localStorage.setItem(getLocalKey(conv.id), JSON.stringify([greeting])); } catch {}
            // refresh list if panel open
            if (showPanel) {
                try { setConversations(await listConversations(userProfile.user_id)); } catch {}
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
            try { localStorage.removeItem(getLocalKey(id)); } catch {}
            
            // Refresh list
            const updatedList = await listConversations(userProfile.user_id);
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
        } catch {}
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
                if (showPanel && userProfile?.user_id) {
                    try { setConversations(await listConversations(userProfile.user_id)); } catch {}
                }
            }
        } catch {}

        // persist user message
        try {
            if (conversationId) {
                await addMessage(conversationId, userMessage);
            }
        } catch {}

        // Temporary empty message for streaming animation
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/api/justice-chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage.content }),
            });

            const data = await res.json();
            const reply = data.reply || "⚠️ لم أستطع توليد إجابة.";

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

    return (
        <div className="flex flex-col h-[100vh] bg-[#e6ffff] dark:bg-gray-900" dir="rtl">

            {/* Header */}
            <div className="sticky top-[64px] z-40 bg-white dark:bg-gray-800">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-6 sm:p-8 text-white shadow-lg">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold text-lg sm:text-xl">
                            <button
                                onClick={() => setShowPanel(v => !v)}
                                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-full transition text-sm shadow"
                                title="عرض محادثاتي"
                            >
                                <MessageSquare className="h-4 w-4" />
                                {/*<span className="hidden sm:inline">محادثاتي</span>*/}
                            </button>
                            <span className="text-2xl">⚖️</span>
                            <span>JusticeAI – الذكاء القانوني</span>
                        </div>

                        

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
                className={`fixed top-[64px] right-0 bottom-0 w-64 sm:w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col transform-gpu transition-transform duration-300 ${showPanel ? 'translate-x-0' : 'translate-x-full'}`}
                dir="rtl"
            >
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={startNewConversation}
                        className="w-full py-2.5 px-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                        <Pencil className="h-4 w-4" />
                        <span>محادثة جديدة</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                    {panelLoading && <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-3">تحميل...</div>}
                    {!panelLoading && conversations.length === 0 && (
                        <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-6">لا توجد محادثات</div>
                    )}
                    {conversations.map(c => {
                        const active = c.id === conversationId;
                        return (
                            <div
                                key={c.id}
                                className={`group relative mx-2 mb-1 rounded-lg ${active ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition`}
                            >
                                <button
                                    onClick={() => openConversation(c.id)}
                                    className="w-full text-right px-3 py-2.5 flex items-start gap-2.5 transform-gpu transition hover:-translate-x-0.5"
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
                                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                                    title="حذف"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => setShowPanel(false)} 
                        className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition py-2"
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
                <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
                    <button
                        disabled
                        className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        title="قريباً"
                    >
                        <Mic className="h-5 w-5" />
                    </button>
                    <input
                        className="flex-1 px-4 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="اكتب سؤالك القانوني…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading}
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
            className={`flex items-start gap-3 ${
                isUser ? "flex-row-reverse" : "flex-row"
            } animate-slideUp`}
        >
            {/* Avatar */}
            <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${
                    isUser ? "bg-gradient-to-l from-blue-400 to-blue-500 text-white" : "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-gray-700"
                }`}
            >
                {isUser ? "👤" : <Bot className="h-5 w-5" />}
            </div>

            {/* Message */}
            <div
                className={`relative max-w-[75%] p-4 sm:p-5 rounded-3xl leading-8 shadow whitespace-pre-wrap break-words text-right select-text ${
                    isUser ? "bg-gradient-to-l from-blue-400 to-blue-500 text-white shadow-blue-200/40" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-md"
                }`}
            >
                <button
                    onClick={handleCopy}
                    className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} z-10 ${isUser ? 'text-white/90 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'} transition`}
                    aria-label="نسخ"
                    title={copied ? 'تم النسخ' : 'نسخ'}
                >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
                {isUser ? (
                    <span className="font-medium">{content}</span>
                ) : (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ node, ...props }) => (
                                <p className="mb-2 leading-8" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                                <ul className="list-disc pr-6 space-y-1" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                                <ol className="list-decimal pr-6 space-y-1" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                                <li className="leading-8" {...props} />
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
