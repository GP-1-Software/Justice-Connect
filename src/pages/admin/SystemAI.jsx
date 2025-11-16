// src/pages/admin/SystemAI.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSystemAI } from "../../hooks/useSystemAI";
import ChatSidebar from "../../components/admin/systemAI/ChatSidebar";
import ChatArea from "../../components/admin/systemAI/ChatArea";
import { ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const SystemAI = () => {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const { darkMode, toggleDarkMode } = useTheme();

  // Check authentication and get admin data
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(user);
    if (!userData.role || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      navigate('/');
      return;
    }
    
    setCurrentAdmin(userData);
  }, [navigate]);

  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    error,
    createNewConversation,
    selectConversation,
    sendMessage,
    deleteConversation,
    copyToClipboard,
  } = useSystemAI(currentAdmin?.admin_id); // Use actual admin ID

  const handleNewConversation = async () => {
    try {
      await createNewConversation();
      setIsSidebarOpen(false); // Close sidebar on mobile after creating
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleSelectConversation = async (conversationId) => {
    try {
      await selectConversation(conversationId);
      setIsSidebarOpen(false); // Close sidebar on mobile after selecting
    } catch (error) {
      console.error("Failed to select conversation:", error);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await deleteConversation(conversationId);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleSendMessage = async (text) => {
    try {
      await sendMessage(text);
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Don't render until we have admin data
  if (!currentAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Top Navigation Bar */}
      <div className="flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 sm:py-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-700 rounded-xl transition-all hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
            >
              <ArrowRight size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-semibold text-xs sm:text-base hidden sm:inline">رجوع</span>
              <span className="font-semibold text-xs sm:hidden">رجوع</span>
            </Link>
            <div className="h-6 w-px bg-gradient-to-b from-blue-300 to-purple-300 dark:from-gray-600 dark:to-gray-600 hidden sm:block" />
            <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-1 sm:gap-2 truncate">
              <span className="text-base sm:text-xl">⚖️</span>
              <span className="hidden md:inline">SystemAI Analytics</span>
              <span className="md:hidden">SystemAI</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={toggleDarkMode}
              type="button"
              aria-label={darkMode ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
              aria-pressed={darkMode}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md transition-all"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hidden lg:block">
              مرحباً، <span className="text-gray-900 dark:text-white">{currentAdmin.first_name} {currentAdmin.last_name}</span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg text-xs sm:text-sm">
              {currentAdmin.first_name?.charAt(0)}{currentAdmin.last_name?.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Hidden on mobile/tablet, visible on desktop */}
        {isSidebarOpen && (
          <div className="hidden lg:flex">
            <ChatSidebar
              conversations={conversations}
              currentConversation={currentConversation}
              onNewConversation={handleNewConversation}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              isOpen={true}
              onClose={closeSidebar}
            />
          </div>
        )}
        
        {/* Mobile/Tablet Drawer */}
        <div className="lg:hidden">
          <ChatSidebar
            conversations={conversations}
            currentConversation={currentConversation}
            onNewConversation={handleNewConversation}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
          />
        </div>

        {/* Main Chat Area */}
        <ChatArea
          currentConversation={currentConversation}
          messages={messages}
          isSending={isSending}
          onSendMessage={handleSendMessage}
          onCopy={copyToClipboard}
          onOpenSidebar={openSidebar}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center gap-2 sm:gap-3 animate-slideInRight border border-red-400 max-w-md z-50">
            <span className="text-xl sm:text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold mb-1 text-sm sm:text-base">حدث خطأ</p>
              <p className="text-xs sm:text-sm opacity-90 break-words">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAI;
