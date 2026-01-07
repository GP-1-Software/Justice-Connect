// ============================================
// Cases Management - إدارة القضايا
// Mobile Responsive Version
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Scale,
    Calendar,
    User,
    FileText,
    ChevronDown,
    ChevronUp,
    Eye,
    Clock,
    CheckCircle,
    AlertCircle,
    Gavel,
    Shield,
    RefreshCw,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

// Stage configuration
const STAGES = {
    'submitted': { label: 'تم التقديم', color: '#9e9e9e', bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-700 dark:text-gray-300' },
    'under_review': { label: 'قيد المراجعة', color: '#ff9800', bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-400' },
    'update_required': { label: 'مطلوب تعديل', color: '#ff5252', bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-400' },
    'ready_for_registration': { label: 'جاهزة للتسجيل', color: '#64b5f6', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400' },
    'registered': { label: 'مسجلة رسمياً', color: '#2e7d32', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400' },
    'service_in_progress': { label: 'قيد التبليغ', color: '#1e88e5', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400' },
    'service_completed': { label: 'تم التبليغ', color: '#43a047', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400' },
    'awaiting_response': { label: 'بانتظار الرد', color: '#fb8c00', bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-400' },
    'first_hearing_scheduled': { label: 'أول جلسة مجدولة', color: '#1565c0', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400' },
    'hearings_ongoing': { label: 'جلسات جارية', color: '#42a5f5', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400' },
    'judgment_issued': { label: 'صدر الحكم', color: '#2e7d32', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400' },
    'appeal_period': { label: 'فترة الاستئناف', color: '#ffeb3b', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-700 dark:text-yellow-400' },
    'in_execution': { label: 'قيد التنفيذ', color: '#7b1fa2', bgColor: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-700 dark:text-purple-400' },
    'fully_executed': { label: 'منفذة بالكامل', color: '#00e676', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400' }
};

const CasesManagement = () => {
    const navigate = useNavigate();
    const [allCases, setAllCases] = useState([]); // All cases for stats
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stageFilter, setStageFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedCase, setExpandedCase] = useState(null);
    const [stageChanging, setStageChanging] = useState(null);
    const [showStageModal, setShowStageModal] = useState(false);
    const [selectedCaseForStage, setSelectedCaseForStage] = useState(null);

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            // Always fetch all cases (no filter in API) - filter in frontend
            const response = await fetch('http://localhost:5000/api/court-clerk/cases', {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setAllCases(data.data || []);
            } else {
                toast.error('فشل في تحميل القضايا');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('حدث خطأ أثناء التحميل');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleStageChange = async (caseId, newStage) => {
        setStageChanging(caseId);
        try {
            const response = await fetch(
                `http://localhost:5000/api/court-clerk/cases/${caseId}/stage`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        new_stage: newStage,
                        reason: `تم تغيير المرحلة إلى ${STAGES[newStage]?.label || newStage}`
                    })
                }
            );

            if (response.ok) {
                toast.success(`تم تحديث المرحلة إلى: ${STAGES[newStage]?.label}`);
                setShowStageModal(false);
                setSelectedCaseForStage(null);
                fetchCases();
            } else {
                const data = await response.json();
                toast.error(data.error || 'فشل في تحديث المرحلة');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('حدث خطأ أثناء التحديث');
        } finally {
            setStageChanging(null);
        }
    };

    const filteredCases = useMemo(() => {
        return allCases.filter(c => {
            // Filter by stage first
            if (stageFilter && c.case_stage !== stageFilter) return false;

            // Then filter by search term
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            return (
                c.case_number?.toLowerCase().includes(search) ||
                c.title?.toLowerCase().includes(search) ||
                c.court_name?.toLowerCase().includes(search)
            );
        });
    }, [allCases, stageFilter, searchTerm]);

    // Stats - always calculated from ALL cases (not filtered)
    const stats = useMemo(() => {
        return [
            { stage: 'submitted', count: allCases.filter(c => c.case_stage === 'submitted').length },
            { stage: 'under_review', count: allCases.filter(c => c.case_stage === 'under_review').length },
            { stage: 'registered', count: allCases.filter(c => c.case_stage === 'registered').length },
            { stage: 'hearings_ongoing', count: allCases.filter(c => c.case_stage === 'hearings_ongoing').length },
            { stage: 'judgment_issued', count: allCases.filter(c => c.case_stage === 'judgment_issued').length },
            { stage: 'in_execution', count: allCases.filter(c => c.case_stage === 'in_execution').length },
            { stage: 'fully_executed', count: allCases.filter(c => c.case_stage === 'fully_executed').length }
        ];
    }, [allCases]);

    const getStageIcon = (stage, size = 16) => {
        switch (stage) {
            case 'submitted':
            case 'under_review':
                return <Clock size={size} />;
            case 'registered':
            case 'service_completed':
                return <CheckCircle size={size} />;
            case 'update_required':
                return <AlertCircle size={size} />;
            case 'judgment_issued':
                return <Gavel size={size} />;
            case 'in_execution':
            case 'fully_executed':
                return <Shield size={size} />;
            default:
                return <Scale size={size} />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const openStageModal = (caseItem) => {
        setSelectedCaseForStage(caseItem);
        setShowStageModal(true);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader
                title="إدارة القضايا"
                subtitle="عرض ومتابعة جميع القضايا ومراحلها"
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

                    {/* Search & Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="بحث بالرقم أو العنوان..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pr-9 pl-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={stageFilter}
                                    onChange={(e) => setStageFilter(e.target.value)}
                                    className="flex-1 sm:flex-none px-3 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">جميع المراحل</option>
                                    {Object.entries(STAGES).map(([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-2.5 rounded-xl transition ${showFilters ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                >
                                    <Filter size={18} />
                                </button>

                                <button
                                    onClick={() => fetchCases(true)}
                                    disabled={refreshing}
                                    className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl"
                                >
                                    <RefreshCw size={18} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">من تاريخ</label>
                                    <input type="date" className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">إلى تاريخ</label>
                                    <input type="date" className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">المحكمة</label>
                                    <input type="text" className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" placeholder="اسم المحكمة" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">نوع الدعوى</label>
                                    <select className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg">
                                        <option value="">الكل</option>
                                        <option value="civil">مدني</option>
                                        <option value="criminal">جنائي</option>
                                        <option value="commercial">تجاري</option>
                                        <option value="labor">عمالي</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 mb-4 scrollbar-hide">
                        {stats.map(({ stage, count }) => (
                            <div
                                key={stage}
                                onClick={() => setStageFilter(stageFilter === stage ? '' : stage)}
                                className={`flex-shrink-0 p-2 sm:p-3 rounded-xl cursor-pointer transition active:scale-95 min-w-[80px] sm:min-w-[100px] ${stageFilter === stage ? 'ring-2 ring-inset ring-blue-500' : ''
                                    } ${STAGES[stage]?.bgColor || 'bg-gray-100 dark:bg-gray-700'}`}
                            >
                                <p className="text-lg sm:text-2xl font-bold" style={{ color: STAGES[stage]?.color }}>{count}</p>
                                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">{STAGES[stage]?.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Cases List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">جاري التحميل...</p>
                        </div>
                    ) : filteredCases.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                            <Scale size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">لا توجد قضايا</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredCases.map((caseItem) => (
                                <div key={caseItem.case_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {/* Case Header */}
                                    <div
                                        className="p-3 sm:p-4 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700 transition"
                                        onClick={() => setExpandedCase(expandedCase === caseItem.case_id ? null : caseItem.case_id)}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                <div
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: `${STAGES[caseItem.case_stage]?.color}20` }}
                                                >
                                                    {getStageIcon(caseItem.case_stage, 18)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{caseItem.case_number}</h3>
                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{caseItem.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span
                                                    className="px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium hidden sm:inline-block"
                                                    style={{
                                                        backgroundColor: `${STAGES[caseItem.case_stage]?.color}20`,
                                                        color: STAGES[caseItem.case_stage]?.color
                                                    }}
                                                >
                                                    {STAGES[caseItem.case_stage]?.label || caseItem.case_stage}
                                                </span>
                                                {expandedCase === caseItem.case_id ?
                                                    <ChevronUp size={18} className="text-gray-400" /> :
                                                    <ChevronDown size={18} className="text-gray-400" />
                                                }
                                            </div>
                                        </div>

                                        {/* Mobile Stage Badge */}
                                        <div className="sm:hidden mt-2">
                                            <span
                                                className="px-2 py-1 rounded-full text-[10px] font-medium inline-block"
                                                style={{
                                                    backgroundColor: `${STAGES[caseItem.case_stage]?.color}20`,
                                                    color: STAGES[caseItem.case_stage]?.color
                                                }}
                                            >
                                                {STAGES[caseItem.case_stage]?.label || caseItem.case_stage}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Case Details (Expanded) */}
                                    {expandedCase === caseItem.case_id && (
                                        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50">
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div>
                                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">المحكمة</p>
                                                    <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white">{caseItem.court_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">نوع الدعوى</p>
                                                    <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white">{caseItem.case_type || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">تاريخ التقديم</p>
                                                    <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white">{formatDate(caseItem.created_at)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">آخر تحديث</p>
                                                    <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white">{formatDate(caseItem.stage_updated_at)}</p>
                                                </div>
                                            </div>

                                            {/* Stage Change Button - Mobile */}
                                            <button
                                                onClick={() => openStageModal(caseItem)}
                                                className="w-full mb-3 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 text-sm flex items-center justify-center gap-2 lg:hidden"
                                            >
                                                <RefreshCw size={16} />
                                                تغيير المرحلة
                                            </button>

                                            {/* Stage Change - Desktop */}
                                            <div className="hidden lg:block border-t border-gray-200 dark:border-gray-600 pt-3 mb-3">
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">تغيير المرحلة:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(STAGES).map(([key, { label, color }]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => handleStageChange(caseItem.case_id, key)}
                                                            disabled={stageChanging === caseItem.case_id || caseItem.case_stage === key}
                                                            className={`px-2 py-1 text-[10px] font-semibold rounded-full transition ${caseItem.case_stage === key ? 'ring-2 ring-offset-1 dark:ring-offset-gray-800' : 'hover:opacity-80'
                                                                }`}
                                                            style={{
                                                                backgroundColor: `${color}35`,
                                                                color: color
                                                            }}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                <button
                                                    onClick={() => caseItem.filing_id ? navigate(`/court-clerk/filings/${caseItem.filing_id}`) : toast.error('لا يوجد ملف لائحة لهذه القضية')}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-xs sm:text-sm"
                                                >
                                                    <Eye size={16} />
                                                    <span className="hidden sm:inline">التفاصيل</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/court-clerk/hearings?case=${caseItem.case_id}`)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 text-xs sm:text-sm"
                                                >
                                                    <Calendar size={16} />
                                                    <span className="hidden sm:inline">الجلسات</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/court-clerk/decisions?case=${caseItem.case_id}`)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 text-xs sm:text-sm"
                                                >
                                                    <Gavel size={16} />
                                                    <span className="hidden sm:inline">القرارات</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stage Change Modal - Mobile */}
                {showStageModal && selectedCaseForStage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:hidden">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <RefreshCw className="text-blue-500" size={20} />
                                    تغيير المرحلة
                                </h2>
                                <button
                                    onClick={() => { setShowStageModal(false); setSelectedCaseForStage(null); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4">
                                    <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">{selectedCaseForStage.case_number}</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 truncate">{selectedCaseForStage.title}</p>
                                </div>

                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">اختر المرحلة الجديدة:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(STAGES).map(([key, { label, color }]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleStageChange(selectedCaseForStage.case_id, key)}
                                            disabled={stageChanging === selectedCaseForStage.case_id || selectedCaseForStage.case_stage === key}
                                            className={`p-3 text-xs font-semibold rounded-xl transition text-right ${selectedCaseForStage.case_stage === key ? 'ring-2 ring-blue-500' : ''
                                                }`}
                                            style={{
                                                backgroundColor: `${color}20`,
                                                color: color
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CasesManagement;
