// Court Clerk - Hearings Management
// Mobile Responsive Version
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Plus, Clock, AlertCircle, CheckCircle, XCircle,
    Search, Filter, FileText, TrendingUp, Bell, ChevronLeft,
    RefreshCw, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const HearingsManagement = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [hearings, setHearings] = useState([]);
    const [allHearings, setAllHearings] = useState([]);
    const [postponeRequests, setPostponeRequests] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showHearingsModal, setShowHearingsModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('hearings');

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCaseType, setFilterCaseType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [showFilters, setShowFilters] = useState(false);

    const [formData, setFormData] = useState({
        hearing_type: 'first_hearing',
        hearing_date: '',
        hearing_time: '',
        hearing_summary: '',
        judge_notes: ''
    });

    useEffect(() => {
        fetchCases();
        fetchPostponeRequests();
    }, []);

    useEffect(() => {
        if (cases.length > 0) {
            fetchAllHearingsForCases();
        }
    }, [cases]);

    const fetchCases = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await fetch('https://justice-connect-mobile.onrender.com/api/court-clerk/cases', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setCases(data.data || []);
            }
        } catch (error) {
            toast.error('فشل في تحميل القضايا');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchAllHearingsForCases = async () => {
        try {
            const allHearingsArray = [];
            for (const caseItem of cases) {
                const response = await fetch(`https://justice-connect-mobile.onrender.com/api/court-clerk/cases/${caseItem.case_id}/hearings`, {
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        allHearingsArray.push(...data.data);
                    }
                }
            }
            setAllHearings(allHearingsArray);
        } catch (error) {
            console.error('Failed to fetch all hearings:', error);
        }
    };

    const fetchPostponeRequests = async () => {
        try {
            const response = await fetch('https://justice-connect-mobile.onrender.com/api/court-clerk/postpone-requests', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setPostponeRequests(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching postpone requests:', error);
        }
    };

    const fetchHearings = async (caseId) => {
        try {
            const response = await fetch(`https://justice-connect-mobile.onrender.com/api/court-clerk/cases/${caseId}/hearings`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setHearings(data.data || []);
            }
        } catch (error) {
            toast.error('فشل في تحميل الجلسات');
        }
    };

    // Statistics
    const stats = useMemo(() => {
        const total = allHearings.length;
        const scheduled = allHearings.filter(h => h.hearing_status === 'scheduled').length;
        const held = allHearings.filter(h => h.hearing_status === 'held').length;
        const today = allHearings.filter(h => {
            const hearingDate = new Date(h.hearing_date).toDateString();
            const todayDate = new Date().toDateString();
            return hearingDate === todayDate;
        }).length;

        return { total, scheduled, held, today };
    }, [allHearings]);

    // Get hearings grouped by case_id
    const hearingsByCase = useMemo(() => {
        const grouped = {};
        allHearings.forEach(hearing => {
            if (!grouped[hearing.case_id]) {
                grouped[hearing.case_id] = [];
            }
            grouped[hearing.case_id].push(hearing);
        });
        return grouped;
    }, [allHearings]);

    const caseHasHearingWithStatus = (caseId, status) => {
        const caseHearings = hearingsByCase[caseId] || [];
        return caseHearings.some(h => h.hearing_status === status);
    };

    const caseTypes = useMemo(() => {
        const types = [...new Set(cases.map(c => c.case_type).filter(Boolean))];
        return types;
    }, [cases]);

    const filteredCases = useMemo(() => {
        let result = [...cases];

        if (searchQuery) {
            result = result.filter(c =>
                (c.case_number && c.case_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        if (filterCaseType !== 'all') {
            result = result.filter(c => c.case_type === filterCaseType);
        }

        if (filterStatus !== 'all') {
            if (filterStatus === 'no_hearings') {
                result = result.filter(c => !hearingsByCase[c.case_id] || hearingsByCase[c.case_id].length === 0);
            } else {
                result = result.filter(c => caseHasHearingWithStatus(c.case_id, filterStatus));
            }
        }

        result.sort((a, b) => {
            if (sortBy === 'date_desc') {
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            } else if (sortBy === 'date_asc') {
                return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            }
            return 0;
        });

        return result;
    }, [cases, searchQuery, filterCaseType, filterStatus, sortBy, hearingsByCase]);

    const filteredHearings = useMemo(() => {
        let result = [...hearings];

        if (filterDateFrom) {
            result = result.filter(h => new Date(h.hearing_date) >= new Date(filterDateFrom));
        }
        if (filterDateTo) {
            result = result.filter(h => new Date(h.hearing_date) <= new Date(filterDateTo));
        }

        result.sort((a, b) => {
            if (sortBy === 'date_desc') {
                return new Date(b.hearing_date) - new Date(a.hearing_date);
            } else if (sortBy === 'date_asc') {
                return new Date(a.hearing_date) - new Date(b.hearing_date);
            }
            return 0;
        });

        return result;
    }, [hearings, filterDateFrom, filterDateTo, sortBy]);

    const handleSelectCase = (caseItem) => {
        setSelectedCase(caseItem);
        fetchHearings(caseItem.case_id);
        if (window.innerWidth < 1024) {
            setShowHearingsModal(true);
        }
    };

    const handleScheduleHearing = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `https://justice-connect-mobile.onrender.com/api/court-clerk/cases/${selectedCase.case_id}/hearings`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(formData)
                }
            );

            if (response.ok) {
                toast.success('تم جدولة الجلسة بنجاح');
                setShowModal(false);
                fetchHearings(selectedCase.case_id);
                fetchAllHearingsForCases();
                resetForm();
            } else {
                toast.error('فشل في جدولة الجلسة');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({
            hearing_type: 'first_hearing',
            hearing_date: '',
            hearing_time: '',
            hearing_summary: '',
            judge_notes: ''
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterCaseType('all');
        setFilterStatus('all');
        setFilterDateFrom('');
        setFilterDateTo('');
        setSortBy('date_desc');
    };

    const hasActiveFilters = searchQuery || filterCaseType !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo;

    const getStatusBadge = (status, compact = false) => {
        const config = {
            scheduled: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'مجدولة' },
            held: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'منتهية' },
            postponed: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'مؤجلة' },
            cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'ملغاة' }
        };
        const { bg, text, label } = config[status] || config.scheduled;
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${bg} ${text}`}>
                {label}
            </span>
        );
    };

    const getHearingTypeLabel = (type) => {
        const types = {
            first_hearing: 'أول جلسة',
            continuation: 'متابعة',
            evidence: 'جلسة بينات',
            witness: 'جلسة شهود',
            final_hearing: 'جلسة ختامية'
        };
        return types[type] || type;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        return timeString;
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader
                title="إدارة الجلسات"
                subtitle="جدولة ومتابعة الجلسات القضائية"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-3 pt-4 sm:px-6 lg:px-8">
                    <div className="flex gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('hearings')}
                            className={`pb-3 px-3 sm:px-4 font-medium transition whitespace-nowrap text-sm sm:text-base ${activeTab === 'hearings'
                                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            <Calendar className="inline-block w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
                            الجلسات
                        </button>
                        <button
                            onClick={() => setActiveTab('postpone_requests')}
                            className={`pb-3 px-3 sm:px-4 font-medium transition whitespace-nowrap text-sm sm:text-base flex items-center gap-1 ${activeTab === 'postpone_requests'
                                ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                            طلبات التأجيل
                            {postponeRequests.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] sm:text-xs rounded-full min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] flex items-center justify-center px-1">
                                    {postponeRequests.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Postpone Requests Tab */}
                {activeTab === 'postpone_requests' && (
                    <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                            <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <AlertCircle className="text-orange-500 w-4 h-4 sm:w-5 sm:h-5" />
                                طلبات التأجيل من المحامين
                            </h2>
                            {postponeRequests.length === 0 ? (
                                <div className="text-center py-8 sm:py-12">
                                    <CheckCircle size={40} className="mx-auto text-green-400 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد طلبات تأجيل معلقة</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {postponeRequests.map(request => (
                                        <div key={request.event_id} className="p-3 sm:p-4 border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base flex items-center gap-1">
                                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                                                        <span className="truncate">{request.title}</span>
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                        القضية: {request.case?.case_number || 'غير محدد'}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                                                    معلق
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3 bg-white dark:bg-gray-700 p-2 sm:p-3 rounded-lg line-clamp-2">
                                                {request.description}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(request.created_at)}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        if (request.case?.case_id) {
                                                            setActiveTab('hearings');
                                                            const caseItem = cases.find(c => c.case_id === request.case.case_id);
                                                            if (caseItem) {
                                                                handleSelectCase(caseItem);
                                                            }
                                                        }
                                                    }}
                                                    className="px-2 sm:px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-[10px] sm:text-xs"
                                                >
                                                    عرض الجلسات
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Hearings Tab */}
                {activeTab === 'hearings' && (
                    <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

                        {/* Statistics Cards */}
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-4 mb-4 scrollbar-hide">
                            <StatCard icon={Calendar} value={stats.total} label="إجمالي الجلسات" color="blue" />
                            <StatCard icon={TrendingUp} value={stats.today} label="جلسات اليوم" color="purple" />
                            <StatCard icon={Clock} value={stats.scheduled} label="مجدولة" color="yellow" />
                            <StatCard icon={CheckCircle} value={stats.held} label="منتهية" color="green" />
                        </div>

                        {/* Search and Filters */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="بحث بالرقم أو اسم القضية..."
                                        className="w-full pr-9 pl-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                                    <select
                                        value={filterCaseType}
                                        onChange={(e) => setFilterCaseType(e.target.value)}
                                        className="flex-1 sm:flex-none px-3 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="all">جميع الأنواع</option>
                                        {caseTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="flex-1 sm:flex-none px-3 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="all">جميع الحالات</option>
                                        <option value="no_hearings">بدون جلسات</option>
                                        <option value="scheduled">مجدولة</option>
                                    </select>

                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`p-2.5 rounded-xl transition ${showFilters || hasActiveFilters
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        <Filter size={18} />
                                    </button>

                                    <button
                                        onClick={() => fetchCases(true)}
                                        disabled={refreshing}
                                        className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                    >
                                        <RefreshCw size={18} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
                                    </button>

                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="px-3 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                        >
                                            مسح
                                        </button>
                                    )}
                                </div>
                            </div>

                            {showFilters && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">من تاريخ</label>
                                        <input
                                            type="date"
                                            value={filterDateFrom}
                                            onChange={(e) => setFilterDateFrom(e.target.value)}
                                            className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">إلى تاريخ</label>
                                        <input
                                            type="date"
                                            value={filterDateTo}
                                            onChange={(e) => setFilterDateTo(e.target.value)}
                                            className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">ترتيب حسب</label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="date_desc">الأحدث أولاً</option>
                                            <option value="date_asc">الأقدم أولاً</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Add Hearing Button - Mobile */}
                        {selectedCase && (
                            <div className="lg:hidden mb-4">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 font-medium text-sm"
                                >
                                    <Plus size={18} />
                                    جدولة جلسة جديدة
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                            {/* Cases List */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                        القضايا ({filteredCases.length})
                                    </h2>
                                </div>

                                <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3b82f6 transparent' }}>
                                    {loading ? (
                                        <div className="p-8 text-center">
                                            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">جاري التحميل...</p>
                                        </div>
                                    ) : filteredCases.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد قضايا</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {filteredCases.map(caseItem => (
                                                <div
                                                    key={caseItem.case_id}
                                                    onClick={() => handleSelectCase(caseItem)}
                                                    className={`p-3 sm:p-4 cursor-pointer transition-all active:scale-[0.99] ${selectedCase?.case_id === caseItem.case_id
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                                                {caseItem.case_number || caseItem.title}
                                                            </p>
                                                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{caseItem.case_type}</p>
                                                            {hearingsByCase[caseItem.case_id]?.length > 0 && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <Calendar size={10} className="text-gray-400" />
                                                                    <span className="text-[10px] text-gray-400">
                                                                        {hearingsByCase[caseItem.case_id].length} جلسة
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <ChevronLeft size={16} className="text-gray-400 lg:hidden flex-shrink-0" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Hearings List - Desktop */}
                            <div className="hidden lg:block lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-blue-500" />
                                        {selectedCase ? `جلسات: ${selectedCase.case_number || selectedCase.title}` : 'الجلسات'}
                                    </h2>
                                    {selectedCase && (
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-2"
                                        >
                                            <Plus size={16} />
                                            جدولة جلسة
                                        </button>
                                    )}
                                </div>

                                <div className="p-4">
                                    <HearingsContent
                                        selectedCase={selectedCase}
                                        hearings={filteredHearings}
                                        getStatusBadge={getStatusBadge}
                                        getHearingTypeLabel={getHearingTypeLabel}
                                        formatDate={formatDate}
                                        formatTime={formatTime}
                                        onAddHearing={() => setShowModal(true)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Hearings Modal */}
                {showHearingsModal && selectedCase && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:hidden">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                    جلسات القضية
                                </h2>
                                <button
                                    onClick={() => setShowHearingsModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4">
                                    <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                                        {selectedCase.case_number || selectedCase.title}
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400">{selectedCase.case_type}</p>
                                </div>

                                <HearingsContent
                                    selectedCase={selectedCase}
                                    hearings={filteredHearings}
                                    getStatusBadge={getStatusBadge}
                                    getHearingTypeLabel={getHearingTypeLabel}
                                    formatDate={formatDate}
                                    formatTime={formatTime}
                                    onAddHearing={() => {
                                        setShowHearingsModal(false);
                                        setShowModal(true);
                                    }}
                                    isMobile={true}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Schedule Hearing Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-blue-500" />
                                    جدولة جلسة جديدة
                                </h2>
                                <button
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleScheduleHearing} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">نوع الجلسة *</label>
                                    <select
                                        value={formData.hearing_type}
                                        onChange={(e) => setFormData({ ...formData, hearing_type: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                        required
                                    >
                                        <option value="first_hearing">أول جلسة</option>
                                        <option value="continuation">متابعة</option>
                                        <option value="evidence">جلسة بينات</option>
                                        <option value="witness">جلسة شهود</option>
                                        <option value="final_hearing">جلسة ختامية</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">التاريخ *</label>
                                        <input
                                            type="date"
                                            value={formData.hearing_date}
                                            onChange={(e) => setFormData({ ...formData, hearing_date: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الوقت *</label>
                                        <input
                                            type="time"
                                            value={formData.hearing_time}
                                            onChange={(e) => setFormData({ ...formData, hearing_time: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ملاحظات (اختياري)</label>
                                    <textarea
                                        value={formData.hearing_summary}
                                        onChange={(e) => setFormData({ ...formData, hearing_summary: e.target.value })}
                                        rows={2}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium text-sm">
                                        جدولة
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-xl font-medium text-sm"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, value, label, color }) => (
    <div className="flex-shrink-0 w-[130px] sm:w-auto bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
        </div>
    </div>
);

// Hearings Content Component
const HearingsContent = ({ selectedCase, hearings, getStatusBadge, getHearingTypeLabel, formatDate, formatTime, onAddHearing, isMobile = false }) => {
    if (!selectedCase) {
        return (
            <div className="text-center py-12">
                <Calendar size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">اختر قضية لعرض جلساتها</p>
            </div>
        );
    }

    if (hearings.length === 0) {
        return (
            <div className="text-center py-8">
                <Calendar size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد جلسات مجدولة</p>
                <button
                    onClick={onAddHearing}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-flex items-center gap-2 text-sm"
                >
                    <Plus size={16} />
                    جدولة أول جلسة
                </button>
            </div>
        );
    }

    // Mobile: Card View
    if (isMobile) {
        return (
            <div className="space-y-3">
                {hearings.map(hearing => (
                    <div key={hearing.hearing_id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                الجلسة #{hearing.hearing_number}
                            </p>
                            {getStatusBadge(hearing.hearing_status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>النوع: {getHearingTypeLabel(hearing.hearing_type)}</span>
                            <span>التاريخ: {formatDate(hearing.hearing_date)}</span>
                            <span>الوقت: {formatTime(hearing.hearing_time)}</span>
                        </div>
                    </div>
                ))}
                <button
                    onClick={onAddHearing}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-2"
                >
                    <Plus size={16} />
                    جدولة جلسة جديدة
                </button>
            </div>
        );
    }

    // Desktop: Table View
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">رقم الجلسة</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">النوع</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">التاريخ</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">الوقت</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">الحالة</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {hearings.map(hearing => (
                        <tr key={hearing.hearing_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                الجلسة #{hearing.hearing_number}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                {getHearingTypeLabel(hearing.hearing_type)}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                {formatDate(hearing.hearing_date)}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                {formatTime(hearing.hearing_time)}
                            </td>
                            <td className="px-4 py-3">
                                {getStatusBadge(hearing.hearing_status)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default HearingsManagement;
