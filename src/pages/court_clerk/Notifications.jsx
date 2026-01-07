// ============================================
// Court Clerk Notifications Page
// صفحة الإشعارات لقلم المحكمة
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Filter,
    RefreshCw,
    ArrowRight,
    FileText,
    Calendar,
    Scale,
    Users,
    AlertCircle,
    Clock
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';
import toast from 'react-hot-toast';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [clerkInfo, setClerkInfo] = useState(null);

    // Load clerk info
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setClerkInfo(JSON.parse(userData));
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    }, []);

    // Load notifications
    useEffect(() => {
        if (clerkInfo?.user_id) {
            loadNotifications();
        }
    }, [clerkInfo]);

    const loadNotifications = async () => {
        if (!clerkInfo?.user_id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', clerkInfo.user_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
            toast.error('فشل في تحميل الإشعارات');
        } finally {
            setLoading(false);
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
            toast.success('تم تحديد جميع الإشعارات كمقروءة');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('فشل في تحديث الإشعارات');
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('notification_id', notificationId);

            setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
            toast.success('تم حذف الإشعار');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('فشل في حذف الإشعار');
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.notification_id);

        // Navigate based on action_url if available
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

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

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'filing_submitted':
            case 'document_uploaded':
                return FileText;
            case 'hearing_scheduled':
            case 'hearing_reminder':
                return Calendar;
            case 'decision_issued':
            case 'appeal_submitted':
                return Scale;
            case 'postpone_request':
                return Clock;
            default:
                return Bell;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <CourtClerkHeader
                title="الإشعارات"
                subtitle="متابعة جميع الإشعارات والتنبيهات"
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats & Actions Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-700 dark:text-gray-200 font-medium">
                                {notifications.length} إشعار
                            </span>
                        </div>
                        {unreadCount > 0 && (
                            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
                                {unreadCount} غير مقروء
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filter */}
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="all">جميع الإشعارات</option>
                            <option value="unread">غير مقروءة</option>
                            <option value="read">مقروءة</option>
                        </select>

                        {/* Mark All as Read */}
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                            >
                                <CheckCheck className="w-4 h-4" />
                                <span className="hidden sm:inline">تحديد الكل كمقروء</span>
                            </button>
                        )}

                        {/* Refresh */}
                        <button
                            onClick={loadNotifications}
                            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                        <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
                            لا توجد إشعارات
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'سيتم عرض الإشعارات هنا عند وصولها'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification, index) => {
                            const Icon = getNotificationIcon(notification.type);
                            return (
                                <motion.div
                                    key={notification.notification_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all border-r-4 ${!notification.is_read
                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                                            : 'border-transparent'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`p-3 rounded-xl ${!notification.is_read
                                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                                : 'bg-gray-100 dark:bg-gray-700'
                                            }`}>
                                            <Icon className={`w-5 h-5 ${!notification.is_read
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-500 dark:text-gray-400'
                                                }`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={`font-bold ${!notification.is_read
                                                        ? 'text-gray-900 dark:text-white'
                                                        : 'text-gray-700 dark:text-gray-200'
                                                    }`}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                                    {formatTimeAgo(notification.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                {notification.message || notification.body}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {!notification.is_read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.notification_id);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition"
                                                    title="تحديد كمقروء"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.notification_id);
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
