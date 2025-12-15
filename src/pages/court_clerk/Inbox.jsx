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
    ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';
import { getAuthHeaders } from '../../utils/authHelpers';

const CourtClerkInbox = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [filings, setFilings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [currentPage, setCurrentPage] = useState(1);

    const statusOptions = [
        { value: 'all', label: 'الكل', icon: FileText, color: 'gray' },
        { value: 'submitted', label: 'جديدة', icon: Clock, color: 'blue' },
        { value: 'under_review', label: 'قيد المراجعة', icon: AlertCircle, color: 'yellow' },
        { value: 'rejected', label: 'مرفوضة', icon: XCircle, color: 'red' },
        { value: 'update_required', label: 'بانتظار تعديل', icon: AlertCircle, color: 'orange' },
        { value: 'ready_for_registration', label: 'جاهزة للتسجيل', icon: CheckCircle, color: 'green' },
        { value: 'registered', label: 'مسجلة', icon: CheckCircle, color: 'teal' }
    ];

    useEffect(() => {
        fetchFilings();
    }, [statusFilter, currentPage, searchTerm]);

    const fetchFilings = async () => {
        try {
            setLoading(true);
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
                `http://localhost:5000/api/court-clerk/filings?${params}`,
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
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = statusOptions.find(s => s.value === status) || statusOptions[0];
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${statusConfig.color}-100 text-${statusConfig.color}-700 flex items-center gap-1`}>
                <statusConfig.icon size={14} />
                {statusConfig.label}
            </span>
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchFilings();
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Header */}
            <CourtClerkHeader
                title="صندوق الوارد"
                subtitle="استقبال ومراجعة اللوائح المقدمة من المحامين"
            />

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="البحث برقم اللائحة أو اسم المدعي أو المدعى عليه..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </form>

                        {/* Status Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {statusOptions.map(status => (
                                <button
                                    key={status.value}
                                    onClick={() => setStatusFilter(status.value)}
                                    className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition ${statusFilter === status.value
                                            ? `bg-${status.color}-500 text-white`
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <status.icon size={16} />
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filings List */}
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
                    </div>
                ) : filings.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow">
                        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">لا توجد لوائح</p>
                    </div>
                ) : (
                    <div className="space-y-4">
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
    );
};

const FilingCard = ({ filing, onView, getStatusBadge }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        لائحة رقم: {filing.filing_number}
                    </h3>
                    {getStatusBadge(filing.filing_status)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    المحكمة: {filing.court_name} - {filing.city}
                </p>
            </div>
            <button
                onClick={onView}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 transition"
            >
                <Eye size={16} />
                عرض التفاصيل
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">المدعي</p>
                <p className="font-medium text-gray-800 dark:text-white">{filing.plaintiff_name}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">المدعى عليه</p>
                <p className="font-medium text-gray-800 dark:text-white">{filing.defendant_name}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">نوع الدعوى</p>
                <p className="font-medium text-gray-800 dark:text-white">{filing.case_type}</p>
            </div>
        </div>

        {/* Show requested changes/notes for update_required status */}
        {filing.filing_status === 'update_required' && (filing.requested_changes || filing.review_notes) && (
            <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-1">
                            ملاحظات طلب التعديل:
                        </p>
                        {filing.requested_changes && (
                            <p className="text-sm text-orange-600 dark:text-orange-300 whitespace-pre-wrap">
                                {filing.requested_changes}
                            </p>
                        )}
                        {filing.review_notes && (
                            <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                                {filing.review_notes}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>المحامي: {filing.lawyer?.first_name} {filing.lawyer?.last_name}</span>
                <span>•</span>
                <span>تاريخ التقديم: {new Date(filing.submitted_at).toLocaleDateString('ar-EG')}</span>
            </div>
        </div>
    </div>
);

export default CourtClerkInbox;
