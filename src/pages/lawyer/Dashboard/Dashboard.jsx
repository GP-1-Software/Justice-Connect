import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../hooks/useLawyerAuth';
import { supabase } from '../../../supabaseClient';
import { Briefcase, Calendar as CalendarIcon, FileText, Coins, Star } from 'lucide-react';
import WelcomeBanner from './components/WelcomeBanner';
import StatsCard from './components/StatsCard';
import QuickActions from './components/QuickActions';
import TodayAppointmentsList from './components/TodayAppointmentsList';
import PalestinianNews from '../../../components/common/PalestinianNews';

const Dashboard = () => {
  const { lawyer } = useLawyerAuth();
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    upcomingAppointments: 0,
    completedCases: 0,
    averageRating: 0,
    ratingsCount: 0
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

        // Fetch completed cases (fully executed - based on case_stage)
        const { count: completedCases } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_lawyer_id', lawyer.lawyer_id)
          .eq('case_stage', 'fully_executed');

        if (mounted) {
          // Calculate average rating
          const avgRating = lawyer.ratings_count > 0
            ? (lawyer.total_ratings_sum / lawyer.ratings_count).toFixed(1)
            : 0;

          setStats({
            totalCases: totalCases || 0,
            activeCases: activeCases || 0,
            upcomingAppointments: upcomingAppointments || 0,
            completedCases: completedCases || 0,
            averageRating: avgRating,
            ratingsCount: lawyer.ratings_count || 0
          });
        }
      } catch (error) {
        console.warn('Dashboard stats error:', error.message);
        if (mounted) {
          setStats({ totalCases: 0, activeCases: 0, upcomingAppointments: 0, completedCases: 0, averageRating: 0, ratingsCount: 0 });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadStats();
    return () => { mounted = false; };
  }, [lawyer]);

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
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

      {/* Rating Card - Compact */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2.5 sm:p-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 fill-yellow-500" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">تقييمك</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${star <= Math.round(stats.averageRating)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300 dark:text-gray-600'
                    }`}
                />
              ))}
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {stats.averageRating || '-'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({stats.ratingsCount})
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Palestinian Judiciary News */}
      <PalestinianNews limit={50} />

      {/* Today's Appointments - Removed as requested */}
      {/* <TodayAppointmentsList /> */}
    </div>
  );
};

export default Dashboard;


