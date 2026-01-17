// ============================================
// Case Registration - تسجيل القضايا
// Mobile Responsive Version
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle, Save, Search, FileText, Calendar,
    Receipt, TrendingUp, Clock, Filter, X, ChevronLeft,
    Building, User, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const CaseRegistration = () => {
    const navigate = useNavigate();
    const [readyFilings, setReadyFilings] = useState([]);
    const [registeredCases, setRegisteredCases] = useState([]);
    const [selectedFiling, setSelectedFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCaseType, setFilterCaseType] = useState('all');
    const [filterCourt, setFilterCourt] = useState('all');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [showFilters, setShowFilters] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const [formData, setFormData] = useState({
        registry_number: '',
        official_case_number: '',
        registration_date: new Date().toISOString().split('T')[0],
        court_fees: ''
    });

    useEffect(() => {
        fetchReadyFilings();
        fetchRegisteredCases();
    }, []);

    const fetchReadyFilings = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/filings?status=ready_for_registration',
                { headers: getAuthHeaders() }
            );

            if (response.ok) {
                const data = await response.json();
                setReadyFilings(data.data || []);
            } else {
                toast.error('فشل في تحميل اللوائح');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('حدث خطأ أثناء التحميل');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchRegisteredCases = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/filings?status=registered',
                { headers: getAuthHeaders() }
            );

            if (response.ok) {
                const data = await response.json();
                setRegisteredCases(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching registered cases:', error);
        }
    };

    // Statistics
    const stats = useMemo(() => {
        const readyCount = readyFilings.length;
        const registeredCount = registeredCases.length;
        const today = new Date().toISOString().split('T')[0];
        const registeredToday = registeredCases.filter(c =>
            c.registration_date?.split('T')[0] === today
        ).length;

        return { readyCount, registeredCount, registeredToday };
    }, [readyFilings, registeredCases]);

    // Get unique case types
    const caseTypes = useMemo(() => {
        const types = [...new Set(readyFilings.map(f => f.case_type).filter(Boolean))];
        return types;
    }, [readyFilings]);

    // Get unique courts
    const courts = useMemo(() => {
        const courtList = [...new Set(readyFilings.map(f => f.court_name).filter(Boolean))];
        return courtList;
    }, [readyFilings]);

    // Filtered filings
    const filteredFilings = useMemo(() => {
        let result = [...readyFilings];

        if (searchQuery) {
            const search = searchQuery.toLowerCase();
            result = result.filter(f =>
                f.filing_number?.toLowerCase().includes(search) ||
                f.plaintiff_name?.toLowerCase().includes(search) ||
                f.defendant_name?.toLowerCase().includes(search) ||
                f.court_name?.toLowerCase().includes(search)
            );
        }

        if (filterCaseType !== 'all') {
            result = result.filter(f => f.case_type === filterCaseType);
        }

        if (filterCourt !== 'all') {
            result = result.filter(f => f.court_name === filterCourt);
        }

        if (filterDateFrom) {
            result = result.filter(f => new Date(f.submitted_at) >= new Date(filterDateFrom));
        }
        if (filterDateTo) {
            result = result.filter(f => new Date(f.submitted_at) <= new Date(filterDateTo));
        }

        result.sort((a, b) => {
            if (sortBy === 'date_desc') {
                return new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0);
            } else if (sortBy === 'date_asc') {
                return new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0);
            }
            return 0;
        });

        return result;
    }, [readyFilings, searchQuery, filterCaseType, filterCourt, filterDateFrom, filterDateTo, sortBy]);

    const handleSelectFiling = (filing) => {
        setSelectedFiling(filing);
        // On mobile, open registration modal
        if (window.innerWidth < 1024) {
            setShowRegisterModal(true);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!selectedFiling) {
            toast.error('الرجاء اختيار لائحة');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/filings/${selectedFiling.filing_id}/register`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(formData)
                }
            );

            if (response.ok) {
                toast.success('تم تسجيل القضية بنجاح');
                setSelectedFiling(null);
                setShowRegisterModal(false);
                setFormData({
                    registry_number: '',
                    official_case_number: '',
                    registration_date: new Date().toISOString().split('T')[0],
                    court_fees: ''
                });
                fetchReadyFilings();
                fetchRegisteredCases();
            } else {
                const data = await response.json();
                toast.error(data.error || 'فشل في تسجيل القضية');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('حدث خطأ أثناء التسجيل');
        } finally {
            setSubmitting(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterCaseType('all');
        setFilterCourt('all');
        setFilterDateFrom('');
        setFilterDateTo('');
        setSortBy('date_desc');
    };

    const hasActiveFilters = searchQuery || filterCaseType !== 'all' || filterCourt !== 'all' || filterDateFrom || filterDateTo;

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader
                title="تسجيل القضايا"
                subtitle="تسجيل القضايا رسمياً وإصدار أرقام القيد"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

                    {/* Statistics Cards - Horizontal Scroll on Mobile */}
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-4 mb-4 sm:mb-6 scrollbar-hide">
                        <div className="flex-shrink-0 w-[140px] sm:w-auto bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.readyCount}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">جاهزة للتسجيل</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0 w-[140px] sm:w-auto bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.registeredToday}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">سُجلت اليوم</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0 w-[140px] sm:w-auto bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.registeredCount}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">إجمالي المسجلة</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="بحث بالرقم أو اسم المدعي أو المدعى عليه..."
                                    className="w-full pr-9 pl-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Filter Dropdowns */}
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                                {/* Case Type Dropdown */}
                                <select
                                    value={filterCaseType}
                                    onChange={(e) => setFilterCaseType(e.target.value)}
                                    className="flex-1 sm:flex-none px-3 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="all">جميع أنواع القضايا</option>
                                    {caseTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>

                                {/* Sort Dropdown */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="flex-1 sm:flex-none px-3 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="date_desc">الأحدث أولاً</option>
                                    <option value="date_asc">الأقدم أولاً</option>
                                </select>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-2.5 rounded-xl transition flex items-center gap-1 ${showFilters || hasActiveFilters
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                >
                                    <Filter size={18} />
                                </button>

                                <button
                                    onClick={() => fetchReadyFilings(true)}
                                    disabled={refreshing}
                                    className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                >
                                    <RefreshCw size={18} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
                                </button>

                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-3 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
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
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">المحكمة</label>
                                    <select
                                        value={filterCourt}
                                        onChange={(e) => setFilterCourt(e.target.value)}
                                        className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="all">جميع المحاكم</option>
                                        {courts.map(court => (
                                            <option key={court} value={court}>{court}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">من تاريخ التقديم</label>
                                    <input
                                        type="date"
                                        value={filterDateFrom}
                                        onChange={(e) => setFilterDateFrom(e.target.value)}
                                        className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">إلى تاريخ التقديم</label>
                                    <input
                                        type="date"
                                        value={filterDateTo}
                                        onChange={(e) => setFilterDateTo(e.target.value)}
                                        className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                        {/* Left: Ready Filings List */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                                    اللوائح الجاهزة ({filteredFilings.length})
                                </h2>
                            </div>

                            <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">جاري التحميل...</p>
                                    </div>
                                ) : filteredFilings.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <CheckCircle size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            {readyFilings.length === 0 ? 'لا توجد لوائح جاهزة' : 'لا توجد نتائج'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredFilings.map(filing => (
                                            <div
                                                key={filing.filing_id}
                                                onClick={() => handleSelectFiling(filing)}
                                                className={`p-3 sm:p-4 cursor-pointer transition-all active:scale-[0.99] ${selectedFiling?.filing_id === filing.filing_id
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                                                        {filing.filing_number}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {selectedFiling?.filing_id === filing.filing_id && (
                                                            <CheckCircle size={16} className="text-blue-500" />
                                                        )}
                                                        <ChevronLeft size={16} className="text-gray-400 lg:hidden" />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                        <Building size={12} className="flex-shrink-0" />
                                                        <span className="truncate">{filing.court_name}</span>
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                        <User size={12} className="flex-shrink-0" />
                                                        <span className="truncate">{filing.plaintiff_name} ← {filing.defendant_name}</span>
                                                    </p>
                                                </div>

                                                <span className="inline-block mt-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] sm:text-xs rounded-full">
                                                    {filing.case_type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Registration Form - Desktop Only */}
                        <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Save className="h-5 w-5 text-blue-500" />
                                    بيانات التسجيل
                                </h2>
                            </div>

                            <div className="p-6">
                                {selectedFiling ? (
                                    <RegistrationForm
                                        selectedFiling={selectedFiling}
                                        formData={formData}
                                        setFormData={setFormData}
                                        handleRegister={handleRegister}
                                        submitting={submitting}
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <CheckCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400">اختر لائحة من القائمة لتسجيلها</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Registration Modal */}
                {showRegisterModal && selectedFiling && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:hidden">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Save className="h-5 w-5 text-blue-500" />
                                    تسجيل القضية
                                </h2>
                                <button
                                    onClick={() => setShowRegisterModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-4">
                                <RegistrationForm
                                    selectedFiling={selectedFiling}
                                    formData={formData}
                                    setFormData={setFormData}
                                    handleRegister={handleRegister}
                                    submitting={submitting}
                                    onCancel={() => setShowRegisterModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Registration Form Component (reusable for both desktop and mobile)
const RegistrationForm = ({ selectedFiling, formData, setFormData, handleRegister, submitting, onCancel }) => (
    <form onSubmit={handleRegister} className="space-y-4">
        {/* Selected Filing Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 text-sm flex items-center gap-2">
                <FileText size={14} />
                اللائحة المختارة
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <p className="text-blue-800 dark:text-blue-400">
                    <span className="text-blue-600 dark:text-blue-500">رقم اللائحة:</span> {selectedFiling.filing_number}
                </p>
                <p className="text-blue-800 dark:text-blue-400">
                    <span className="text-blue-600 dark:text-blue-500">المحكمة:</span> {selectedFiling.court_name}
                </p>
                <p className="text-blue-800 dark:text-blue-400">
                    <span className="text-blue-600 dark:text-blue-500">النوع:</span> {selectedFiling.case_type}
                </p>
                <p className="text-blue-800 dark:text-blue-400">
                    <span className="text-blue-600 dark:text-blue-500">المدينة:</span> {selectedFiling.city}
                </p>
            </div>
        </div>

        {/* Registry Number */}
        <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                رقم القيد <span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                required
                value={formData.registry_number}
                onChange={(e) => setFormData({ ...formData, registry_number: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل رقم القيد"
            />
        </div>

        {/* Official Case Number */}
        <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                رقم الدعوى الرسمي <span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                required
                value={formData.official_case_number}
                onChange={(e) => setFormData({ ...formData, official_case_number: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل رقم الدعوى الرسمي"
            />
        </div>

        {/* Registration Date */}
        <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                تاريخ القيد <span className="text-red-500">*</span>
            </label>
            <input
                type="date"
                required
                value={formData.registration_date}
                onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
        </div>

        {/* Court Fees */}
        <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                رسوم الدعوى (₪)
            </label>
            <input
                type="number"
                step="0.01"
                min="0"
                value={formData.court_fees}
                onChange={(e) => setFormData({ ...formData, court_fees: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
            />
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <Receipt size={10} />
                سيتم إنشاء فاتورة تلقائياً إذا كانت الرسوم أكبر من صفر
            </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-2">
            <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 font-medium text-sm"
            >
                <Save size={18} />
                {submitting ? 'جاري التسجيل...' : 'تسجيل القضية'}
            </button>
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-medium text-sm"
                >
                    إلغاء
                </button>
            )}
        </div>
    </form>
);

export default CaseRegistration;
