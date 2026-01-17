import {
    AlertCircle,
    Bell,
    CheckCircle,
    ChevronLeft,
    Clock,
    FileText,
    Filter,
    Plus,
    RefreshCw,
    Search,
    TrendingUp,
    Users,
    X,
    XCircle
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';
import { getAuthHeaders } from '../../utils/authHelpers';

const ServicesManagement = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [services, setServices] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showServicesModal, setShowServicesModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCaseType, setFilterCaseType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [showFilters, setShowFilters] = useState(false);

    const [formData, setFormData] = useState({
        service_method: 'bailiff',
        defendant_name: '',
        defendant_address: '',
        defendant_phone: '',
        attempt_date: new Date().toISOString().split('T')[0],
        attempt_result: 'pending',
        service_notes: ''
    });

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        if (cases.length > 0) {
            fetchAllServicesForCases();
        }
    }, [cases]);

    const fetchCases = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/cases`, {
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

    const fetchAllServicesForCases = async () => {
        try {
            const allServicesArray = [];
            for (const caseItem of cases) {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/cases/${caseItem.case_id}/services`, {
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        allServicesArray.push(...data.data);
                    }
                }
            }
            setAllServices(allServicesArray);
        } catch (error) {
            console.error('Failed to fetch all services:', error);
        }
    };

    const fetchServices = async (caseId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/cases/${caseId}/services`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setServices(data.data || []);
            }
        } catch (error) {
            toast.error('فشل في تحميل التبليغات');
        }
    };

    // Statistics
    const stats = useMemo(() => {
        const total = allServices.length;
        const served = allServices.filter(s => s.attempt_result === 'served').length;
        const pending = allServices.filter(s => s.attempt_result === 'pending').length;
        const refused = allServices.filter(s => s.attempt_result === 'refused' || s.attempt_result === 'not_served').length;
        const today = allServices.filter(s => {
            const serviceDate = new Date(s.attempt_date).toDateString();
            const todayDate = new Date().toDateString();
            return serviceDate === todayDate;
        }).length;

        return { total, served, pending, refused, today };
    }, [allServices]);

    // Get services grouped by case_id
    const servicesByCase = useMemo(() => {
        const grouped = {};
        allServices.forEach(service => {
            if (!grouped[service.case_id]) {
                grouped[service.case_id] = [];
            }
            grouped[service.case_id].push(service);
        });
        return grouped;
    }, [allServices]);

    // Get latest service status for a case
    const getLatestServiceStatus = (caseId) => {
        const caseServices = servicesByCase[caseId] || [];
        if (caseServices.length === 0) return null;
        const sorted = [...caseServices].sort((a, b) =>
            new Date(b.attempt_date) - new Date(a.attempt_date)
        );
        return sorted[0]?.attempt_result;
    };

    // Check if case has any service with specific status
    const caseHasServiceWithStatus = (caseId, status) => {
        const caseServices = servicesByCase[caseId] || [];
        return caseServices.some(s => s.attempt_result === status);
    };

    // Filtered Cases
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
            if (filterStatus === 'no_services') {
                result = result.filter(c => !servicesByCase[c.case_id] || servicesByCase[c.case_id].length === 0);
            } else {
                result = result.filter(c => caseHasServiceWithStatus(c.case_id, filterStatus));
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
    }, [cases, searchQuery, filterCaseType, filterStatus, sortBy, servicesByCase]);

    // Get unique case types
    const caseTypes = useMemo(() => {
        const types = [...new Set(cases.map(c => c.case_type).filter(Boolean))];
        return types;
    }, [cases]);

    const handleSelectCase = (caseItem) => {
        setSelectedCase(caseItem);
        fetchServices(caseItem.case_id);
        // On mobile, open services modal
        if (window.innerWidth < 1024) {
            setShowServicesModal(true);
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/cases/${selectedCase.case_id}/services`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        ...formData,
                        case_id: selectedCase.case_id
                    })
                }
            );

            if (response.ok) {
                toast.success('تم إضافة محاولة التبليغ بنجاح');
                setShowModal(false);
                fetchServices(selectedCase.case_id);
                fetchAllServicesForCases();
                resetForm();
            } else {
                toast.error('فشل في إضافة التبليغ');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({
            service_method: 'bailiff',
            defendant_name: '',
            defendant_address: '',
            defendant_phone: '',
            attempt_date: new Date().toISOString().split('T')[0],
            attempt_result: 'pending',
            service_notes: ''
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

    const getResultBadge = (result, compact = false) => {
        const config = {
            served: { icon: CheckCircle, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'تم التبليغ' },
            not_served: { icon: XCircle, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'لم يتم' },
            refused: { icon: AlertCircle, bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'رفض' },
            pending: { icon: Clock, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'معلق' }
        };
        const { icon: Icon, bg, text, label } = config[result] || config.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${bg} ${text} flex items-center gap-1 whitespace-nowrap`}>
                <Icon size={compact ? 10 : 12} />
                {!compact && label}
            </span>
        );
    };

    const getMethodLabel = (method) => {
        const methods = {
            bailiff: 'محضر',
            mail: 'بريد',
            publication: 'نشر',
            electronic: 'إلكتروني'
        };
        return methods[method] || method;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader
                title="إدارة التبليغات"
                subtitle="تسجيل ومتابعة التبليغات القضائية"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

                    {/* Statistics Cards - Horizontal Scroll on Mobile */}
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-4 mb-4 scrollbar-hide">
                        <StatCard icon={FileText} value={stats.total} label="إجمالي التبليغات" color="blue" />
                        <StatCard icon={TrendingUp} value={stats.today} label="تبليغات اليوم" color="purple" />
                        <StatCard icon={CheckCircle} value={stats.served} label="تم التبليغ" color="green" />
                        <StatCard icon={Clock} value={stats.pending} label="معلق" color="yellow" />
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
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

                            {/* Filter Controls */}
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
                                    <option value="no_services">بدون تبليغات</option>
                                    <option value="served">تم التبليغ</option>
                                    <option value="pending">معلق</option>
                                    <option value="not_served">لم يتم</option>
                                    <option value="refused">رفض</option>
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

                        {/* Advanced Filters */}
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

                    {/* Add Service Button - Mobile */}
                    {selectedCase && (
                        <div className="lg:hidden mb-4">
                            <button
                                onClick={() => setShowModal(true)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 font-medium text-sm"
                            >
                                <Plus size={18} />
                                إضافة محاولة تبليغ
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
                                                        {servicesByCase[caseItem.case_id]?.length > 0 && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <Bell size={10} className="text-gray-400" />
                                                                <span className="text-[10px] text-gray-400">
                                                                    {servicesByCase[caseItem.case_id].length} تبليغ
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {getLatestServiceStatus(caseItem.case_id) && getResultBadge(getLatestServiceStatus(caseItem.case_id), true)}
                                                        <ChevronLeft size={16} className="text-gray-400 lg:hidden" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Services List - Desktop */}
                        <div className="hidden lg:block lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-blue-500" />
                                    {selectedCase ? `تبليغات: ${selectedCase.case_number || selectedCase.title}` : 'التبليغات'}
                                </h2>
                                {selectedCase && (
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        إضافة تبليغ
                                    </button>
                                )}
                            </div>

                            <div className="p-4">
                                <ServicesContent
                                    selectedCase={selectedCase}
                                    services={services}
                                    getResultBadge={getResultBadge}
                                    getMethodLabel={getMethodLabel}
                                    formatDate={formatDate}
                                    onAddService={() => setShowModal(true)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Services Modal */}
                {showServicesModal && selectedCase && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:hidden">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-blue-500" />
                                    تبليغات القضية
                                </h2>
                                <button
                                    onClick={() => setShowServicesModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-4">
                                {/* Case Info */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4">
                                    <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
                                        {selectedCase.case_number || selectedCase.title}
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400">{selectedCase.case_type}</p>
                                </div>

                                <ServicesContent
                                    selectedCase={selectedCase}
                                    services={services}
                                    getResultBadge={getResultBadge}
                                    getMethodLabel={getMethodLabel}
                                    formatDate={formatDate}
                                    onAddService={() => {
                                        setShowServicesModal(false);
                                        setShowModal(true);
                                    }}
                                    isMobile={true}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Service Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-blue-500" />
                                    إضافة محاولة تبليغ
                                </h2>
                                <button
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleAddService} className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">طريقة التبليغ *</label>
                                        <select
                                            value={formData.service_method}
                                            onChange={(e) => setFormData({ ...formData, service_method: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                            required
                                        >
                                            <option value="bailiff">محضر</option>
                                            <option value="mail">بريد</option>
                                            <option value="publication">نشر</option>
                                            <option value="electronic">إلكتروني</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">نتيجة التبليغ *</label>
                                        <select
                                            value={formData.attempt_result}
                                            onChange={(e) => setFormData({ ...formData, attempt_result: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                            required
                                        >
                                            <option value="pending">معلق</option>
                                            <option value="served">تم التبليغ</option>
                                            <option value="not_served">لم يتم التبليغ</option>
                                            <option value="refused">رفض الاستلام</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">اسم المدعى عليه *</label>
                                    <input
                                        type="text"
                                        value={formData.defendant_name}
                                        onChange={(e) => setFormData({ ...formData, defendant_name: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">العنوان</label>
                                        <input
                                            type="text"
                                            value={formData.defendant_address}
                                            onChange={(e) => setFormData({ ...formData, defendant_address: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">رقم الهاتف</label>
                                        <input
                                            type="text"
                                            value={formData.defendant_phone}
                                            onChange={(e) => setFormData({ ...formData, defendant_phone: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">تاريخ المحاولة *</label>
                                    <input
                                        type="date"
                                        value={formData.attempt_date}
                                        onChange={(e) => setFormData({ ...formData, attempt_date: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ملاحظات</label>
                                    <textarea
                                        value={formData.service_notes}
                                        onChange={(e) => setFormData({ ...formData, service_notes: e.target.value })}
                                        rows={2}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium text-sm">
                                        إضافة
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

// Services Content Component (reusable for desktop and mobile)
const ServicesContent = ({ selectedCase, services, getResultBadge, getMethodLabel, formatDate, onAddService, isMobile = false }) => {
    if (!selectedCase) {
        return (
            <div className="text-center py-12">
                <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">اختر قضية لعرض تبليغاتها</p>
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <div className="text-center py-8">
                <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد محاولات تبليغ</p>
                <button
                    onClick={onAddService}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-flex items-center gap-2 text-sm"
                >
                    <Plus size={16} />
                    إضافة أول تبليغ
                </button>
            </div>
        );
    }

    // Mobile: Card View
    if (isMobile) {
        return (
            <div className="space-y-3">
                {services.map(service => (
                    <div key={service.service_id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{service.defendant_name}</p>
                            {getResultBadge(service.attempt_result)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>الطريقة: {getMethodLabel(service.service_method)}</span>
                            <span>التاريخ: {formatDate(service.attempt_date)}</span>
                        </div>
                        {service.defendant_phone && (
                            <p className="text-xs text-gray-400 mt-1">{service.defendant_phone}</p>
                        )}
                    </div>
                ))}
                <button
                    onClick={onAddService}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-2"
                >
                    <Plus size={16} />
                    إضافة تبليغ جديد
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
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">المدعى عليه</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">الطريقة</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">التاريخ</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">الحالة</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {services.map(service => (
                        <tr key={service.service_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="px-4 py-3">
                                <p className="font-medium text-gray-900 dark:text-white">{service.defendant_name}</p>
                                {service.defendant_phone && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{service.defendant_phone}</p>
                                )}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                {getMethodLabel(service.service_method)}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                {formatDate(service.attempt_date)}
                            </td>
                            <td className="px-4 py-3">
                                {getResultBadge(service.attempt_result)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ServicesManagement;
