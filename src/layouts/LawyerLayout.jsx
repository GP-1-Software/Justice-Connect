 
import React, { useState } from 'react'; 
import { Link, Outlet, NavLink, useNavigate } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import { useLawyerAuth } from '../hooks/useLawyerAuth';
import { supabase } from '../supabaseClient';
import { Briefcase, Calendar as CalendarIcon, User as UserIcon, LayoutDashboard, Scale, User, LogOut, Bell, ChevronDown, Moon, Sun, Search, FileText, MessageSquare, Phone, Video, FileSearch, Bot, Settings, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      aria-label="تبديل المظهر"
    >
      {darkMode ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-500" />
      )}
    </button>
  );
};

const LawyerLayout = () => {
  const navigate = useNavigate();
  const { loading, lawyer } = useLawyerAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        ...
      </div>
    );
  }

  if (!lawyer) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* الهيدر */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink
            to="/"
            className="flex items-center space-x-3 space-x-reverse hover:opacity-80 transition"
          >
            <Scale className="h-6 w-6 text-blue-600" />
            <span className="font-bold gradient-text">المنصة القانونية</span>
          </NavLink>

          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-200 font-semibold hidden md:block">
                  {lawyer?.first_name + ' ' + lawyer?.last_name || lawyer?.email || 'محامي'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <NavLink
                    to="/lawyer/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <User className="h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* الشريط الجانبي */}
        <aside className="lg:col-span-3">
          <nav className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 space-y-1">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-white" />
                <span className="text-white font-semibold text-sm">المنصة القانونية</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                <span className="text-white text-xs">محامي</span>
              </div>
            </div>

            {/* Menu Items */}
            <NavLink
              to="/lawyer/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>لوحة التحكم</span>
            </NavLink>

            <NavLink
              to="/lawyer/search"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <Search className="h-4 w-4" />
              <span>البحث عن محامين</span>
            </NavLink>

            <NavLink
              to="/lawyer/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <User className="h-4 w-4" />
              <span>الملف الشخصي</span>
            </NavLink>

            <NavLink
              to="/lawyer/calendar"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <CalendarIcon className="h-4 w-4" />
              <span>مواعيدي</span>
            </NavLink>

            <NavLink
              to="/lawyer/cases"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <Briefcase className="h-4 w-4" />
              <span>قضاياي</span>
            </NavLink>

            {/* New Case Button with Badge */}
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 relative">
              <Plus className="h-4 w-4" />
              <span>إنشاء قضية جديدة</span>
              <span className="mr-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">جديد</span>
            </button>

            <NavLink
              to="/lawyer/messages"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <MessageSquare className="h-4 w-4" />
              <span>الرسائل</span>
            </NavLink>

            <NavLink
              to="/lawyer/calls"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <Phone className="h-4 w-4" />
              <span>المكالمات</span>
            </NavLink>

            <NavLink
              to="/lawyer/consultations"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <Video className="h-4 w-4" />
              <span>الاستشارات</span>
            </NavLink>

            <NavLink
              to="/lawyer/notifications"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <Bell className="h-4 w-4" />
              <span>الإشعارات</span>
            </NavLink>

            <NavLink
              to="/lawyer/document-analysis"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <FileSearch className="h-4 w-4" />
              <span>تحليل المستندات</span>
            </NavLink>

            <NavLink
              to="/lawyer/ai-assistant"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <Bot className="h-4 w-4" />
              <span>المساعد الذكي</span>
            </NavLink>

            <NavLink
              to="/lawyer/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <Settings className="h-4 w-4" />
              <span>الإعدادات</span>
            </NavLink>

            {/* Footer Section */}
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-2">تحتاج مساعدة؟</p>
                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs py-2 rounded-lg hover:shadow-lg transition">
                  تواصل مع المساعد الذكي
                </button>
              </div>
            </div>
          </nav>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="lg:col-span-9">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LawyerLayout;

