import React, { useState, useEffect } from 'react';
import { useClientAuth } from '../../../hooks/useClientAuth';
import { clientApi } from '../../../services/clientApi';
import { getClientAppointments } from '../../../services/appointmentApi';
import StatsCards from './components/StatsCards';
import RecentActivity from './components/RecentActivity';
import QuickActions from './components/QuickActions';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { Calendar, Briefcase } from 'lucide-react';
import { formatDate } from '../../../utils/dateUtils';

const Dashboard = () => {
  const { userProfile } = useClientAuth();
  const [dashboardData, setDashboardData] = useState({
    summary: {
      activeCases: 0,
      upcomingAppointments: 0,
      unreadMessages: 0,
      balance: 0
    },
    activities: [],
    loading: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile?.user_id) return;

      try {
        setDashboardData(prev => ({ ...prev, loading: true }));

        // Fetch all dashboard data in parallel
        const [summary, activities, appointments] = await Promise.all([
          clientApi.getDashboardSummary(userProfile.user_id),
          clientApi.getRecentActivity(userProfile.user_id),
          getClientAppointments(userProfile.user_id)
        ]);

        // Count upcoming appointments
        const today = new Date().toISOString().split('T')[0];
        const upcomingCount = appointments?.filter(apt => 
          apt.appointment_date >= today && 
          apt.status !== 'completed' && 
          apt.status !== 'cancelled'
        ).length || 0;

        setDashboardData({
          summary: {
            ...summary,
            upcomingAppointments: upcomingCount
          } || {
            activeCases: 0,
            upcomingAppointments: upcomingCount,
            unreadMessages: 0,
            balance: 0
          },
          activities: activities || [],
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({ 
          ...prev, 
          summary: {
            activeCases: 0,
            upcomingAppointments: 0,
            unreadMessages: 0,
            balance: 0
          },
          activities: [],
          loading: false 
        }));
      }
    };

    fetchDashboardData();
  }, [userProfile]);

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            جاري تحميل لوحة التحكم...
          </p>
        </div>
      </div>
    );
  }


  // Ensure data is properly structured
  if (!dashboardData.summary) {
    dashboardData.summary = {
      activeCases: 0,
      upcomingAppointments: 0,
      unreadMessages: 0,
      balance: 0
    };
  }

  if (!dashboardData.activities) {
    dashboardData.activities = [];
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl shadow-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
              مرحباً، {userProfile?.first_name} {userProfile?.last_name}
            </h1>
            <p className="text-sm sm:text-base text-blue-100">
              إليك ملخص شامل لحسابك القانوني اليوم
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <div className="text-left sm:text-right bg-white/10 rounded-lg p-3 sm:bg-transparent sm:p-0">
              <p className="text-xs sm:text-sm text-blue-100">تاريخ اليوم</p>
              <p className="text-base sm:text-lg font-semibold">
                {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards 
        summary={dashboardData.summary} 
        loading={dashboardData.loading} 
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <RecentActivity 
            activities={dashboardData.activities} 
            loading={dashboardData.loading} 
          />
        </div>

        {/* Quick Actions - Takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>

      {/* Additional Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              المواعيد القادمة
            </h2>
            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold transition whitespace-nowrap">
              عرض الكل
            </button>
          </div>
          
          {dashboardData.summary?.upcomingAppointments > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Sample upcoming appointment */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 sm:space-x-reverse p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    استشارة مع المحامي أحمد محمد
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    غداً في 2:00 مساءً
                  </p>
                </div>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full whitespace-nowrap">
                  أونلاين
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                لا توجد مواعيد قادمة
              </p>
              <button 
                onClick={() => window.location.href = '/client/book-appointment/1'}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                احجز موعد
              </button>
            </div>
          )}
        </div>

        {/* Active Cases */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              القضايا النشطة
            </h2>
            <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold transition whitespace-nowrap">
              عرض الكل
            </button>
          </div>
          
          {dashboardData.summary?.activeCases > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Sample active case */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 sm:space-x-reverse p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                  <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    قضية الطلاق
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    آخر تحديث: منذ يومين
                  </p>
                </div>
                <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 px-2 py-1 rounded-full whitespace-nowrap">
                  نشطة
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                لا توجد قضايا نشطة
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
