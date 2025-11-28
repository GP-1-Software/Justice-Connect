import express from "express";
import { createClient } from "@supabase/supabase-js";
import {
    createNotification,
    createBulkNotifications,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    scheduleNotification,
    getUserPreferences,
    updateUserPreferences,
    NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITY
} from "../services/notificationService.js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

// Get all notifications for a user
router.get("/:userId/:userType", async (req, res) => {
    try {
        const { userId, userType } = req.params;
        const { limit, offset, unreadOnly } = req.query;

        const notifications = await getUserNotifications(
            parseInt(userId),
            userType,
            {
                limit: limit ? parseInt(limit) : 20,
                offset: offset ? parseInt(offset) : 0,
                unreadOnly: unreadOnly === 'true'
            }
        );

        res.json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get unread count
router.get("/:userId/:userType/count", async (req, res) => {
    try {
        const { userId, userType } = req.params;
        const count = await getUnreadCount(parseInt(userId), userType);
        res.json({ count });
    } catch (error) {
        console.error("Error getting unread count:", error);
        res.status(500).json({ error: error.message });
    }
});

// Create a notification
router.post("/create", async (req, res) => {
    try {
        const {
            userId,
            userType,
            title,
            message,
            type,
            relatedId,
            relatedType,
            priority,
            actionUrl
        } = req.body;

        // Validation
        if (!userId || !userType || !title || !message || !type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const notification = await createNotification({
            userId: parseInt(userId),
            userType,
            title,
            message,
            type,
            relatedId: relatedId ? parseInt(relatedId) : null,
            relatedType,
            priority: priority || NOTIFICATION_PRIORITY.NORMAL,
            actionUrl
        });

        res.json({ notification });
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: error.message });
    }
});

// Create bulk notifications
router.post("/create-bulk", async (req, res) => {
    try {
        const { notifications } = req.body;

        if (!notifications || !Array.isArray(notifications)) {
            return res.status(400).json({ error: "Invalid notifications array" });
        }

        const created = await createBulkNotifications(notifications);
        res.json({ notifications: created });
    } catch (error) {
        console.error("Error creating bulk notifications:", error);
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
router.put("/:notificationId/read", async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await markAsRead(parseInt(notificationId));
        res.json({ notification });
    } catch (error) {
        console.error("Error marking as read:", error);
        res.status(500).json({ error: error.message });
    }
});

// Update notification
router.put("/:notificationId/update", async (req, res) => {
    try {
        const { notificationId } = req.params;
        const updates = req.body;
        
        const { data, error } = await supabase
            .from('notifications')
            .update(updates)
            .eq('notification_id', parseInt(notificationId))
            .select()
            .single();

        if (error) throw error;
        res.json({ notification: data });
    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ error: error.message });
    }
});

// Mark all notifications as read
router.put("/:userId/:userType/read-all", async (req, res) => {
    try {
        const { userId, userType } = req.params;
        const notifications = await markAllAsRead(parseInt(userId), userType);
        res.json({ notifications, count: notifications.length });
    } catch (error) {
        console.error("Error marking all as read:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a notification
router.delete("/:notificationId", async (req, res) => {
    try {
        const { notificationId } = req.params;
        await deleteNotification(parseInt(notificationId));
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: error.message });
    }
});

// Delete all notifications
router.delete("/:userId/:userType/all", async (req, res) => {
    try {
        const { userId, userType } = req.params;
        await deleteAllNotifications(parseInt(userId), userType);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting all notifications:", error);
        res.status(500).json({ error: error.message });
    }
});

// Schedule a notification
router.post("/schedule", async (req, res) => {
    try {
        const {
            userId,
            userType,
            notificationType,
            title,
            message,
            scheduledTime,
            relatedId,
            relatedType,
            priority,
            actionUrl
        } = req.body;

        // Validation
        if (!userId || !userType || !notificationType || !title || !message || !scheduledTime) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const schedule = await scheduleNotification({
            userId: parseInt(userId),
            userType,
            notificationType,
            title,
            message,
            scheduledTime,
            relatedId: relatedId ? parseInt(relatedId) : null,
            relatedType,
            priority: priority || NOTIFICATION_PRIORITY.NORMAL,
            actionUrl
        });

        res.json({ schedule });
    } catch (error) {
        console.error("Error scheduling notification:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get user notification preferences
router.get("/:userId/:userType/preferences", async (req, res) => {
    try {
        const { userId, userType } = req.params;
        const preferences = await getUserPreferences(parseInt(userId), userType);
        res.json({ preferences });
    } catch (error) {
        console.error("Error fetching preferences:", error);
        res.status(500).json({ error: error.message });
    }
});

// Update user notification preferences
router.put("/:userId/:userType/preferences", async (req, res) => {
    try {
        const { userId, userType } = req.params;
        const preferences = req.body;

        const updated = await updateUserPreferences(
            parseInt(userId),
            userType,
            preferences
        );

        res.json({ preferences: updated });
    } catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({ error: error.message });
    }
});

// Export notification types and priorities for use in other routes
export { NOTIFICATION_TYPES, NOTIFICATION_PRIORITY };

export default router;
