// src/services/analyticsApi.js
import { supabase } from '../supabaseClient';

/**
 * Get overall platform statistics
 */
export const getOverallStats = async () => {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get total lawyers count
    const { count: totalLawyers, error: lawyersError } = await supabase
      .from('lawyers')
      .select('*', { count: 'exact', head: true });

    if (lawyersError) throw lawyersError;

    // Get total cases count
    const { count: totalCases, error: casesError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    if (casesError) throw casesError;

    // Get total appointments count
    const { count: totalAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    if (appointmentsError) throw appointmentsError;

    // Get pending users count
    const { count: pendingUsers, error: pendingUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'pending');

    if (pendingUsersError) throw pendingUsersError;

    // Get pending lawyers count
    const { count: pendingLawyers, error: pendingLawyersError } = await supabase
      .from('lawyers')
      .select('*', { count: 'exact', head: true })
      .eq('account_status', 'pending');

    if (pendingLawyersError) throw pendingLawyersError;

    // Get active cases count
    const { count: activeCases, error: activeCasesError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    if (activeCasesError) throw activeCasesError;

    // Get today's appointments count
    const today = new Date().toISOString().split('T')[0];
    const { count: todayAppointments, error: todayAppointmentsError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', today)
      .lt('appointment_date', `${today}T23:59:59`);

    if (todayAppointmentsError) throw todayAppointmentsError;

    return {
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalLawyers: totalLawyers || 0,
        totalCases: totalCases || 0,
        totalAppointments: totalAppointments || 0,
        pendingUsers: pendingUsers || 0,
        pendingLawyers: pendingLawyers || 0,
        activeCases: activeCases || 0,
        todayAppointments: todayAppointments || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get users growth data for the last 30 days
 */
export const getUsersGrowthData = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get users created in the last 30 days
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (usersError) throw usersError;

    // Get lawyers created in the last 30 days
    const { data: lawyers, error: lawyersError } = await supabase
      .from('lawyers')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (lawyersError) throw lawyersError;

    // Group by date
    const groupedData = {};
    
    // Process users
    users?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = { date, users: 0, lawyers: 0 };
      }
      groupedData[date].users += 1;
    });

    // Process lawyers
    lawyers?.forEach(lawyer => {
      const date = new Date(lawyer.created_at).toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = { date, users: 0, lawyers: 0 };
      }
      groupedData[date].lawyers += 1;
    });

    // Convert to array and sort
    const chartData = Object.values(groupedData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    return {
      success: true,
      data: chartData,
    };
  } catch (error) {
    console.error('Error fetching users growth data:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get users distribution by city
 */
export const getUsersByCityData = async () => {
  try {
    // Get users by city
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('city');

    if (usersError) throw usersError;

    // Get lawyers by city
    const { data: lawyers, error: lawyersError } = await supabase
      .from('lawyers')
      .select('city');

    if (lawyersError) throw lawyersError;

    // Count by city
    const cityCount = {};
    
    users?.forEach(user => {
      const city = user.city || 'غير محدد';
      cityCount[city] = (cityCount[city] || 0) + 1;
    });

    lawyers?.forEach(lawyer => {
      const city = lawyer.city || 'غير محدد';
      cityCount[city] = (cityCount[city] || 0) + 1;
    });

    // Convert to array and sort by count
    const chartData = Object.entries(cityCount)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 cities

    return {
      success: true,
      data: chartData,
    };
  } catch (error) {
    console.error('Error fetching users by city data:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get cases statistics by status
 */
export const getCasesStatusData = async () => {
  try {
    const { data: cases, error } = await supabase
      .from('cases')
      .select('status');

    if (error) throw error;

    // Count by status
    const statusCount = {
      open: 0,
      in_progress: 0,
      closed: 0,
      pending: 0,
    };

    cases?.forEach(caseItem => {
      const status = caseItem.status || 'pending';
      if (statusCount.hasOwnProperty(status)) {
        statusCount[status] += 1;
      }
    });

    // Convert to array
    const chartData = [
      { name: 'مفتوحة', value: statusCount.open, color: '#3b82f6' },
      { name: 'قيد المعالجة', value: statusCount.in_progress, color: '#f59e0b' },
      { name: 'مغلقة', value: statusCount.closed, color: '#10b981' },
      { name: 'معلقة', value: statusCount.pending, color: '#6b7280' },
    ];

    return {
      success: true,
      data: chartData,
    };
  } catch (error) {
    console.error('Error fetching cases status data:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get top active lawyers
 */
export const getTopLawyers = async () => {
  try {
    // Get all cases with lawyer info
    const { data: cases, error } = await supabase
      .from('cases')
      .select(`
        lawyer_id,
        lawyers (
          first_name,
          last_name,
          specialization
        )
      `);

    if (error) throw error;

    // Count cases per lawyer
    const lawyerCases = {};
    
    cases?.forEach(caseItem => {
      if (caseItem.lawyer_id && caseItem.lawyers) {
        const lawyerId = caseItem.lawyer_id;
        if (!lawyerCases[lawyerId]) {
          lawyerCases[lawyerId] = {
            name: `${caseItem.lawyers.first_name} ${caseItem.lawyers.last_name}`,
            specialization: caseItem.lawyers.specialization,
            cases: 0,
          };
        }
        lawyerCases[lawyerId].cases += 1;
      }
    });

    // Convert to array and sort
    const chartData = Object.values(lawyerCases)
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 10); // Top 10 lawyers

    return {
      success: true,
      data: chartData,
    };
  } catch (error) {
    console.error('Error fetching top lawyers:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get appointments statistics for the last 7 days
 */
export const getAppointmentsWeekData = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('appointment_date, status')
      .gte('appointment_date', sevenDaysAgo.toISOString())
      .order('appointment_date', { ascending: true });

    if (error) throw error;

    // Group by date and status
    const groupedData = {};
    
    appointments?.forEach(appointment => {
      const date = new Date(appointment.appointment_date).toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = { 
          date, 
          confirmed: 0, 
          completed: 0, 
          cancelled: 0 
        };
      }
      
      const status = appointment.status || 'confirmed';
      if (groupedData[date].hasOwnProperty(status)) {
        groupedData[date][status] += 1;
      }
    });

    // Convert to array and sort
    const chartData = Object.values(groupedData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    return {
      success: true,
      data: chartData,
    };
  } catch (error) {
    console.error('Error fetching appointments week data:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get account approval statistics
 */
export const getApprovalStats = async () => {
  try {
    // Users stats
    const { data: usersStats, error: usersError } = await supabase
      .from('users')
      .select('account_status');

    if (usersError) throw usersError;

    // Lawyers stats
    const { data: lawyersStats, error: lawyersError } = await supabase
      .from('lawyers')
      .select('account_status');

    if (lawyersError) throw lawyersError;

    // Count statuses
    const stats = {
      users: { pending: 0, approved: 0, rejected: 0 },
      lawyers: { pending: 0, approved: 0, rejected: 0 },
    };

    usersStats?.forEach(user => {
      const status = user.account_status || 'pending';
      if (stats.users.hasOwnProperty(status)) {
        stats.users[status] += 1;
      }
    });

    lawyersStats?.forEach(lawyer => {
      const status = lawyer.account_status || 'pending';
      if (stats.lawyers.hasOwnProperty(status)) {
        stats.lawyers[status] += 1;
      }
    });

    // Calculate approval rates
    const totalUsers = stats.users.pending + stats.users.approved + stats.users.rejected;
    const totalLawyers = stats.lawyers.pending + stats.lawyers.approved + stats.lawyers.rejected;

    const usersApprovalRate = totalUsers > 0 
      ? ((stats.users.approved / totalUsers) * 100).toFixed(1)
      : 0;

    const lawyersApprovalRate = totalLawyers > 0
      ? ((stats.lawyers.approved / totalLawyers) * 100).toFixed(1)
      : 0;

    return {
      success: true,
      data: {
        stats,
        usersApprovalRate,
        lawyersApprovalRate,
      },
    };
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
