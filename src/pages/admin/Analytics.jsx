// src/pages/admin/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import StatCard from '../../components/admin/analytics/StatCard';
import UsersGrowthChart from '../../components/admin/analytics/UsersGrowthChart';
import CityDistributionChart from '../../components/admin/analytics/CityDistributionChart';
import CasesStatusChart from '../../components/admin/analytics/CasesStatusChart';
import TopLawyersChart from '../../components/admin/analytics/TopLawyersChart';
import {
  getOverallStats,
  getUsersGrowthData,
  getUsersByCityData,
  getCasesStatusData,
  getTopLawyers,
  getApprovalStats,
} from '../../services/analyticsApi';
import {
  Users,
  Briefcase,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  BarChart3,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

const Analytics = () => {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats state
  const [overallStats, setOverallStats] = useState(null);
  const [usersGrowthData, setUsersGrowthData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [casesStatusData, setCasesStatusData] = useState([]);
  const [topLawyersData, setTopLawyersData] = useState([]);
  const [approvalStats, setApprovalStats] = useState(null);

  // Check authentication
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (!userData.role || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      navigate('/');
      return;
    }

    setCurrentAdmin(userData);
    fetchAllData();
  }, [navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        overallResult,
        growthResult,
        cityResult,
        casesResult,
        lawyersResult,
        approvalResult,
      ] = await Promise.all([
        getOverallStats(),
        getUsersGrowthData(),
        getUsersByCityData(),
        getCasesStatusData(),
        getTopLawyers(),
        getApprovalStats(),
      ]);

      if (overallResult.success) setOverallStats(overallResult.data);
      if (growthResult.success) setUsersGrowthData(growthResult.data);
      if (cityResult.success) setCityData(cityResult.data);
      if (casesResult.success) setCasesStatusData(casesResult.data);
      if (lawyersResult.success) setTopLawyersData(lawyersResult.data);
      if (approvalResult.success) setApprovalStats(approvalResult.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-16 sm:pt-20 px-3 sm:px-4 lg:px-6 py-6 sm:py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse mb-2">
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center space-x-1 sm:space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">رجوع</span>
                  </Link>
                  <span className="text-gray-400 dark:text-gray-600">|</span>
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                    لوحة الإحصائيات والتحليلات
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mr-8 sm:mr-0">
                  نظرة شاملة على أداء المنصة والإحصائيات المهمة
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>
          </div>

          {/* Overall Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="إجمالي المستخدمين"
              value={overallStats?.totalUsers}
              icon={Users}
              color="blue"
              subtitle={`${overallStats?.pendingUsers || 0} في الانتظار`}
              loading={loading}
            />
            <StatCard
              title="إجمالي المحامين"
              value={overallStats?.totalLawyers}
              icon={Briefcase}
              color="purple"
              subtitle={`${overallStats?.pendingLawyers || 0} في الانتظار`}
              loading={loading}
            />
            <StatCard
              title="إجمالي القضايا"
              value={overallStats?.totalCases}
              icon={FileText}
              color="green"
              subtitle={`${overallStats?.activeCases || 0} قضية نشطة`}
              loading={loading}
            />
            <StatCard
              title="إجمالي المواعيد"
              value={overallStats?.totalAppointments}
              icon={Calendar}
              color="orange"
              subtitle={`${overallStats?.todayAppointments || 0} موعد اليوم`}
              loading={loading}
            />
          </div>

          {/* Approval Rate Cards */}
          {approvalStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse mb-3 sm:mb-4">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    معدل قبول المستخدمين
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
                  <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                    {approvalStats.usersApprovalRate}%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 sm:mb-2 space-y-1">
                    <div>✓ مقبول: {approvalStats.stats.users.approved}</div>
                    <div>✗ مرفوض: {approvalStats.stats.users.rejected}</div>
                    <div>⏳ معلق: {approvalStats.stats.users.pending}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse mb-3 sm:mb-4">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    معدل قبول المحامين
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
                  <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {approvalStats.lawyersApprovalRate}%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 sm:mb-2 space-y-1">
                    <div>✓ مقبول: {approvalStats.stats.lawyers.approved}</div>
                    <div>✗ مرفوض: {approvalStats.stats.lawyers.rejected}</div>
                    <div>⏳ معلق: {approvalStats.stats.lawyers.pending}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <UsersGrowthChart data={usersGrowthData} loading={loading} />
            <CityDistributionChart data={cityData} loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <CasesStatusChart data={casesStatusData} loading={loading} />
            <TopLawyersChart data={topLawyersData} loading={loading} />
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
              إجراءات سريعة
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-3 space-x-reverse p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all hover:shadow-md"
              >
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                    إدارة المستخدمين
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {overallStats?.pendingUsers || 0} طلب معلق
                  </div>
                </div>
              </Link>

              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-3 space-x-reverse p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all hover:shadow-md"
              >
                <div className="flex-shrink-0">
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                    إدارة المحامين
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {overallStats?.pendingLawyers || 0} طلب معلق
                  </div>
                </div>
              </Link>

              <Link
                to="/admin/system-ai"
                className="flex items-center space-x-3 space-x-reverse p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all hover:shadow-md sm:col-span-2 lg:col-span-1"
              >
                <div className="flex-shrink-0">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                    SystemAI
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    تحليلات متقدمة
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Analytics;
