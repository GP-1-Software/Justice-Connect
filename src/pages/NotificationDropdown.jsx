import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

/**
 * Simple Notification Dropdown for Navbar
 */
const NotificationDropdown = ({ userId, userType }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        deleteNotification,
        loadNotifications,
        loadUnreadCount
    } = useNotifications(userId, userType);

    // Refresh notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            loadNotifications({ limit: 20 });
            loadUnreadCount();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Poll unread count every 10 seconds (lightweight check for badge)
    useEffect(() => {
        if (!userId || !userType) return;

        const interval = setInterval(() => {
            loadUnreadCount();
        }, 10000);

        // Listen for notification refresh events
        const handleRefresh = () => {
            loadNotifications({ limit: 20 });
            loadUnreadCount();
        };

        window.addEventListener('refreshNotifications', handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('refreshNotifications', handleRefresh);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, userType]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.is_read) {
            await markAsRead(notification.notification_id);
        }

        // Delete the notification after clicking
        try {
            await deleteNotification(notification.notification_id);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }

        setIsOpen(false);

        // Navigate to the action URL
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const formatTime = (timestamp) => {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffMs = now - notifTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;

        return notifTime.toLocaleDateString('ar-SA', {
            month: 'short',
            day: 'numeric'
        });
    };

    const recentNotifications = notifications.slice(0, 5);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                aria-label="الإشعارات"
            >
                <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            الإشعارات
                            {unreadCount > 0 && (
                                <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">
                                    {unreadCount} جديد
                                </span>
                            )}
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-white/20 rounded-lg p-1 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                            </div>
                        ) : recentNotifications.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                                <p className="text-gray-600 dark:text-gray-400 font-semibold">
                                    لا توجد إشعارات جديدة
                                </p>
                            </div>
                        ) : (
                            <div>
                                {recentNotifications.map((notification) => (
                                    <div
                                        key={notification.notification_id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Unread Indicator */}
                                            {!notification.is_read && (
                                                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                {/* Title */}
                                                <h4 className={`text-sm font-semibold mb-1 ${!notification.is_read
                                                        ? 'text-gray-900 dark:text-white'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {notification.title}
                                                </h4>

                                                {/* Message */}
                                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                                                    {notification.message}
                                                </p>

                                                {/* Time */}
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    {formatTime(notification.created_at)}
                                                </p>
                                            </div>

                                            {/* Priority Badge */}
                                            {notification.priority === 'urgent' && (
                                                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-red-500 rounded-full animate-pulse"></div>
                                            )}
                                            {notification.priority === 'high' && (
                                                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-orange-500 rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {recentNotifications.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate(`/${userType}/notifications`);
                                }}
                                className="w-full text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                            >
                                عرض جميع الإشعارات
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
