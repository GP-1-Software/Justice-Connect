import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Scale, 
  Bell, 
  User, 
  Menu,
  Home,
  LogOut, 
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useLawyerAuth } from '../../hooks/useLawyerAuth';
import { useTheme } from '../../context/ThemeContext';

const LawyerNavbar = ({ onMenuClick }) => {
  const { lawyer, signOut } = useLawyerAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNotificationsClick = () => {
    setNotificationsOpen(!notificationsOpen);
    // Mark notifications as read
    if (unreadCount > 0) {
      setUnreadCount(0);
    }
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg fixed w-full top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Logo */}
          <Link to="/lawyer/dashboard" className="flex items-center space-x-3 space-x-reverse hover:opacity-80 transition">
            <Scale className="h-8 w-8 text-green-600" />
            <span className="text-xl sm:text-2xl font-bold gradient-text">المنصة القانونية</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">- المحامي</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 space-x-reverse">
            {/* Home Button */}
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 space-x-reverse text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition font-semibold"
            >
              <Home className="h-5 w-5" />
              <span>الصفحة الرئيسية</span>
            </button>

            {/* Theme Toggle */}
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

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={handleNotificationsClick}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">الإشعارات</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>لا توجد إشعارات جديدة</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      to="/lawyer/notifications"
                      className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      عرض جميع الإشعارات
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700 dark:text-gray-200 font-semibold hidden lg:block">
                  {lawyer?.first_name} {lawyer?.last_name}
                </span>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {lawyer?.first_name} {lawyer?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {lawyer?.email}
                    </p>
                  </div>
                  
                  <Link
                    to="/lawyer/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <User className="h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </Link>
                  
                  <Link
                    to="/lawyer/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <Settings className="h-4 w-4" />
                    <span>الإعدادات</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 space-x-reverse px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right Side */}
          <div className="flex md:hidden items-center space-x-2 space-x-reverse">
            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {/* Notifications Mobile */}
            <button
              onClick={() => navigate('/lawyer/notifications')}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* User Avatar Mobile */}
            <button
              onClick={() => navigate('/lawyer/profile')}
              className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center"
            >
              <User className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LawyerNavbar;
