// ============================================
// Court Clerk Header Component
// Header موحد لجميع صفحات قلم المحكمة
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Bell, 
    Moon, 
    Sun, 
    Menu, 
    X, 
    Home,
    Inbox,
    FileText,
    Calendar,
    Scale,
    Users,
    Settings,
    LogOut,
    ChevronDown,
    Gavel,
    FolderOpen
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const CourtClerkHeader = ({ title, subtitle }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('darkMode') === 'true' || 
                   document.documentElement.classList.contains('dark');
        }
        return false;
    });
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [clerkInfo, setClerkInfo] = useState(null);
    const notificationRef = useRef(null);
    const userMenuRef = useRef(null);

    // Navigation items
    const navItems = [
        { path: '/court-clerk/dashboard', label: 'الرئيسية', icon: Home },
        { path: '/court-clerk/inbox', label: 'صندوق الوارد', icon: Inbox },
        { path: '/court-clerk/cases', label: 'القضايا', icon: FolderOpen },
        { path: '/court-clerk/registration', label: 'التسجيل', icon: FileText },
        { path: '/court-clerk/hearings', label: 'الجلسات', icon: Calendar },
        { path: '/court-clerk/decisions', label: 'القرارات', icon: Scale },
        { path: '/court-clerk/services', label: 'التبليغات', icon: Users },
    ];

    // Load clerk info
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setClerkInfo(user);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    }, []);

    // Toggle dark mode
    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode.toString());
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Load notifications
    useEffect(() => {
        loadNotifications();
        
        // Subscribe to new notifications
        const channel = supabase
            .channel('clerk-notifications')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    if (payload.new) {
                        setNotifications(prev => [payload.new, ...prev]);
                        if (!payload.new.is_read) {
                            setUnreadCount(prev => prev + 1);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [clerkInfo]);

    const loadNotifications = async () => {
        if (!clerkInfo?.user_id) return;
        
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', clerkInfo.user_id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('notification_id', notificationId);

            setNotifications(prev => 
                prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!clerkInfo?.user_id) return;
        
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', clerkInfo.user_id)
                .eq('is_read', false);

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-EG');
    };

    return (
        <>
            {/* Main Header */}
            <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        
                        {/* Logo & Title */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                            </button>
                            
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Gavel className="w-6 h-6 text-white" />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">قلم المحكمة</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">نظام إدارة القضايا</p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            isActive 
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-2">
                            
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
                                title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
                            >
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {/* Notifications */}
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {showNotifications && (
                                    <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-700">
                                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Bell size={18} className="text-blue-600" />
                                                الإشعارات
                                            </h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    تحديد الكل كمقروء
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                    <Bell size={40} className="mx-auto mb-3 opacity-30" />
                                                    <p>لا توجد إشعارات</p>
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.notification_id}
                                                        onClick={() => markAsRead(notification.notification_id)}
                                                        className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition ${
                                                            !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                                                !notification.is_read ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                                            }`} />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                                    {notification.body}
                                                                </p>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                                                    {formatTimeAgo(notification.created_at)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        
                                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                            <button
                                                onClick={() => {
                                                    setShowNotifications(false);
                                                    navigate('/court-clerk/notifications');
                                                }}
                                                className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                عرض جميع الإشعارات
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Menu */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {clerkInfo?.first_name?.[0] || 'م'}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {clerkInfo?.first_name || 'موظف'}
                                    </span>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </button>

                                {showUserMenu && (
                                    <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-700">
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                {clerkInfo?.first_name} {clerkInfo?.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {clerkInfo?.email || 'موظف قلم المحكمة'}
                                            </p>
                                        </div>
                                        
                                        <div className="py-2">
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    navigate('/court-clerk/settings');
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
                                            >
                                                <Settings size={18} />
                                                الإعدادات
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm"
                                            >
                                                <LogOut size={18} />
                                                تسجيل الخروج
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {showMobileMenu && (
                    <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <nav className="px-4 py-3 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => {
                                            navigate(item.path);
                                            setShowMobileMenu(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                            isActive 
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <Icon size={20} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </header>

            {/* Page Title Section */}
            {(title || subtitle) && (
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 text-white py-6 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
                        {subtitle && (
                            <p className="text-blue-100 dark:text-gray-400 mt-1 text-sm sm:text-base">{subtitle}</p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default CourtClerkHeader;
