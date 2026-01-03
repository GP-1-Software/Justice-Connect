import { supabase } from '../supabaseClient';

// Client Dashboard API Service
export const clientApi = {
  // Get dashboard summary data
  getDashboardSummary: async (clientId) => {
    try {
      // Get active cases count
      const { data: activeCases, error: casesError } = await supabase
        .from('cases')
        .select('case_id')
        .eq('client_id', clientId)
        .eq('status', 'active');

      if (casesError) throw casesError;

      // Get upcoming appointments count
      const today = new Date().toISOString().split('T')[0];
      const { data: upcomingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', clientId)
        .in('status', ['pending', 'confirmed'])
        .gte('appointment_date', today);

      if (appointmentsError) throw appointmentsError;

      // Get unread messages count
      const { data: unreadMessages, error: messagesError } = await supabase
        .from('messages')
        .select('message_id')
        .eq('receiver_id', clientId)
        .eq('receiver_type', 'client')
        .eq('is_read', false);

      if (messagesError) throw messagesError;

      return {
        activeCases: activeCases?.length || 0,
        upcomingAppointments: upcomingAppointments?.length || 0,
        unreadMessages: unreadMessages?.length || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  },

  // Get recent activity (last 10 activities across cases, appointments, messages)
  getRecentActivity: async (clientId) => {
    try {
      const activities = [];

      // Get recent case updates
      const { data: caseEvents, error: eventsError } = await supabase
        .from('timeline_events')
        .select(`
          event_id,
          event_type,
          title,
          description,
          created_at,
          case_id,
          cases(case_id, title, client_id)
        `)
        .not('case_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!eventsError && caseEvents) {
        // Filter events for this client's cases
        const clientEvents = caseEvents.filter(event =>
          event.cases && event.cases.client_id === clientId
        );

        clientEvents.slice(0, 5).forEach(event => {
          activities.push({
            id: event.event_id,
            type: 'case_update',
            title: event.title || event.event_type,
            description: event.description,
            caseTitle: event.cases?.title,
            timestamp: event.created_at,
            icon: 'file-text'
          });
        });
      }

      // Get recent appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          appointment_type,
          lawyers!inner(first_name, last_name)
        `)
        .eq('client_id', clientId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
        .limit(5);

      if (!appointmentsError && appointments) {
        appointments.forEach(appointment => {
          const timestamp = `${appointment.appointment_date}T${appointment.appointment_time}`;
          activities.push({
            id: appointment.id,
            type: 'appointment',
            title: `موعد مع ${appointment.lawyers?.first_name} ${appointment.lawyers?.last_name}`,
            description: appointment.appointment_type || 'موعد',
            timestamp: timestamp,
            status: appointment.status,
            icon: 'calendar'
          });
        });
      }

      // Get recent messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          message_id,
          content,
          created_at,
          sender_id,
          sender_type
        `)
        .eq('receiver_id', clientId)
        .eq('receiver_type', 'client')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!messagesError && messages) {
        // Fetch sender details for each message
        for (const message of messages) {
          let senderName = 'Unknown';

          if (message.sender_type === 'lawyer') {
            const { data: lawyer } = await supabase
              .from('lawyers')
              .select('first_name, last_name')
              .eq('lawyer_id', message.sender_id)
              .single();

            if (lawyer) {
              senderName = `${lawyer.first_name} ${lawyer.last_name}`;
            }
          }

          activities.push({
            id: message.message_id,
            type: 'message',
            title: `رسالة من ${senderName}`,
            description: message.content,
            timestamp: message.created_at,
            icon: 'message-square'
          });
        }
      }

      // Sort all activities by timestamp and return top 10
      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  },

  // Get upcoming appointments with details
  getUpcomingAppointments: async (clientId, limit = 5) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          appointment_type,
          status,
          duration_minutes,
          lawyers!inner(
            lawyer_id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('client_id', clientId)
        .in('status', ['pending', 'confirmed'])
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  },

  // Get active cases summary
  getActiveCases: async (clientId, limit = 5) => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          case_id,
          title,
          case_type,
          status,
          priority,
          created_at,
          updated_at,
          lawyers!inner(
            lawyer_id,
            first_name,
            last_name
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active cases:', error);
      throw error;
    }
  },

  // Get notifications for client
  getNotifications: async (clientId, limit = 5) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', clientId)
        .eq('user_type', 'client')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }
};



