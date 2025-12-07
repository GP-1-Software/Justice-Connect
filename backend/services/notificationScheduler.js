import { createClient } from "@supabase/supabase-js";
import { createNotification, NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from "./notificationService.js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Process scheduled notifications
 * This should be called every minute by a cron job
 */
export const processScheduledNotifications = async () => {
    try {
        const now = new Date().toISOString();
        
        // Get all pending notifications that should be sent now
        const { data: schedules, error } = await supabase
            .from('notification_schedules')
            .select('*')
            .eq('is_sent', false)
            .lte('scheduled_time', now)
            .order('scheduled_time', { ascending: true });

        if (error) {
            console.error('❌ Error fetching scheduled notifications:', error);
            return;
        }

        if (!schedules || schedules.length === 0) {
            return; // No notifications to send
        }

        console.log(`📬 Processing ${schedules.length} scheduled notifications...`);

        // Process each scheduled notification
        for (const schedule of schedules) {
            try {
                // Create the actual notification
                await createNotification({
                    userId: schedule.user_id,
                    userType: schedule.user_type,
                    title: schedule.title,
                    message: schedule.message,
                    type: schedule.notification_type,
                    relatedId: schedule.related_id,
                    relatedType: schedule.related_type,
                    priority: schedule.priority,
                    actionUrl: schedule.action_url
                });

                // Mark schedule as sent
                await supabase
                    .from('notification_schedules')
                    .update({
                        is_sent: true,
                        sent_at: new Date().toISOString()
                    })
                    .eq('schedule_id', schedule.schedule_id);

                console.log(`✅ Sent scheduled notification: ${schedule.title}`);
            } catch (notifError) {
                console.error(`❌ Error sending notification ${schedule.schedule_id}:`, notifError);
            }
        }

        console.log(`✅ Processed ${schedules.length} scheduled notifications`);
    } catch (error) {
        console.error('❌ Error in processScheduledNotifications:', error);
    }
};

/**
 * Schedule appointment reminders
 * Call this when an appointment is created or updated
 */
export const scheduleAppointmentReminders = async (appointment) => {
    try {
        const appointmentTime = new Date(appointment.appointment_date);
        const now = new Date();

        // Calculate reminder times
        const reminder24h = new Date(appointmentTime);
        reminder24h.setHours(reminder24h.getHours() - 24);

        const reminder1h = new Date(appointmentTime);
        reminder1h.setHours(reminder1h.getHours() - 1);

        const reminders = [];

        // 24-hour reminder (if appointment is more than 24 hours away)
        if (reminder24h > now) {
            reminders.push({
                user_id: appointment.client_id || appointment.lawyer_id,
                user_type: appointment.client_id ? 'client' : 'lawyer',
                notification_type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER_24H,
                title: 'تذكير بالموعد - غداً',
                message: `لديك موعد غداً في ${appointmentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
                scheduled_time: reminder24h.toISOString(),
                related_id: null, // UUID - stored in action_url instead
                related_type: 'appointment',
                priority: NOTIFICATION_PRIORITY.NORMAL,
                action_url: `/appointments/${appointment.appointment_id}`
            });

            // Also notify the other party
            reminders.push({
                user_id: appointment.client_id ? appointment.lawyer_id : appointment.client_id,
                user_type: appointment.client_id ? 'lawyer' : 'client',
                notification_type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER_24H,
                title: 'تذكير بالموعد - غداً',
                message: `لديك موعد غداً في ${appointmentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
                scheduled_time: reminder24h.toISOString(),
                related_id: null, // UUID - stored in action_url instead
                related_type: 'appointment',
                priority: NOTIFICATION_PRIORITY.NORMAL,
                action_url: `/appointments/${appointment.appointment_id}`
            });
        }

        // 1-hour reminder (if appointment is more than 1 hour away)
        if (reminder1h > now) {
            reminders.push({
                user_id: appointment.client_id || appointment.lawyer_id,
                user_type: appointment.client_id ? 'client' : 'lawyer',
                notification_type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER_1H,
                title: 'تذكير بالموعد - قريباً',
                message: `موعدك بعد ساعة واحدة في ${appointmentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
                scheduled_time: reminder1h.toISOString(),
                related_id: null, // UUID - stored in action_url instead
                related_type: 'appointment',
                priority: NOTIFICATION_PRIORITY.HIGH,
                action_url: `/appointments/${appointment.appointment_id}`
            });

            // Also notify the other party
            reminders.push({
                user_id: appointment.client_id ? appointment.lawyer_id : appointment.client_id,
                user_type: appointment.client_id ? 'lawyer' : 'client',
                notification_type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER_1H,
                title: 'تذكير بالموعد - قريباً',
                message: `موعدك بعد ساعة واحدة في ${appointmentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
                scheduled_time: reminder1h.toISOString(),
                related_id: null, // UUID - stored in action_url instead
                related_type: 'appointment',
                priority: NOTIFICATION_PRIORITY.HIGH,
                action_url: `/appointments/${appointment.appointment_id}`
            });
        }

        // "Now" notification (at appointment time)
        if (appointmentTime > now) {
            reminders.push({
                user_id: appointment.client_id || appointment.lawyer_id,
                user_type: appointment.client_id ? 'client' : 'lawyer',
                notification_type: NOTIFICATION_TYPES.APPOINTMENT_NOW,
                title: 'حان موعد اللقاء!',
                message: `موعدك الآن!`,
                scheduled_time: appointmentTime.toISOString(),
                related_id: null, // UUID - stored in action_url instead
                related_type: 'appointment',
                priority: NOTIFICATION_PRIORITY.URGENT,
                action_url: `/appointments/${appointment.appointment_id}`
            });

            // Also notify the other party
            reminders.push({
                user_id: appointment.client_id ? appointment.lawyer_id : appointment.client_id,
                user_type: appointment.client_id ? 'lawyer' : 'client',
                notification_type: NOTIFICATION_TYPES.APPOINTMENT_NOW,
                title: 'حان موعد اللقاء!',
                message: `موعدك الآن!`,
                scheduled_time: appointmentTime.toISOString(),
                related_id: null, // UUID - stored in action_url instead
                related_type: 'appointment',
                priority: NOTIFICATION_PRIORITY.URGENT,
                action_url: `/appointments/${appointment.appointment_id}`
            });
        }

        // Insert all reminders
        if (reminders.length > 0) {
            const { error } = await supabase
                .from('notification_schedules')
                .insert(reminders);

            if (error) {
                console.error('❌ Error scheduling appointment reminders:', error);
            } else {
                console.log(`✅ Scheduled ${reminders.length} appointment reminders`);
            }
        }
    } catch (error) {
        console.error('❌ Error in scheduleAppointmentReminders:', error);
    }
};

/**
 * Schedule meeting reminders (5 minutes before + when ready)
 * Call this when a meeting is created or confirmed
 */
export const scheduleMeetingReminders = async (meeting, clientId, lawyerId) => {
    try {
        const meetingTime = new Date(`${meeting.scheduled_date}T${meeting.scheduled_time}`);
        const now = new Date();

        // Calculate 5-minute reminder
        const reminder5min = new Date(meetingTime);
        reminder5min.setMinutes(reminder5min.getMinutes() - 5);

        const reminders = [];

        // 5-minute reminder for both client and lawyer
        if (reminder5min > now) {
            // Client reminder
            reminders.push({
                user_id: clientId,
                user_type: 'client',
                notification_type: 'MEETING_REMINDER_5MIN',
                title: 'الاجتماع قريباً',
                message: `الاجتماع سيبدأ بعد 5 دقائق`,
                scheduled_time: reminder5min.toISOString(),
                related_id: null, // UUID - stored in action_url instead
                related_type: 'meeting',
                priority: 'high',
                action_url: meeting.meeting_type === 'case' ? '/client/cases' : '/client/appointments'
            });

            // Lawyer reminder
            reminders.push({
                user_id: lawyerId,
                user_type: 'lawyer',
                notification_type: 'MEETING_REMINDER_5MIN',
                title: 'الاجتماع قريباً',
                message: `الاجتماع سيبدأ بعد 5 دقائق`,
                scheduled_time: reminder5min.toISOString(),
                related_id: null, // UUID - stored in action_url instead
                related_type: 'meeting',
                priority: 'high',
                action_url: meeting.meeting_type === 'case' ? '/lawyer/cases' : '/lawyer/appointments'
            });
        }

        // "Ready now" notification (at meeting time)
        if (meetingTime > now) {
            // Client notification
            reminders.push({
                user_id: clientId,
                user_type: 'client',
                notification_type: 'MEETING_READY',
                title: 'الاجتماع جاهز الآن',
                message: `يمكنك الانضمام للاجتماع الآن`,
                scheduled_time: meetingTime.toISOString(),
                related_id: null, // UUID - stored in action_url instead
                related_type: 'meeting',
                priority: 'urgent',
                action_url: meeting.meeting_type === 'case' ? '/client/cases' : '/client/appointments'
            });

            // Lawyer notification
            reminders.push({
                user_id: lawyerId,
                user_type: 'lawyer',
                notification_type: 'MEETING_READY',
                title: 'الاجتماع جاهز الآن',
                message: `يمكنك الانضمام للاجتماع الآن`,
                scheduled_time: meetingTime.toISOString(),
                related_id: null, // UUID - stored in action_url instead
                related_type: 'meeting',
                priority: 'urgent',
                action_url: meeting.meeting_type === 'case' ? '/lawyer/cases' : '/lawyer/appointments'
            });
        }

        // Insert all reminders
        if (reminders.length > 0) {
            const { error } = await supabase
                .from('notification_schedules')
                .insert(reminders);

            if (error) {
                console.error('❌ Error scheduling meeting reminders:', error);
            } else {
                console.log(`✅ Scheduled ${reminders.length} meeting reminders`);
            }
        }
    } catch (error) {
        console.error('❌ Error in scheduleMeetingReminders:', error);
    }
};

/**
 * Cancel scheduled notifications for an appointment
 * Call this when an appointment is cancelled or deleted
 */
export const cancelAppointmentReminders = async (appointmentId) => {
    try {
        const { error } = await supabase
            .from('notification_schedules')
            .delete()
            .eq('related_id', appointmentId)
            .eq('related_type', 'appointment')
            .eq('is_sent', false);

        if (error) {
            console.error('❌ Error cancelling appointment reminders:', error);
        } else {
            console.log(`✅ Cancelled reminders for appointment ${appointmentId}`);
        }
    } catch (error) {
        console.error('❌ Error in cancelAppointmentReminders:', error);
    }
};

/**
 * Start the notification scheduler (runs every minute)
 */
export const startNotificationScheduler = () => {
    console.log('🚀 Starting notification scheduler...');
    
    // Run immediately on start
    processScheduledNotifications();
    
    // Then run every minute
    setInterval(() => {
        processScheduledNotifications();
    }, 60 * 1000); // Every 60 seconds
};
