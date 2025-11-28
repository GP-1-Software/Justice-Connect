import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Notification Types
export const NOTIFICATION_TYPES = {
    // Messages
    NEW_MESSAGE: 'new_message',
    
    // Cases
    CASE_CREATED: 'case_created',
    CASE_UPDATED: 'case_updated',
    CASE_STATUS_CHANGED: 'case_status_changed',
    CASE_ASSIGNED: 'case_assigned',
    CASE_REQUEST: 'case_request',
    
    // Appointments
    APPOINTMENT_CREATED: 'appointment_created',
    APPOINTMENT_UPDATED: 'appointment_updated',
    APPOINTMENT_CANCELLED: 'appointment_cancelled',
    APPOINTMENT_REQUEST: 'appointment_request',
    APPOINTMENT_REMINDER_1H: 'appointment_reminder_1h',
    APPOINTMENT_REMINDER_24H: 'appointment_reminder_24h',
    APPOINTMENT_NOW: 'appointment_now',
    
    // Payments
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_PENDING: 'payment_pending',
    INVOICE_CREATED: 'invoice_created',
    
    // System
    SYSTEM_ANNOUNCEMENT: 'system_announcement',
    ACCOUNT_VERIFIED: 'account_verified',
    
    // Support
    SUPPORT_TICKET_REPLY: 'support_ticket_reply'
};

// Priority Levels
export const NOTIFICATION_PRIORITY = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
};

// Icons for each notification type
const NOTIFICATION_ICONS = {
    [NOTIFICATION_TYPES.NEW_MESSAGE]: 'message',
    [NOTIFICATION_TYPES.CASE_CREATED]: 'briefcase',
    [NOTIFICATION_TYPES.CASE_UPDATED]: 'edit',
    [NOTIFICATION_TYPES.CASE_STATUS_CHANGED]: 'refresh',
    [NOTIFICATION_TYPES.CASE_ASSIGNED]: 'user-plus',
    [NOTIFICATION_TYPES.CASE_REQUEST]: 'file-text',
    [NOTIFICATION_TYPES.APPOINTMENT_CREATED]: 'calendar-plus',
    [NOTIFICATION_TYPES.APPOINTMENT_UPDATED]: 'calendar-edit',
    [NOTIFICATION_TYPES.APPOINTMENT_CANCELLED]: 'calendar-x',
    [NOTIFICATION_TYPES.APPOINTMENT_REQUEST]: 'calendar-check',
    [NOTIFICATION_TYPES.APPOINTMENT_REMINDER_1H]: 'clock',
    [NOTIFICATION_TYPES.APPOINTMENT_REMINDER_24H]: 'bell',
    [NOTIFICATION_TYPES.APPOINTMENT_NOW]: 'alarm',
    [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: 'dollar-sign',
    [NOTIFICATION_TYPES.PAYMENT_PENDING]: 'credit-card',
    [NOTIFICATION_TYPES.INVOICE_CREATED]: 'file-invoice',
    [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: 'megaphone',
    [NOTIFICATION_TYPES.ACCOUNT_VERIFIED]: 'check-circle',
    [NOTIFICATION_TYPES.SUPPORT_TICKET_REPLY]: 'help-circle'
};

/**
 * Create a notification
 */
export const createNotification = async ({
    userId,
    userType,
    title,
    message,
    type,
    relatedId = null,
    relatedType = null,
    priority = NOTIFICATION_PRIORITY.NORMAL,
    actionUrl = null
}) => {
    try {
        const icon = NOTIFICATION_ICONS[type] || 'bell';
        
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                user_type: userType,
                title,
                message,
                type,
                related_id: relatedId,
                related_type: relatedType,
                priority,
                action_url: actionUrl,
                icon
            })
            .select()
            .single();

        if (error) throw error;
        
        console.log(`✅ Notification created for ${userType} ${userId}: ${title}`);
        return data;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        throw error;
    }
};

/**
 * Create notification for multiple users
 */
export const createBulkNotifications = async (notifications) => {
    try {
        const notificationsWithIcons = notifications.map(notif => ({
            ...notif,
            icon: NOTIFICATION_ICONS[notif.type] || 'bell'
        }));

        const { data, error } = await supabase
            .from('notifications')
            .insert(notificationsWithIcons)
            .select();

        if (error) throw error;
        
        console.log(`✅ ${data.length} notifications created`);
        return data;
    } catch (error) {
        console.error('❌ Error creating bulk notifications:', error);
        throw error;
    }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId, userType, { limit = 20, offset = 0, unreadOnly = false } = {}) => {
    try {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('user_type', userType)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        throw error;
    }
};

/**
 * Get unread notification count
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
        return count || 0;
    } catch (error) {
        console.error('❌ Error getting unread count:', error);
        throw error;
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
        return data;
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications as read for a user
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
        console.log(`✅ Marked ${data.length} notifications as read`);
        return data;
    } catch (error) {
        console.error('❌ Error marking all as read:', error);
        throw error;
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
        console.log(`✅ Notification ${notificationId} deleted`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting notification:', error);
        throw error;
    }
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (userId, userType) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId)
            .eq('user_type', userType);

        if (error) throw error;
        console.log(`✅ All notifications deleted for ${userType} ${userId}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting all notifications:', error);
        throw error;
    }
};

/**
 * Schedule a notification for later
 */
export const scheduleNotification = async ({
    userId,
    userType,
    notificationType,
    title,
    message,
    scheduledTime,
    relatedId = null,
    relatedType = null,
    priority = NOTIFICATION_PRIORITY.NORMAL,
    actionUrl = null
}) => {
    try {
        const icon = NOTIFICATION_ICONS[notificationType] || 'bell';

        const { data, error } = await supabase
            .from('notification_schedules')
            .insert({
                user_id: userId,
                user_type: userType,
                notification_type: notificationType,
                title,
                message,
                related_id: relatedId,
                related_type: relatedType,
                scheduled_time: scheduledTime,
                priority,
                action_url: actionUrl,
                icon
            })
            .select()
            .single();

        if (error) throw error;
        
        console.log(`✅ Notification scheduled for ${scheduledTime}`);
        return data;
    } catch (error) {
        console.error('❌ Error scheduling notification:', error);
        throw error;
    }
};

/**
 * Get user notification preferences
 */
export const getUserPreferences = async (userId, userType) => {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .eq('user_type', userType)
            .single();

        // If no preferences exist, create default ones
        if (error && error.code === 'PGRST116') {
            return await createDefaultPreferences(userId, userType);
        }

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error fetching preferences:', error);
        throw error;
    }
};

/**
 * Create default notification preferences
 */
const createDefaultPreferences = async (userId, userType) => {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .insert({
                user_id: userId,
                user_type: userType,
                enable_message_notifications: true,
                enable_case_notifications: true,
                enable_appointment_notifications: true,
                enable_payment_notifications: true,
                enable_reminder_notifications: true,
                enable_sound: true
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('❌ Error creating default preferences:', error);
        throw error;
    }
};

/**
 * Update user notification preferences
 */
export const updateUserPreferences = async (userId, userType, preferences) => {
    try {
        const { data, error } = await supabase
            .from('notification_preferences')
            .update({
                ...preferences,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('user_type', userType)
            .select()
            .single();

        if (error) throw error;
        console.log(`✅ Preferences updated for ${userType} ${userId}`);
        return data;
    } catch (error) {
        console.error('❌ Error updating preferences:', error);
        throw error;
    }
};
