import { supabase } from '../supabaseClient';

/**
 * Notification Service - Handles all notification operations with real-time updates
 */

// =====================================================
// Notification CRUD Operations
// =====================================================

/**
 * Create a new notification
 */
export const createNotification = async (notificationData) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId, userType, filters = {}) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: null, error };
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (userId, userType) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_read', false);

    if (error) throw error;
    return { data: count, error: null };
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return { data: 0, error };
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('notification_id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId, userType) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_read', false)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error marking all as read:', error);
    return { data: null, error };
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('notification_id', notificationId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { error };
  }
};

/**
 * Delete all read notifications
 */
export const deleteAllRead = async (userId, userType) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_read', true);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    return { error };
  }
};

// =====================================================
// Specific Notification Creators
// =====================================================

/**
 * Create invoice notification
 */
export const notifyInvoiceCreated = async (clientId, invoiceNumber, invoiceId) => {
  return createNotification({
    user_id: clientId,
    user_type: 'client',
    title: 'فاتورة جديدة',
    message: `تم إنشاء فاتورة جديدة رقم ${invoiceNumber}`,
    type: 'invoice_created',
    related_id: invoiceId,
    related_type: 'invoice'
  });
};

/**
 * Create payment received notification
 */
export const notifyPaymentReceived = async (lawyerId, invoiceNumber, amount, invoiceId) => {
  return createNotification({
    user_id: lawyerId,
    user_type: 'lawyer',
    title: 'تم استلام دفعة',
    message: `تم دفع الفاتورة رقم ${invoiceNumber} بمبلغ ${amount} دينار`,
    type: 'payment_received',
    related_id: invoiceId,
    related_type: 'invoice'
  });
};

/**
 * Create payment confirmed notification
 */
export const notifyPaymentConfirmed = async (clientId, invoiceNumber, invoiceId) => {
  return createNotification({
    user_id: clientId,
    user_type: 'client',
    title: 'تم تأكيد الدفع',
    message: `تم تأكيد دفع الفاتورة رقم ${invoiceNumber}`,
    type: 'payment_confirmed',
    related_id: invoiceId,
    related_type: 'invoice'
  });
};

/**
 * Create invoice overdue notification
 */
export const notifyInvoiceOverdue = async (clientId, invoiceNumber, invoiceId) => {
  return createNotification({
    user_id: clientId,
    user_type: 'client',
    title: 'فاتورة متأخرة',
    message: `الفاتورة رقم ${invoiceNumber} متأخرة. يرجى الدفع في أقرب وقت`,
    type: 'invoice_overdue',
    related_id: invoiceId,
    related_type: 'invoice'
  });
};

/**
 * Create invoice reminder notification
 */
export const notifyInvoiceReminder = async (clientId, invoiceNumber, dueDate, invoiceId) => {
  return createNotification({
    user_id: clientId,
    user_type: 'client',
    title: 'تذكير بفاتورة',
    message: `تذكير: الفاتورة رقم ${invoiceNumber} مستحقة في ${dueDate}`,
    type: 'invoice_reminder',
    related_id: invoiceId,
    related_type: 'invoice'
  });
};

/**
 * Create invoice cancelled notification
 */
export const notifyInvoiceCancelled = async (clientId, invoiceNumber, invoiceId) => {
  return createNotification({
    user_id: clientId,
    user_type: 'client',
    title: 'فاتورة ملغاة',
    message: `تم إلغاء الفاتورة رقم ${invoiceNumber}`,
    type: 'invoice_cancelled',
    related_id: invoiceId,
    related_type: 'invoice'
  });
};

// =====================================================
// Real-time Subscriptions
// =====================================================

/**
 * Subscribe to user notifications
 */
export const subscribeToNotifications = (userId, userType, callback) => {
  const subscription = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to unread count changes
 */
export const subscribeToUnreadCount = (userId, userType, callback) => {
  const subscription = supabase
    .channel(`unread-count-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        const { data } = await getUnreadCount(userId, userType);
        callback(data);
      }
    )
    .subscribe();

  return subscription;
};

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get notification icon based on type
 */
export const getNotificationIcon = (type) => {
  const icons = {
    invoice_created: '📄',
    invoice_paid: '✅',
    payment_received: '💰',
    payment_confirmed: '✓',
    invoice_overdue: '⚠️',
    invoice_reminder: '🔔',
    invoice_cancelled: '❌',
    appointment_created: '📅',
    appointment_confirmed: '✓',
    case_updated: '📋',
    message_received: '💬'
  };
  return icons[type] || '📢';
};

/**
 * Get notification color based on type
 */
export const getNotificationColor = (type) => {
  const colors = {
    invoice_created: 'blue',
    invoice_paid: 'green',
    payment_received: 'green',
    payment_confirmed: 'green',
    invoice_overdue: 'red',
    invoice_reminder: 'yellow',
    invoice_cancelled: 'gray',
    appointment_created: 'blue',
    appointment_confirmed: 'green',
    case_updated: 'blue',
    message_received: 'purple'
  };
  return colors[type] || 'gray';
};

/**
 * Format notification time (relative)
 */
export const formatNotificationTime = (timestamp) => {
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
  
  return notifTime.toLocaleDateString('ar-SA');
};
