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
    FolderOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const CourtClerkDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clerk, setClerk] = useState(null);

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

    const fetchDashboardStats = async () => {
        try {
            const user = localStorage.getItem('user');
            const token = user ? btoa(user) : '';
            
            const response = await fetch('http://localhost:5000/api/court-clerk/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-user-data': user || ''
                }
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
        }
    };

    const StatCard = ({ icon: Icon, title, value, color, onClick }) => (
        <div 
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition cursor-pointer border-r-4 ${color}`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">{value || 0}</p>
                </div>
                <div className={`p-4 rounded-full bg-opacity-10 dark:bg-opacity-20 ${color.replace('border-', 'bg-')}`}>
                    <Icon size={32} className={color.replace('border-', 'text-')} />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Header */}
            <CourtClerkHeader 
                title={`مرحباً، ${clerk?.first_name || ''} ${clerk?.last_name || ''}`}
                subtitle="لوحة تحكم قلم المحكمة - إدارة اللوائح والقضايا"
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                
                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={FileText}
                        title="لوائح جديدة"
                        value={stats?.new_filings}
                        color="border-blue-500"
                        onClick={() => navigate('/court-clerk/inbox?status=submitted')}
                    />
                    <StatCard
                        icon={Clock}
                        title="قيد المراجعة"
                        value={stats?.under_review}
                        color="border-yellow-500"
                        onClick={() => navigate('/court-clerk/inbox?status=under_review')}
                    />
                    <StatCard
                        icon={CheckCircle}
                        title="جاهزة للتسجيل"
                        value={stats?.ready_for_registration}
                        color="border-green-500"
                        onClick={() => navigate('/court-clerk/inbox?status=ready_for_registration')}
                    />
                    <StatCard
                        icon={AlertCircle}
                        title="بانتظار تعديل"
                        value={stats?.update_required}
                        color="border-red-500"
                        onClick={() => navigate('/court-clerk/inbox?status=update_required')}
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Users size={20} className="text-orange-500" />
                            التبليغات المعلقة
                        </h3>
                        <div className="flex justify-between items-center">
                            <span className="text-3xl font-bold text-orange-600">
                                {stats?.pending_service || 0}
                            </span>
                            <button
                                onClick={() => navigate('/court-clerk/services')}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                            >
                                إدارة التبليغات
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-purple-500" />
                            جلسات اليوم
                        </h3>
                        <div className="flex justify-between items-center">
                            <span className="text-3xl font-bold text-purple-600">
                                {stats?.hearings_today || 0}
                            </span>
                            <button
                                onClick={() => navigate('/court-clerk/hearings')}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                            >
                                عرض الجلسات
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        icon={FileText}
                        title="إدارة القضايا"
                        description="عرض ومتابعة جميع القضايا"
                        onClick={() => navigate('/court-clerk/cases')}
                        color="bg-teal-500"
                    />
                </div>
            </div>
        </div>
    );
};

const NavigationCard = ({ icon: Icon, title, description, onClick, color }) => (
    <div
        onClick={onClick}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition cursor-pointer border-t-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 group"
    >
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <Icon size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
);

export default CourtClerkDashboard;
