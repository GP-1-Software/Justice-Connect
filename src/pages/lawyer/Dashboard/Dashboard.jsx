import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLawyerAuth } from '../../../hooks/useLawyerAuth';
import { supabase } from '../../../supabaseClient';
import { Briefcase, Calendar as CalendarIcon, FileText, DollarSign } from 'lucide-react';
import WelcomeBanner from './components/WelcomeBanner';
import StatsCard from './components/StatsCard';
import QuickActions from './components/QuickActions';
import CalendarPreview from './components/CalendarPreview';
import TodayAppointmentsList from './components/TodayAppointmentsList';
import CasesAssigned from './components/CasesAssigned';
import QuickRevenue from './components/QuickRevenue';

const Dashboard = () => {
  const { t } = useTranslation();
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
          .in('status', ['active', 'in_progress', 'pending']);

        // Fetch upcoming appointments
        const { count: upcomingAppointments } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('lawyer_id', lawyer.lawyer_id)
          .gte('appointment_date', new Date().toISOString().split('T')[0])
          .in('status', ['scheduled', 'confirmed']);

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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Briefcase}
          label={t('dashboard.totalCases') || 'إجمالي القضايا'}
          value={stats.totalCases}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatsCard
          icon={FileText}
          label={t('dashboard.activeCases') || 'القضايا النشطة'}
          value={stats.activeCases}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600"
          loading={loading}
        />
        <StatsCard
          icon={CalendarIcon}
          label={t('dashboard.upcomingAppointments') || 'المواعيد القادمة'}
          value={stats.upcomingAppointments}
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600"
          loading={loading}
        />
        <StatsCard
          icon={DollarSign}
          label={t('dashboard.completedCases') || 'القضايا المنجزة'}
          value={stats.completedCases}
          iconBgColor="bg-orange-100 dark:bg-orange-900/30"
          iconColor="text-orange-600"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Revenue and Calendar Preview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CalendarPreview />
        </div>
        <div>
          <QuickRevenue />
        </div>
      </div>

      {/* Today's Appointments and Cases */}
      <div className="grid md:grid-cols-2 gap-6">
        <TodayAppointmentsList />
        <CasesAssigned />
      </div>
    </div>
  );
};

export default Dashboard;


