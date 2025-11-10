import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../hooks/useLawyerAuth';
import { supabase } from '../../../supabaseClient';
import { Briefcase, Calendar as CalendarIcon, FileText, Coins } from 'lucide-react';
import WelcomeBanner from './components/WelcomeBanner';
import StatsCard from './components/StatsCard';
import QuickActions from './components/QuickActions';
import CalendarPreview from './components/CalendarPreview';
import TodayAppointmentsList from './components/TodayAppointmentsList';
import CasesAssigned from './components/CasesAssigned';
import QuickRevenue from './components/QuickRevenue';

const Dashboard = () => {
  const { lawyer } = useLawyerAuth();
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    upcomingAppointments: 0,
    completedCases: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      if (!lawyer) return;
      setLoading(true);
      try {
        // Fetch total cases
        const { count: totalCases } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_lawyer_id', lawyer.lawyer_id);

        // Fetch active cases
        const { count: activeCases } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_lawyer_id', lawyer.lawyer_id)
          .eq('status', 'active');

        // Fetch upcoming appointments
        const { count: upcomingAppointments } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('lawyer_id', lawyer.lawyer_id)
          .gte('appointment_date', new Date().toISOString().split('T')[0])
          .in('status', ['pending', 'confirmed']);

        // Fetch completed cases
        const { count: completedCases } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_lawyer_id', lawyer.lawyer_id)
          .eq('status', 'completed');

        if (mounted) {
          setStats({
            totalCases: totalCases || 0,
            activeCases: activeCases || 0,
            upcomingAppointments: upcomingAppointments || 0,
            completedCases: completedCases || 0
          });
        }
      } catch (error) {
        console.warn('Dashboard stats error:', error.message);
        if (mounted) {
          setStats({ totalCases: 0, activeCases: 0, upcomingAppointments: 0, completedCases: 0 });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadStats();
    return () => { mounted = false; };
  }, [lawyer]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          icon={Briefcase}
          label="إجمالي القضايا"
          value={stats.totalCases}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatsCard
          icon={FileText}
          label="القضايا النشطة"
          value={stats.activeCases}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600"
          loading={loading}
        />
        <StatsCard
          icon={CalendarIcon}
          label="المواعيد القادمة"
          value={stats.upcomingAppointments}
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600"
          loading={loading}
        />
        <StatsCard
          icon={Coins}
          label="القضايا المنجزة"
          value={stats.completedCases}
          iconBgColor="bg-orange-100 dark:bg-orange-900/30"
          iconColor="text-orange-600"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Revenue and Calendar Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <CalendarPreview />
        </div>
        <div className="lg:col-span-1">
          <QuickRevenue />
        </div>
      </div>

      {/* Today's Appointments and Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <TodayAppointmentsList />
        <CasesAssigned />
      </div>
    </div>
  );
};

export default Dashboard;


