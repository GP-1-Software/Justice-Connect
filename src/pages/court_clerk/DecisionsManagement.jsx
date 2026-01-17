// Court Clerk - Decisions Management
// Mobile Responsive Version
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Scale, Plus, FileText, AlertTriangle, Info, Gavel, FileQuestion,
    Search, Filter, Clock, CheckCircle, TrendingUp, Calendar, ChevronLeft,
    RefreshCw, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const DecisionsManagement = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [decisions, setDecisions] = useState([]);
    const [allDecisions, setAllDecisions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDecisionsModal, setShowDecisionsModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCaseType, setFilterCaseType] = useState('all');
    const [filterDecisionType, setFilterDecisionType] = useState('all');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [showFilters, setShowFilters] = useState(false);

    const [formData, setFormData] = useState({
        decision_type: 'preliminary',
        decision_title: '',
        decision_summary: '',
        ruling: '',
        in_favor_of: '',
        is_appealable: true,
        appeal_deadline: '',
        decision_date: new Date().toISOString().split('T')[0]
    });

    const DECISION_TYPE_INFO = {
        preliminary: {
            label: 'قرار تمهيدي',
            icon: FileQuestion,
            color: 'blue',
            stageEffect: 'لا يغيّر مرحلة الدعوى',
            description: 'قرار مؤقت أثناء سير الدعوى'
        },
        final_judgment: {
            label: 'حكم نهائي',
            icon: Gavel,
            color: 'red',
            stageEffect: 'يغيّر مرحلة الدعوى',
            description: 'الحكم الفاصل في الدعوى'
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    useEffect(() => {
        if (cases.length > 0) {
            fetchAllDecisionsForCases();
        }
    }, [cases]);

    const fetchCases = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/cases', {
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

    const fetchAllDecisionsForCases = async () => {
        try {
            const allDecisionsArray = [];
            for (const caseItem of cases) {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/cases/${caseItem.case_id}/decisions`, {
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        allDecisionsArray.push(...data.data);
                    }
                }
            }
            setAllDecisions(allDecisionsArray);
        } catch (error) {
            console.error('Failed to fetch all decisions:', error);
        }
    };

    const fetchDecisions = async (caseId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/cases/${caseId}/decisions`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setDecisions(data.data || []);
            }
        } catch (error) {
            toast.error('فشل في تحميل القرارات');
        }
    };

    // Statistics
    const stats = useMemo(() => {
        const total = allDecisions.length;
        const preliminary = allDecisions.filter(d => d.decision_type === 'preliminary').length;
        const finalJudgment = allDecisions.filter(d => d.decision_type === 'final_judgment').length;
        const appealable = allDecisions.filter(d => d.is_appealable && d.decision_type === 'final_judgment').length;

        return { total, preliminary, finalJudgment, appealable };
    }, [allDecisions]);

    const decisionsByCase = useMemo(() => {
        const grouped = {};
        allDecisions.forEach(decision => {
            if (!grouped[decision.case_id]) {
                grouped[decision.case_id] = [];
            }
            grouped[decision.case_id].push(decision);
        });
        return grouped;
    }, [allDecisions]);

    const caseHasDecisionWithType = (caseId, type) => {
        const caseDecisions = decisionsByCase[caseId] || [];
        return caseDecisions.some(d => d.decision_type === type);
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

        if (filterDecisionType !== 'all') {
            if (filterDecisionType === 'no_decisions') {
                result = result.filter(c => !decisionsByCase[c.case_id] || decisionsByCase[c.case_id].length === 0);
            } else {
                result = result.filter(c => caseHasDecisionWithType(c.case_id, filterDecisionType));
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
    }, [cases, searchQuery, filterCaseType, filterDecisionType, sortBy, decisionsByCase]);

    const filteredDecisions = useMemo(() => {
        let result = [...decisions];

        if (filterDateFrom) {
            result = result.filter(d => new Date(d.decision_date) >= new Date(filterDateFrom));
        }
        if (filterDateTo) {
            result = result.filter(d => new Date(d.decision_date) <= new Date(filterDateTo));
        }

        result.sort((a, b) => {
            if (sortBy === 'date_desc') {
                return new Date(b.decision_date) - new Date(a.decision_date);
            } else if (sortBy === 'date_asc') {
                return new Date(a.decision_date) - new Date(b.decision_date);
            }
            return 0;
        });

        return result;
    }, [decisions, filterDateFrom, filterDateTo, sortBy]);

    const handleSelectCase = (caseItem) => {
        setSelectedCase(caseItem);
        fetchDecisions(caseItem.case_id);
        if (window.innerWidth < 1024) {
            setShowDecisionsModal(true);
        }
    };

    const handleIssueDecision = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/cases/${selectedCase.case_id}/decisions`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(formData)
                }
            );

            if (response.ok) {
                toast.success('تم إصدار القرار بنجاح');
                setShowModal(false);
                fetchDecisions(selectedCase.case_id);
                fetchAllDecisionsForCases();
                resetForm();
            } else {
                toast.error('فشل في إصدار القرار');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({
            decision_type: 'preliminary',
            decision_title: '',
            decision_summary: '',
            ruling: '',
            in_favor_of: '',
            is_appealable: true,
            appeal_deadline: '',
            decision_date: new Date().toISOString().split('T')[0]
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterCaseType('all');
        setFilterDecisionType('all');
        setFilterDateFrom('');
        setFilterDateTo('');
        setSortBy('date_desc');
    };

    const hasActiveFilters = searchQuery || filterCaseType !== 'all' || filterDecisionType !== 'all' || filterDateFrom || filterDateTo;

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
                title="القرارات والأحكام"
                subtitle="إدخال وإدارة القرارات القضائية"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

                    {/* Statistics Cards */}
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-4 mb-4 scrollbar-hide">
                        <StatCard icon={Scale} value={stats.total} label="إجمالي القرارات" color="blue" />
                        <StatCard icon={FileQuestion} value={stats.preliminary} label="قرارات تمهيدية" color="purple" />
                        <StatCard icon={Gavel} value={stats.finalJudgment} label="أحكام نهائية" color="red" />
                        <StatCard icon={Clock} value={stats.appealable} label="قابلة للاستئناف" color="orange" />
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
                                    value={filterDecisionType}
                                    onChange={(e) => setFilterDecisionType(e.target.value)}
                                    className="flex-1 sm:flex-none px-3 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="all">جميع القرارات</option>
                                    <option value="no_decisions">بدون قرارات</option>
                                    <option value="preliminary">تمهيدي</option>
                                    <option value="final_judgment">نهائي</option>
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

                    {/* Add Decision Button - Mobile */}
                    {selectedCase && (
                        <div className="lg:hidden mb-4">
                            <button
                                onClick={() => setShowModal(true)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 font-medium text-sm"
                            >
                                <Plus size={18} />
                                إصدار قرار جديد
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
                                                        {decisionsByCase[caseItem.case_id] && (
                                                            <div className="flex gap-1 mt-1.5 flex-wrap">
                                                                {decisionsByCase[caseItem.case_id].some(d => d.decision_type === 'final_judgment') && (
                                                                    <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] rounded-full">
                                                                        نهائي
                                                                    </span>
                                                                )}
                                                                {decisionsByCase[caseItem.case_id].some(d => d.decision_type === 'preliminary') && (
                                                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] rounded-full">
                                                                        تمهيدي
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ChevronLeft size={16} className="text-gray-400 lg:hidden flex-shrink-0 mt-1" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Decisions List - Desktop */}
                        <div className="hidden lg:block lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-blue-500" />
                                    {selectedCase ? `قرارات: ${selectedCase.case_number || selectedCase.title}` : 'القرارات'}
                                </h2>
                                {selectedCase && (
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        إصدار قرار
                                    </button>
                                )}
                            </div>

                            <div className="p-4">
                                <DecisionsContent
                                    selectedCase={selectedCase}
                                    decisions={filteredDecisions}
                                    formatDate={formatDate}
                                    onAddDecision={() => setShowModal(true)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Decisions Modal */}
                {showDecisionsModal && selectedCase && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:hidden">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-blue-500" />
                                    قرارات القضية
                                </h2>
                                <button
                                    onClick={() => setShowDecisionsModal(false)}
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

                                <DecisionsContent
                                    selectedCase={selectedCase}
                                    decisions={filteredDecisions}
                                    formatDate={formatDate}
                                    onAddDecision={() => {
                                        setShowDecisionsModal(false);
                                        setShowModal(true);
                                    }}
                                    isMobile={true}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Issue Decision Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[95vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-blue-500" />
                                    إصدار قرار جديد
                                </h2>
                                <button
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleIssueDecision} className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">نوع القرار *</label>
                                        <select
                                            value={formData.decision_type}
                                            onChange={(e) => setFormData({ ...formData, decision_type: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                            required
                                        >
                                            <option value="preliminary">قرار تمهيدي</option>
                                            <option value="final_judgment">حكم نهائي</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">تاريخ القرار *</label>
                                        <input
                                            type="date"
                                            value={formData.decision_date}
                                            onChange={(e) => setFormData({ ...formData, decision_date: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Decision Type Info */}
                                {formData.decision_type && DECISION_TYPE_INFO[formData.decision_type] && (
                                    <div className={`p-3 rounded-xl border ${formData.decision_type === 'preliminary'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        }`}>
                                        <div className="flex items-start gap-2">
                                            <Info className={`mt-0.5 flex-shrink-0 ${formData.decision_type === 'preliminary' ? 'text-blue-600' : 'text-red-600'}`} size={16} />
                                            <div className="text-xs">
                                                <p className={`font-medium ${formData.decision_type === 'preliminary' ? 'text-blue-800 dark:text-blue-300' : 'text-red-800 dark:text-red-300'}`}>
                                                    {DECISION_TYPE_INFO[formData.decision_type].description}
                                                </p>
                                                <p className={`mt-0.5 ${formData.decision_type === 'preliminary' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    ⚡ {DECISION_TYPE_INFO[formData.decision_type].stageEffect}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">عنوان القرار *</label>
                                    <input
                                        type="text"
                                        value={formData.decision_title}
                                        onChange={(e) => setFormData({ ...formData, decision_title: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ملخص القرار *</label>
                                    <textarea
                                        value={formData.decision_summary}
                                        onChange={(e) => setFormData({ ...formData, decision_summary: e.target.value })}
                                        rows={2}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">منطوق الحكم</label>
                                    <textarea
                                        value={formData.ruling}
                                        onChange={(e) => setFormData({ ...formData, ruling: e.target.value })}
                                        rows={2}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">لصالح</label>
                                        <select
                                            value={formData.in_favor_of}
                                            onChange={(e) => setFormData({ ...formData, in_favor_of: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                        >
                                            <option value="">اختر</option>
                                            <option value="plaintiff">المدعي</option>
                                            <option value="defendant">المدعى عليه</option>
                                            <option value="partial">جزئي</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 mb-1.5">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_appealable}
                                                onChange={(e) => setFormData({ ...formData, is_appealable: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-xs sm:text-sm font-medium">قابل للاستئناف</span>
                                        </label>
                                        {formData.is_appealable && (
                                            <input
                                                type="date"
                                                value={formData.appeal_deadline}
                                                onChange={(e) => setFormData({ ...formData, appeal_deadline: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-2.5 text-sm"
                                                placeholder="آخر موعد"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium text-sm">
                                        إصدار القرار
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

// Decisions Content Component
const DecisionsContent = ({ selectedCase, decisions, formatDate, onAddDecision, isMobile = false }) => {
    if (!selectedCase) {
        return (
            <div className="text-center py-12">
                <Scale size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">اختر قضية لعرض قراراتها</p>
            </div>
        );
    }

    if (decisions.length === 0) {
        return (
            <div className="text-center py-8">
                <Scale size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد قرارات صادرة</p>
                <button
                    onClick={onAddDecision}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-flex items-center gap-2 text-sm"
                >
                    <Plus size={16} />
                    إصدار أول قرار
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {decisions.map(decision => (
                <div key={decision.decision_id} className={`p-3 sm:p-4 border rounded-xl ${decision.decision_type === 'final_judgment'
                    ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            {decision.decision_type === 'final_judgment' ? (
                                <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                                    <Gavel className="text-red-600 dark:text-red-400" size={isMobile ? 14 : 18} />
                                </div>
                            ) : (
                                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                                    <FileQuestion className="text-blue-600 dark:text-blue-400" size={isMobile ? 14 : 18} />
                                </div>
                            )}
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{decision.decision_title}</h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${decision.decision_type === 'final_judgment'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                            {decision.decision_type === 'final_judgment' ? 'نهائي' : 'تمهيدي'}
                        </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">{decision.decision_summary}</p>

                    {decision.ruling && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg mb-2">
                            <p className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">المنطوق:</p>
                            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{decision.ruling}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 items-center text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDate(decision.decision_date)}
                        </span>
                        {decision.is_appealable && decision.appeal_deadline && (
                            <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                <AlertTriangle size={10} />
                                استئناف: {formatDate(decision.appeal_deadline)}
                            </span>
                        )}
                        {decision.in_favor_of && (
                            <span className="text-green-600 dark:text-green-400">
                                لصالح: {decision.in_favor_of === 'plaintiff' ? 'المدعي' : decision.in_favor_of === 'defendant' ? 'المدعى عليه' : 'جزئي'}
                            </span>
                        )}
                    </div>
                </div>
            ))}

            <button
                onClick={onAddDecision}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-2"
            >
                <Plus size={16} />
                إصدار قرار جديد
            </button>
        </div>
    );
};

export default DecisionsManagement;
