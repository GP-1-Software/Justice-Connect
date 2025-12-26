import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  Settings,
  Search,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';
import { useClientAuth } from '../../hooks/useClientAuth';
import { useTheme } from '../../context/ThemeContext';
import RoleSwitcher from '../RoleSwitcher';

const ClientNavbar = ({ onMenuClick }) => {
  const { userProfile, signOut } = useClientAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUserMenuOpen(false);
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
          <Link to="/client/dashboard" className="flex items-center space-x-3 space-x-reverse hover:opacity-80 transition">
            <Scale className="h-8 w-8 text-blue-600" />
            <span className="text-xl sm:text-2xl font-bold gradient-text">المنصة القانونية</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">- العميل</span>
          </Link>



          {/* Right Side Actions */}
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Role Switcher */}
            <RoleSwitcher />

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Notifications */}
            <NotificationBell
              key={userProfile?.user_id || 'guest'}
              userId={userProfile?.user_id}
              userType="client"
            />

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition transform hover:scale-105 font-semibold"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:block">{userProfile?.first_name || 'العميل'}</span>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-slideDown">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">مرحباً،</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {userProfile?.first_name} {userProfile?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{userProfile?.email}</p>
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => {
                      navigate('/client/profile-settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                  >
                    <User className="h-5 w-5" />
                    <span>الملف الشخصي</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/client/settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                  >
                    <Settings className="h-5 w-5" />
                    <span>الإعدادات</span>
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </nav>
  );
};

export default ClientNavbar;
