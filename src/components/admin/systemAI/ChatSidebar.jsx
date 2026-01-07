// src/components/admin/systemAI/ChatSidebar.jsx

import { FiPlus, FiX, FiChevronsRight } from "react-icons/fi";
import ConversationItem from "./ConversationItem";

const ChatSidebar = ({
  conversations,
  currentConversation,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Hidden on mobile/tablet, drawer on small screens, static on desktop */}
      <div
        className={`fixed lg:static inset-y-0 right-0 z-50 w-full sm:w-96 lg:w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-xl">💬</span>
                المحادثات
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {conversations.length} محادثة
              </p>
            </div>
            {/* Close button for mobile drawer */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="إغلاق"
            >
              <FiX size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* New Conversation Button */}
          <button
            onClick={onNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-semibold text-sm"
          >
            <FiPlus size={18} strokeWidth={2.5} />
            <span>محادثة جديدة</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {conversations.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">💭</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                لا توجد محادثات بعد
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ابدأ محادثة جديدة للتحليل
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={currentConversation?.id === conv.id}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium">SystemAI نشط</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;
