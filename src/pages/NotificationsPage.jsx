import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Settings, Filter, Calendar, MessageCircle, Briefcase, DollarSign, Clock, AlertCircle } from 'lucide-react';
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                                <Bell className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    الإشعارات
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 space-x-reverse">
                            <button
                                onClick={markAllRead}
                                disabled={unreadCount === 0}
                                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                            >
                                <CheckCheck className="w-5 h-5" />
                                <span>قراءة الكل</span>
                            </button>

                            <button
                                onClick={() => navigate(`/${userType}/notifications/settings`)}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <Settings className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filterType === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            الكل ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilterType('unread')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filterType === 'unread'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            غير مقروء ({unreadCount})
                        </button>
                        <button
                            onClick={() => setFilterType('messages')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filterType === 'messages'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            الرسائل
                        </button>
                        <button
                            onClick={() => setFilterType('cases')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filterType === 'cases'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            القضايا
                        </button>
                        <button
                            onClick={() => setFilterType('appointments')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filterType === 'appointments'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            المواعيد
                        </button>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">الترتيب:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="newest">الأحدث</option>
                            <option value="oldest">الأقدم</option>
                            <option value="priority">الأولوية</option>
                        </select>
                    </div>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : sortedNotifications.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                        <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            لا توجد إشعارات
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {filterType === 'all'
                                ? 'لم تتلق أي إشعارات بعد'
                                : 'لا توجد إشعارات في هذه الفئة'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedNotifications.map((notification) => {
                            const Icon = getIcon(notification.type);
                            return (
                                <div
                                    key={notification.notification_id}
                                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer ${getPriorityColor(notification.priority)
                                        } ${!notification.is_read ? 'ring-2 ring-blue-500' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start space-x-4 space-x-reverse">
                                            <div className="flex-shrink-0">
                                                <div className={`p-3 rounded-lg ${notification.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30' :
                                                    notification.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                        notification.priority === 'normal' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                            'bg-gray-100 dark:bg-gray-700'
                                                    }`}>
                                                    <Icon className={`w-6 h-6 ${notification.priority === 'urgent' ? 'text-red-600 dark:text-red-400' :
                                                        notification.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                                                            notification.priority === 'normal' ? 'text-blue-600 dark:text-blue-400' :
                                                                'text-gray-600 dark:text-gray-400'
                                                        }`} />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                            {notification.title}
                                                            {!notification.is_read && (
                                                                <span className="mr-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                                                            )}
                                                        </h3>
                                                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {formatTime(notification.created_at)}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center space-x-2 space-x-reverse mr-4">
                                                        {!notification.is_read && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markRead(notification.notification_id);
                                                                }}
                                                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                                title="تحديد كمقروء"
                                                            >
                                                                <Check className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotif(notification.notification_id);
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
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
