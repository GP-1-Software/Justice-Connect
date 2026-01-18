// ============================================
// Court Clerk Dashboard - لوحة تحكم قلم المحكمة
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Calendar,
    Users,
    Scale,
    FolderOpen,
    Receipt,
    Gavel,
    ChevronLeft,
    RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';
import { getAuthHeaders } from '../../utils/authHelpers';

const CourtClerkDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clerk, setClerk] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Check authentication
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/login');
            return;
        }

        const userData = JSON.parse(user);
        if (userData.user_type !== 'court_clerk') {
            toast.error('ليس لديك صلاحية للوصول');
            navigate('/');
            return;
        }

        setClerk(userData);
        fetchDashboardStats();
    }, [navigate]);

    const fetchDashboardStats = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            const response = await fetch('https://justice-connect-mobile.onrender.com/api/court-clerk/dashboard', {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.data);
            } else {
                toast.error('فشل في تحميل الإحصائيات');
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('حدث خطأ أثناء تحميل الإحصائيات');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Stat Card - Responsive Design
    const StatCard = ({ icon: Icon, title, value, color, colorClass, onClick }) => (
        <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 hover:shadow-xl transition cursor-pointer border-r-4 ${color} active:scale-95`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-1 truncate">{title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{value || 0}</p>
                </div>
                <div className={`p-3 sm:p-4 rounded-full ${colorClass} flex-shrink-0`}>
                    <Icon size={24} className="sm:w-8 sm:h-8" />
                </div>
            </div>
        </div>
    );

    // Navigation Card - Responsive Design
    const NavigationCard = ({ icon: Icon, title, description, onClick, color }) => (
        <div
            onClick={onClick}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 hover:shadow-xl transition cursor-pointer border-t-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 group active:scale-95"
        >
            <div className="flex items-start gap-3 sm:block">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-xl flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <Icon size={20} className="sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-1 sm:mb-2">{title}</h3>
                        <ChevronLeft size={18} className="text-gray-400 sm:hidden flex-shrink-0" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{description}</p>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Header - Fixed */}
            <CourtClerkHeader
                title={`مرحباً، ${clerk?.first_name || ''}`}
                subtitle="لوحة تحكم قلم المحكمة"
            />

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8 lg:px-8">

                    {/* Quick Stats Section - Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                            الإحصائيات السريعة
                        </h2>
                        <button
                            onClick={() => fetchDashboardStats(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">تحديث</span>
                        </button>
                    </div>

                    {/* Statistics Grid - 2x2 on mobile, 4 on larger screens */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                        <StatCard
                            icon={FileText}
                            title="لوائح جديدة"
                            value={stats?.new_filings}
                            color="border-blue-500"
                            colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                            onClick={() => navigate('/court-clerk/inbox?status=submitted')}
                        />
                        <StatCard
                            icon={Clock}
                            title="قيد المراجعة"
                            value={stats?.under_review}
                            color="border-yellow-500"
                            colorClass="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                            onClick={() => navigate('/court-clerk/inbox?status=under_review')}
                        />
                        <StatCard
                            icon={CheckCircle}
                            title="جاهزة للتسجيل"
                            value={stats?.ready_for_registration}
                            color="border-green-500"
                            colorClass="bg-green-100 dark:bg-green-900/30 text-green-600"
                            onClick={() => navigate('/court-clerk/inbox?status=ready_for_registration')}
                        />
                        <StatCard
                            icon={AlertCircle}
                            title="بانتظار تعديل"
                            value={stats?.update_required}
                            color="border-red-500"
                            colorClass="bg-red-100 dark:bg-red-900/30 text-red-600"
                            onClick={() => navigate('/court-clerk/inbox?status=update_required')}
                        />
                    </div>

                    {/* Navigation Section Header */}
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">
                        الإجراءات السريعة
                    </h2>

                    {/* Navigation Cards - 1 column on mobile, 2 on tablet, 3 on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                        <NavigationCard
                            icon={FileText}
                            title="صندوق الوارد"
                            description="استقبال ومراجعة اللوائح الجديدة"
                            onClick={() => navigate('/court-clerk/inbox')}
                            color="bg-blue-500"
                        />
                        <NavigationCard
                            icon={CheckCircle}
                            title="تسجيل القضايا"
                            description="تسجيل القضايا رسمياً وإصدار الأرقام"
                            onClick={() => navigate('/court-clerk/registration')}
                            color="bg-green-500"
                        />
                        <NavigationCard
                            icon={Users}
                            title="إدارة التبليغات"
                            description="تسجيل ومتابعة التبليغات القضائية"
                            onClick={() => navigate('/court-clerk/services')}
                            color="bg-orange-500"
                        />
                        <NavigationCard
                            icon={Calendar}
                            title="إدارة الجلسات"
                            description="جدولة وتسجيل الجلسات القضائية"
                            onClick={() => navigate('/court-clerk/hearings')}
                            color="bg-purple-500"
                        />
                        <NavigationCard
                            icon={Scale}
                            title="القرارات والأحكام"
                            description="إدخال وإدارة القرارات القضائية"
                            onClick={() => navigate('/court-clerk/decisions')}
                            color="bg-indigo-500"
                        />
                        <NavigationCard
                            icon={Receipt}
                            title="إدارة الرسوم"
                            description="تحرير واعتماد رسوم الدعاوى"
                            onClick={() => navigate('/court-clerk/fees')}
                            color="bg-amber-500"
                        />
                        <NavigationCard
                            icon={FolderOpen}
                            title="إدارة القضايا"
                            description="عرض ومتابعة جميع القضايا"
                            onClick={() => navigate('/court-clerk/cases')}
                            color="bg-teal-500"
                        />
                        <NavigationCard
                            icon={Gavel}
                            title="إدارة الاستئنافات"
                            description="مراجعة وإدارة طلبات الاستئناف"
                            onClick={() => navigate('/court-clerk/appeals')}
                            color="bg-rose-500"
                        />
                    </div>

                    {/* Bottom Padding for Mobile */}
                    <div className="h-4 sm:h-8"></div>
                </div>
            </div>
        </div>
    );
};

export default CourtClerkDashboard;

