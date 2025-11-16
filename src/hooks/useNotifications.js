import { useState, useEffect, useCallback } from 'react';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  subscribeToNotifications,
  subscribeToUnreadCount
} from '../services/notificationService';

/**
 * Hook for managing notifications with real-time updates
 */
export const useNotifications = (userId, userType, filters = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getUserNotifications(userId, userType, filters);
      if (fetchError) throw fetchError;
      setNotifications(data || []);
    } catch (err) {
      setError(err);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userType, JSON.stringify(filters)]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await getUnreadCount(userId, userType);
      setUnreadCount(data || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [userId, userType]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Subscribe to notifications
    const notifSubscription = subscribeToNotifications(userId, userType, (payload) => {
      console.log('Notification change:', payload);
      
      if (payload.eventType === 'INSERT') {
        // Add new notification to the list
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      } else if (payload.eventType === 'UPDATE') {
        // Update existing notification
        setNotifications(prev =>
          prev.map(notif =>
            notif.notification_id === payload.new.notification_id ? payload.new : notif
          )
        );
        // Refetch unread count
        fetchUnreadCount();
      } else if (payload.eventType === 'DELETE') {
        // Remove deleted notification
        setNotifications(prev =>
          prev.filter(notif => notif.notification_id !== payload.old.notification_id)
        );
        fetchUnreadCount();
      }
    });

    // Subscribe to unread count changes
    const countSubscription = subscribeToUnreadCount(userId, userType, (count) => {
      setUnreadCount(count);
    });

    return () => {
      notifSubscription.unsubscribe();
      countSubscription.unsubscribe();
    };
  }, [userId, userType, fetchNotifications, fetchUnreadCount]);

  // Mark notification as read
  const markRead = async (notificationId) => {
    try {
      const { error } = await markAsRead(notificationId);
      if (error) throw error;
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.notification_id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all as read
  const markAllRead = async () => {
    try {
      const { error } = await markAllAsRead(userId, userType);
      if (error) throw error;
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete notification
  const deleteNotif = async (notificationId) => {
    try {
      const { error } = await deleteNotification(notificationId);
      if (error) throw error;
      
      // Update local state
      setNotifications(prev =>
        prev.filter(notif => notif.notification_id !== notificationId)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Delete all read notifications
  const deleteAllReadNotifs = async () => {
    try {
      const { error } = await deleteAllRead(userId, userType);
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => prev.filter(notif => !notif.is_read));
    } catch (err) {
      console.error('Error deleting read notifications:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
    deleteNotif,
    deleteAllReadNotifs,
    refetch: fetchNotifications
  };
};

/**
 * Hook for unread notifications count only (lightweight)
 */
export const useUnreadCount = (userId, userType) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Initial fetch
    const fetchCount = async () => {
      const { data } = await getUnreadCount(userId, userType);
      setCount(data || 0);
    };

    fetchCount();

    // Subscribe to changes
    const subscription = subscribeToUnreadCount(userId, userType, (newCount) => {
      setCount(newCount);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, userType]);

  return count;
};
