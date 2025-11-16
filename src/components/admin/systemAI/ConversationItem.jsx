// src/components/admin/systemAI/ConversationItem.jsx

import { FiTrash2, FiMessageSquare } from "react-icons/fi";
import { useState } from "react";

const ConversationItem = ({ conversation, isActive, onSelect, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete(conversation.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return "اليوم";
    } else if (diffInHours < 48) {
      return "أمس";
    } else {
      return date.toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "short",
      });
    }
  };

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      className={`p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden ${
        isActive
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-[1.02]"
          : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700"
      }`}
    >
      {/* Animated Background Gradient for Active */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      <div className="flex items-start justify-between gap-2 sm:gap-3 relative z-10">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div
            className={`flex-shrink-0 mt-0.5 p-1.5 sm:p-2 rounded-lg ${
              isActive
                ? "bg-white/20"
                : "bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
            }`}
          >
            <FiMessageSquare
              className={isActive ? "text-white" : "text-blue-600 dark:text-blue-400"}
              size={16}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className={`text-xs sm:text-sm font-semibold truncate mb-1 ${
                isActive ? "text-white" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {conversation.title || "محادثة جديدة"}
            </h4>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                📅 {formatDate(conversation.last_message_at || conversation.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className={`flex-shrink-0 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${
            showDeleteConfirm
              ? "bg-red-500 text-white scale-110 opacity-100"
              : isActive
              ? "hover:bg-white/20 text-white"
              : "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
          }`}
          title={showDeleteConfirm ? "اضغط مرة أخرى للتأكيد" : "حذف المحادثة"}
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default ConversationItem;
