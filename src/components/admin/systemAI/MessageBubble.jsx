// src/components/admin/systemAI/MessageBubble.jsx

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiCopy, FiCheck, FiUser } from "react-icons/fi";
import { Bot } from "lucide-react";

const MessageBubble = ({ message, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === "user";

  const handleCopy = async () => {
    const success = await onCopy(message.message);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex items-start gap-2 sm:gap-4 mb-4 sm:mb-6 animate-fadeIn ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <Bot size={16} className="sm:w-5 sm:h-5" />
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`p-3 sm:p-4 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg ${
            isUser
              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-md"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-md"
          }`}
        >
          {isUser ? (
            <span className="block text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
              {message.message}
            </span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => (
                  <p
                    className="mb-2 text-xs sm:text-sm leading-7 text-gray-800 dark:text-gray-100"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="mb-2 list-disc pr-5 text-xs sm:text-sm space-y-1 text-gray-800 dark:text-gray-100"
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    className="mb-2 list-decimal pr-5 text-xs sm:text-sm space-y-1 text-gray-800 dark:text-gray-100"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li className="leading-7" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-gray-900 dark:text-white" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="text-gray-700 dark:text-gray-200" {...props} />
                ),
                h1: ({ node, ...props }) => (
                  <h1
                    className="mb-3 text-base sm:text-lg font-extrabold text-gray-900 dark:text-white"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="mb-2 text-sm sm:text-base font-bold text-gray-900 dark:text-white"
                    {...props}
                  />
                ),
                code: ({ node, inline, className, children, ...props }) => {
                  const codeClasses = "text-[11px] sm:text-xs font-mono";
                  if (inline) {
                    return (
                      <code
                        className={`rounded bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 ${codeClasses} ${className || ""}`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="mb-3 overflow-auto rounded-xl bg-gray-100 dark:bg-gray-900 p-3">
                      <code className={`${codeClasses} ${className || ""}`} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="mb-3 border-r-4 border-blue-400 pr-3 text-xs sm:text-sm italic text-gray-700 dark:text-gray-200"
                    {...props}
                  />
                ),
                br: () => <br />,
              }}
            >
              {message.message}
            </ReactMarkdown>
          )}
        </div>

        <div
          className={`flex items-center gap-2 sm:gap-3 mt-2 px-1 sm:px-2 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            {new Date(message.created_at).toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {!isUser && (
            <button
              onClick={handleCopy}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                copied
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title={copied ? "تم النسخ! ✓" : "نسخ"}
            >
              {copied ? <FiCheck size={12} className="sm:w-3.5 sm:h-3.5" /> : <FiCopy size={12} className="sm:w-3.5 sm:h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-white shadow-lg border border-gray-200 dark:border-gray-600">
          <FiUser size={16} className="sm:w-[18px] sm:h-[18px]" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;

