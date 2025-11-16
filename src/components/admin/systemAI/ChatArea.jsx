// src/components/admin/systemAI/ChatArea.jsx

import { useState, useRef, useEffect } from "react";
import { FiSend, FiMenu, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import MessageBubble from "./MessageBubble";

const ChatArea = ({
  currentConversation,
  messages,
  isSending,
  onSendMessage,
  onCopy,
  onOpenSidebar,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const text = inputText;
    setInputText("");
    
    try {
      await onSendMessage(text);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 relative overflow-hidden">
        {/* Mobile Header with Conversations Button */}
        <div className="lg:hidden px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <button
            onClick={onOpenSidebar}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-md font-semibold text-sm"
          >
            <FiMenu size={18} />
            <span>المحادثات</span>
          </button>
        </div>

        {/* Desktop toggle when no conversation is selected */}
        <div className="hidden lg:flex absolute top-4 left-4 z-10">
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isSidebarOpen ? "إخفاء قائمة المحادثات" : "إظهار قائمة المحادثات"}
          >
            {isSidebarOpen ? <FiChevronsRight size={18} /> : <FiChevronsLeft size={18} />}
          </button>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center relative z-10 px-4 sm:px-6 md:px-8 w-full max-w-5xl">
          {/* Large Bot Icon with Animation */}
          <div className="mb-6 sm:mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <span className="text-5xl sm:text-6xl">🤖</span>
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            مرحباً في SystemAI
          </h3>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-md mx-auto px-4">
            ابدأ محادثة جديدة لتحليل بياناتك بذكاء اصطناعي متقدم
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto mt-8 sm:mt-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📊</div>
              <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">تحليل ذكي</h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                احصل على إحصائيات دقيقة من قاعدة البيانات
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💬</div>
              <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">لغة طبيعية</h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                اسأل أسئلتك بالعربية ببساطة
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🔒</div>
              <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">آمن وموثوق</h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                محادثاتك خاصة ومؤمنة بالكامل
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            aria-label={isSidebarOpen ? "إخفاء قائمة المحادثات" : "إظهار قائمة المحادثات"}
          >
            {isSidebarOpen ? <FiChevronsRight size={18} /> : <FiChevronsLeft size={18} />}
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
              {currentConversation.title || "محادثة جديدة"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
              📅 {new Date(currentConversation.created_at).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {/* Conversations button for mobile/tablet */}
          <button
            onClick={onOpenSidebar}
            className="lg:hidden flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-md font-semibold text-sm flex-shrink-0"
            aria-label="فتح المحادثات"
          >
            <FiMenu size={18} />
            <span className="hidden sm:inline">المحادثات</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
                <span className="text-4xl sm:text-5xl">💭</span>
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium mb-3">
                ابدأ المحادثة بطرح سؤال
              </p>
              <div className="space-y-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 sm:p-3 border border-blue-100 dark:border-blue-800">
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    💡 مثال: كم عدد المحامين المسجلين؟
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5 sm:p-3 border border-purple-100 dark:border-purple-800">
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">
                    💡 مثال: ما هي القضايا المفتوحة؟
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onCopy={onCopy} />
            ))}
            {isSending && (
              <div className="flex justify-start mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-md p-4 shadow-md border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" />
                    <div
                      className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 sm:px-6 py-3 sm:py-5 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-end gap-2 sm:gap-3">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب سؤالك هنا..."
            disabled={isSending}
            rows={1}
            className="flex-1 resize-none rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 sm:px-5 py-2.5 sm:py-3.5 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 max-h-32 shadow-sm transition-all"
            style={{ minHeight: "48px" }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 text-white rounded-xl transition-all disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            <FiSend size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 overflow-x-auto">
          <span className="flex-shrink-0">⌨️</span>
          <span className="text-xs whitespace-nowrap">اضغط <kbd className="px-1.5 sm:px-2 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 font-mono text-xs">Enter</kbd> للإرسال، <kbd className="px-1.5 sm:px-2 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 font-mono text-xs">Shift+Enter</kbd> لسطر جديد</span>
        </p>
      </div>
    </div>
  );
};

export default ChatArea;
