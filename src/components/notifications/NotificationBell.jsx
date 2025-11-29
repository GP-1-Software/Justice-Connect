import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import {
  Bell,
  CheckCheck,
  Trash2
} from 'lucide-react';
import {
  formatNotificationTime
} from '../../services/notificationService';

/**
 * Notification Bell Component with Real-time Updates
 * Displays notification count and dropdown
 */
const NotificationBell = ({ userId, userType }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Memoize filters to prevent unnecessary re-renders
  const filters = React.useMemo(() => ({ limit: 50 }), []);

  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    deleteNotif,
    removeMessageNotifications
  } = useNotifications(userId, userType, filters);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    // Mark as read (this will remove it from the list since we filter unread)
    if (!notification.is_read) {
      await markRead(notification.notification_id);
    }

    // Close dropdown
    setIsOpen(false);

    // Navigate to the action URL directly if available
    if (notification.action_url) {
      navigate(notification.action_url);
    } else {
      // Fallback navigation logic (only for types with valid related_id)
      if (notification.related_type === 'invoice' && notification.related_id) {
        navigate(`/${userType}/invoices/${notification.related_id}`);
      } else if (notification.related_type === 'payment') {
        navigate(`/${userType}/payments`);
      } else if (notification.related_type === 'case' && notification.related_id) {
        navigate(`/${userType}/cases/${notification.related_id}`);
      } else {
        // For appointments or other types without related_id, go to list page
        if (notification.type.includes('appointment')) {
          navigate(`/${userType}/appointments`);
        }
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotif(notificationId);
  };

  // Filter to show only unread notifications
  const unreadNotifications = notifications.filter(n => !n.is_read);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm transform scale-90 sm:scale-100">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="font-bold text-gray-900 dark:text-white">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : unreadNotifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                <Bell className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium">لا توجد إشعارات جديدة</p>
              </div>
            ) : (
              unreadNotifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-700/50 last:border-0 relative group ${!notification.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                    }`}
                >
                  <div className="flex gap-3">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm font-semibold truncate ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                          }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap mr-2">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    {/* Delete Action */}
                    <button
                      onClick={(e) => handleDelete(e, notification.notification_id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all self-center"
                      title="حذف الإشعار"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {!notification.is_read && (
                    <span className="absolute top-4 left-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-center">
            <button
              onClick={() => {
                navigate(`/${userType}/notifications`);
                setIsOpen(false);
              }}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
            >
              عرض سجل الإشعارات
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
