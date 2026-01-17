// ============================================
// Court Clerk Inbox - صندوق الوارد (اللوائح)
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    FileText,
    Search,
    Filter,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronLeft,
    RefreshCw,
    User,
    Building,
    Calendar,
    Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';
import { getAuthHeaders } from '../../utils/authHelpers';

const CourtClerkInbox = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [filings, setFilings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [currentPage, setCurrentPage] = useState(1);

    const statusOptions = [
        { value: 'all', label: 'الكل', icon: FileText, color: 'gray', bgColor: 'bg-gray-500' },
        { value: 'submitted', label: 'جديدة', icon: Clock, color: 'blue', bgColor: 'bg-blue-500' },
        { value: 'under_review', label: 'قيد المراجعة', icon: AlertCircle, color: 'yellow', bgColor: 'bg-yellow-500' },
        { value: 'rejected', label: 'مرفوضة', icon: XCircle, color: 'red', bgColor: 'bg-red-500' },
        { value: 'update_required', label: 'بانتظار تعديل', icon: AlertCircle, color: 'orange', bgColor: 'bg-orange-500' },
        { value: 'ready_for_registration', label: 'جاهزة للتسجيل', icon: CheckCircle, color: 'green', bgColor: 'bg-green-500' },
        { value: 'registered', label: 'مسجلة', icon: CheckCircle, color: 'teal', bgColor: 'bg-teal-500' }
    ];

    useEffect(() => {
        fetchFilings();
    }, [statusFilter, currentPage, searchTerm]);

    const fetchFilings = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            const params = new URLSearchParams({
                page: currentPage,
                limit: 20
            });

            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/filings?${params}`,
                {
                    headers: getAuthHeaders()
                }
            );

            if (response.ok) {
                const data = await response.json();
                setFilings(data.data);
            } else {
                toast.error('فشل في تحميل اللوائح');
            }
        } catch (error) {
            console.error('Error fetching filings:', error);
            toast.error('حدث خطأ أثناء تحميل اللوائح');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = statusOptions.find(s => s.value === status) || statusOptions[0];
        const Icon = statusConfig.icon;
        return (
            <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-${statusConfig.color}-100 dark:bg-${statusConfig.color}-900/30 text-${statusConfig.color}-700 dark:text-${statusConfig.color}-400 flex items-center gap-1 whitespace-nowrap`}>
                <Icon size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">{statusConfig.label}</span>
            </span>
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchFilings();
    };

    // Get count for each status (mock - ideally from API)
    const getStatusCount = (status) => {
        if (status === 'all') return filings.length;
        return filings.filter(f => f.filing_status === status).length;
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Header */}
            <CourtClerkHeader
                title="صندوق الوارد"
                subtitle="استقبال ومراجعة اللوائح المقدمة من المحامين"
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Filters Section */}
                <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
                    <div className="max-w-7xl mx-auto px-3 py-3 sm:px-6 sm:py-4 lg:px-8">

                        {/* Search Bar */}
                        <div className="flex gap-2 mb-3">
                            <form onSubmit={handleSearch} className="flex-1">
                                <div className="relative">
                                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="البحث برقم اللائحة أو اسم المدعي..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pr-10 pl-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </form>
                            <button
                                onClick={() => fetchFilings(true)}
                                disabled={refreshing}
                                className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
                            >
                                <RefreshCw size={18} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {/* Status Filter Pills - Scrollable on Mobile */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                            {statusOptions.map(status => {
                                const Icon = status.icon;
                                const isActive = statusFilter === status.value;
                                return (
                                    <button
                                        key={status.value}
                                        onClick={() => setStatusFilter(status.value)}
                                        className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 text-xs sm:text-sm font-medium transition flex-shrink-0 ${isActive
                                            ? `${status.bgColor} text-white shadow-md`
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        <Icon size={14} />
                                        <span>{status.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Filings List */}
                <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">جاري التحميل...</p>
                        </div>
                    ) : filings.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                            <FileText size={40} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">لا توجد لوائح</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">حاول تغيير الفلتر أو البحث</p>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {filings.map(filing => (
                                <FilingCard
                                    key={filing.filing_id}
                                    filing={filing}
                                    onView={() => navigate(`/court-clerk/filings/${filing.filing_id}`)}
                                    getStatusBadge={getStatusBadge}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Mobile-Responsive Filing Card Component
const FilingCard = ({ filing, onView, getStatusBadge }) => (
    <div
        onClick={onView}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 hover:shadow-xl transition border border-gray-100 dark:border-gray-700 cursor-pointer active:scale-[0.99]"
    >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-white">
                        {filing.filing_number}
                    </h3>
                    {getStatusBadge(filing.filing_status)}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Building size={12} className="flex-shrink-0" />
                    <span className="truncate">{filing.court_name}</span>
                </p>
            </div>
            <ChevronLeft size={20} className="text-gray-400 flex-shrink-0 mt-1" />
        </div>

        {/* Info Grid - Stack on Mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                    <User size={10} className="flex-shrink-0" />
                    المدعي
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white truncate">
                    {filing.plaintiff_name}
                </p>
            </div>
            <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                    <User size={10} className="flex-shrink-0" />
                    المدعى عليه
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white truncate">
                    {filing.defendant_name}
                </p>
            </div>
            <div className="min-w-0 col-span-2 sm:col-span-1">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                    <Briefcase size={10} className="flex-shrink-0" />
                    نوع الدعوى
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white truncate">
                    {filing.case_type}
                </p>
            </div>
        </div>

        {/* Update Required Notice */}
        {filing.filing_status === 'update_required' && (filing.requested_changes || filing.review_notes) && (
            <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">
                            ملاحظات طلب التعديل:
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-300 line-clamp-2">
                            {filing.requested_changes || filing.review_notes}
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1 truncate">
                <User size={12} className="flex-shrink-0" />
                <span className="truncate">{filing.lawyer?.first_name} {filing.lawyer?.last_name}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <Calendar size={12} />
                <span>{new Date(filing.submitted_at).toLocaleDateString('ar-EG')}</span>
            </div>
        </div>
    </div>
);

export default CourtClerkInbox;
