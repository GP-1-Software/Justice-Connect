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
      const { data: upcomingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_id')
        .eq('client_id', clientId)
        .eq('status', 'pending')
        .gte('datetime', new Date().toISOString());

      if (appointmentsError) throw appointmentsError;

      // Get unread messages count
      const { data: unreadMessages, error: messagesError } = await supabase
        .from('messages')
        .select('message_id')
        .eq('receiver_id', clientId)
        .eq('receiver_type', 'client')
        .eq('is_read', false);

      if (messagesError) throw messagesError;

      // Get balance from payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('client_id', clientId);

      if (paymentsError) throw paymentsError;

      // Calculate balance (paid - pending)
      const balance = payments.reduce((total, payment) => {
        if (payment.status === 'completed') {
          return total - payment.amount; // Subtract paid amounts
        }
        return total;
      }, 0);

      return {
        activeCases: activeCases?.length || 0,
        upcomingAppointments: upcomingAppointments?.length || 0,
        unreadMessages: unreadMessages?.length || 0,
        balance: Math.abs(balance) // Show positive balance
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
          cases!inner(case_id, title as case_title)
        `)
        .eq('cases.client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!eventsError && caseEvents) {
        caseEvents.forEach(event => {
          activities.push({
            id: event.event_id,
            type: 'case_update',
            title: event.title || event.event_type,
            description: event.description,
            caseTitle: event.cases?.case_title,
            timestamp: event.created_at,
            icon: 'file-text'
          });
        });
      }

      // Get recent appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          datetime,
          status,
          description,
          lawyers!inner(first_name, last_name)
        `)
        .eq('client_id', clientId)
        .order('datetime', { ascending: false })
        .limit(5);

      if (!appointmentsError && appointments) {
        appointments.forEach(appointment => {
          activities.push({
            id: appointment.appointment_id,
            type: 'appointment',
            title: `موعد مع ${appointment.lawyers?.first_name} ${appointment.lawyers?.last_name}`,
            description: appointment.description,
            timestamp: appointment.datetime,
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
          lawyers!inner(first_name, last_name)
        `)
        .eq('receiver_id', clientId)
        .eq('receiver_type', 'client')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!messagesError && messages) {
        messages.forEach(message => {
          activities.push({
            id: message.message_id,
            type: 'message',
            title: `رسالة من ${message.lawyers?.first_name} ${message.lawyers?.last_name}`,
            description: message.content,
            timestamp: message.created_at,
            icon: 'message-square'
          });
        });
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
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          datetime,
          type,
          status,
          description,
          lawyers!inner(
            lawyer_id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'pending')
        .gte('datetime', new Date().toISOString())
        .order('datetime', { ascending: true })
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



