import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Filter, Calendar, MessageCircle, Briefcase, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useLawyerAuth } from '../hooks/useLawyerAuth';
import { useClientAuth } from '../hooks/useClientAuth';

/**
 * Full Notifications Page
 * Shows all notifications with filtering options
 */
const NotificationsPage = () => {
    const navigate = useNavigate();
    const { lawyer } = useLawyerAuth();
    const { userProfile } = useClientAuth();

    const userId = lawyer?.lawyer_id || userProfile?.user_id;
    const userType = lawyer?.user_type || userProfile?.user_type;

    const {
        notifications,
        unreadCount,
        loading,
        markRead,
        markAllRead,
        deleteNotif,
        refetch
    } = useNotifications(userId, userType, { limit: 100 });

    const [filterType, setFilterType] = useState('all'); // all, unread, messages, cases, appointments
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest, priority

    // Load notifications when page opens
    useEffect(() => {
        if (userId && userType) {
            refetch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, userType]);

    // Show loading if no user info
    if (!userId || !userType) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600"></div>
            </div>
        );
    }

    // Filter notifications
    const filteredNotifications = notifications.filter(notif => {
        if (filterType === 'all') return true;
        if (filterType === 'unread') return !notif.is_read;
        if (filterType === 'messages') return notif.type?.includes('MESSAGE');
        if (filterType === 'cases') return notif.type?.includes('CASE');
        if (filterType === 'appointments') return notif.type?.includes('APPOINTMENT');
        if (filterType === 'payments') return notif.type?.includes('PAYMENT') || notif.type?.includes('INVOICE');
        return true;
    });

    // Sort notifications
    const sortedNotifications = [...filteredNotifications].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.created_at) - new Date(a.created_at);
        } else if (sortBy === 'oldest') {
            return new Date(a.created_at) - new Date(b.created_at);
        } else if (sortBy === 'priority') {
            const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        }
        return 0;
    });

    const handleNotificationClick = async (notification) => {
        // Mark as read (DO NOT DELETE from notifications page)
        if (!notification.is_read) {
            await markRead(notification.notification_id);
        }

        // Navigate to the action URL
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const getIcon = (type) => {
        if (type?.includes('MESSAGE')) return MessageCircle;
        if (type?.includes('CASE')) return Briefcase;
        if (type?.includes('APPOINTMENT')) return Calendar;
        if (type?.includes('PAYMENT') || type?.includes('INVOICE')) return DollarSign;
        if (type?.includes('REMINDER') || type?.includes('DEADLINE')) return Clock;
        return Bell;
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'border-r-4 border-red-500 bg-red-50 dark:bg-red-900/10';
            case 'high': return 'border-r-4 border-orange-500 bg-orange-50 dark:bg-orange-900/10';
            case 'normal': return 'border-r-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10';
            case 'low': return 'border-r-4 border-gray-400 bg-gray-50 dark:bg-gray-800/50';
            default: return '';
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

        return notifTime.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!userId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        خطأ في التحميل
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        يرجى تسجيل الدخول للمتابعة
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-8 px-3 sm:px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0">
                                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                                    الإشعارات
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 space-x-reverse w-full sm:w-auto">
                            <button
                                onClick={markAllRead}
                                disabled={unreadCount === 0}
                                className="flex items-center justify-center space-x-2 space-x-reverse px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm sm:text-base font-semibold touch-manipulation flex-1 sm:flex-initial"
                            >
                                <CheckCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>قراءة الكل</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm touch-manipulation ${filterType === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            الكل ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilterType('unread')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm touch-manipulation ${filterType === 'unread'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            غير مقروء ({unreadCount})
                        </button>
                        <button
                            onClick={() => setFilterType('messages')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm touch-manipulation ${filterType === 'messages'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            الرسائل
                        </button>
                        <button
                            onClick={() => setFilterType('cases')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm touch-manipulation ${filterType === 'cases'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            القضايا
                        </button>
                        <button
                            onClick={() => setFilterType('appointments')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm touch-manipulation ${filterType === 'appointments'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            المواعيد
                        </button>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الترتيب:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="newest">الأحدث</option>
                            <option value="oldest">الأقدم</option>
                            <option value="priority">الأولوية</option>
                        </select>
                    </div>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="flex justify-center items-center py-8 sm:py-12">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : sortedNotifications.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-8 sm:p-12 text-center">
                        <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400 dark:text-gray-600" />
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            لا توجد إشعارات
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            {filterType === 'all'
                                ? 'لم تتلق أي إشعارات بعد'
                                : 'لا توجد إشعارات في هذه الفئة'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3">
                        {sortedNotifications.map((notification) => {
                            const Icon = getIcon(notification.type);
                            return (
                                <div
                                    key={notification.notification_id}
                                    className={`bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer ${getPriorityColor(notification.priority)
                                        } ${!notification.is_read ? 'ring-2 ring-blue-500' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="p-3 sm:p-4 lg:p-5">
                                        <div className="flex items-start space-x-3 sm:space-x-4 space-x-reverse">
                                            <div className="flex-shrink-0">
                                                <div className={`p-2 sm:p-3 rounded-lg ${notification.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30' :
                                                    notification.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                        notification.priority === 'normal' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                            'bg-gray-100 dark:bg-gray-700'
                                                    }`}>
                                                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${notification.priority === 'urgent' ? 'text-red-600 dark:text-red-400' :
                                                        notification.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                                                            notification.priority === 'normal' ? 'text-blue-600 dark:text-blue-400' :
                                                                'text-gray-600 dark:text-gray-400'
                                                        }`} />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0 w-full">
                                                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-1 break-words">
                                                            {notification.title}
                                                            {!notification.is_read && (
                                                                <span className="mr-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                                                            )}
                                                        </h3>
                                                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 break-words">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatTime(notification.created_at)}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center space-x-1.5 sm:space-x-2 space-x-reverse self-start sm:mr-4">
                                                        {!notification.is_read && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markRead(notification.notification_id);
                                                                }}
                                                                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors touch-manipulation"
                                                                title="تحديد كمقروء"
                                                            >
                                                                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotif(notification.notification_id);
                                                            }}
                                                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors touch-manipulation"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
