// Court Clerk - Appeals Management - إدارة الاستئنافات
// Mobile Responsive Version
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Scale, FileText, Clock, CheckCircle, XCircle, AlertTriangle,
    Search, Eye, Calendar, User, Building, Gavel, Send, ArrowRight,
    Plus, RefreshCw, Filter, Award, X, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

// مراحل الاستئناف
const APPEAL_STAGES = {
    appeal_submitted: { label: 'تم التقديم', color: 'blue', icon: FileText },
    appeal_under_review: { label: 'قيد المراجعة', color: 'yellow', icon: Clock },
    appeal_update_required: { label: 'مطلوب تعديل', color: 'orange', icon: AlertTriangle },
    appeal_accepted: { label: 'مقبول', color: 'green', icon: CheckCircle },
    appeal_rejected: { label: 'مرفوض', color: 'red', icon: XCircle },
    appeal_file_transferred: { label: 'تم الإحالة', color: 'purple', icon: Send },
    appeal_hearing_scheduled: { label: 'جلسة مجدولة', color: 'indigo', icon: Calendar },
    appeal_hearings_ongoing: { label: 'جلسات جارية', color: 'blue', icon: Scale },
    appeal_decision_issued: { label: 'صدر الحكم', color: 'green', icon: Gavel },
    appeal_case_closed: { label: 'منتهية', color: 'gray', icon: CheckCircle }
};

const AppealsManagement = () => {
    const navigate = useNavigate();
    const [appeals, setAppeals] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showHearingModal, setShowHearingModal] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showActionsModal, setShowActionsModal] = useState(false);
    const [selectedAppeal, setSelectedAppeal] = useState(null);
    const [closingCase, setClosingCase] = useState(false);

    // Form states
    const [reviewAction, setReviewAction] = useState('');
    const [reviewNotes, setReviewNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [updateRequiredNotes, setUpdateRequiredNotes] = useState('');

    const [transferData, setTransferData] = useState({
        transferred_to_court: '',
        appeal_court_case_number: ''
    });

    const [hearingData, setHearingData] = useState({
        hearing_date: '',
        hearing_time: '',
        hearing_room: '',
        hearing_type: 'first',
        assigned_judge: ''
    });

    const [decisionData, setDecisionData] = useState({
        appeal_decision_type: 'upheld',
        appeal_decision_summary: '',
        appeal_decision_date: new Date().toISOString().split('T')[0],
        appeal_decision_file_url: ''
    });

    useEffect(() => {
        fetchAppeals();
    }, []);

    const fetchAppeals = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/appeals', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setAppeals(data.data || []);
                setStats(data.stats || {});
            }
        } catch (error) {
            toast.error('فشل في تحميل الاستئنافات');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchAppealDetails = async (appealId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/appeals/${appealId}`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedAppeal(data.data);
                return data.data;
            }
        } catch (error) {
            toast.error('فشل في تحميل التفاصيل');
        }
    };

    const filteredAppeals = useMemo(() => {
        let result = appeals;

        switch (activeTab) {
            case 'pending':
                result = result.filter(a => a.appeal_stage === 'appeal_submitted');
                break;
            case 'under_review':
                result = result.filter(a => a.appeal_stage === 'appeal_under_review');
                break;
            case 'update_required':
                result = result.filter(a => a.appeal_stage === 'appeal_update_required');
                break;
            case 'accepted':
                result = result.filter(a => ['appeal_accepted', 'appeal_file_transferred', 'appeal_hearing_scheduled', 'appeal_hearings_ongoing'].includes(a.appeal_stage));
                break;
            case 'rejected':
                result = result.filter(a => a.appeal_stage === 'appeal_rejected');
                break;
            case 'completed':
                result = result.filter(a => ['appeal_decision_issued', 'appeal_case_closed'].includes(a.appeal_stage));
                break;
        }

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(a =>
                a.appeal_number?.toLowerCase().includes(search) ||
                a.original_case?.case_number?.toLowerCase().includes(search) ||
                a.original_case?.title?.toLowerCase().includes(search)
            );
        }

        return result;
    }, [appeals, activeTab, searchTerm]);

    // Actions
    const handleReviewSubmit = async () => {
        if (!reviewAction) {
            toast.error('اختر إجراء');
            return;
        }

        try {
            const body = {
                action: reviewAction,
                notes: reviewNotes
            };
            if (reviewAction === 'reject') body.rejection_reason = rejectionReason;
            if (reviewAction === 'request_update') body.update_required_notes = updateRequiredNotes;

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/appeals/${selectedAppeal.appeal_id}/review`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body)
                }
            );

            if (response.ok) {
                toast.success('تم تحديث حالة الاستئناف');
                setShowReviewModal(false);
                resetForms();
                fetchAppeals();
            } else {
                const error = await response.json();
                toast.error(error.error || 'فشل في تحديث الحالة');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const handleTransferSubmit = async () => {
        if (!transferData.transferred_to_court) {
            toast.error('أدخل اسم المحكمة');
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/appeals/${selectedAppeal.appeal_id}/transfer`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(transferData)
                }
            );

            if (response.ok) {
                toast.success('تم إحالة الملف بنجاح');
                setShowTransferModal(false);
                resetForms();
                fetchAppeals();
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const handleScheduleHearing = async () => {
        if (!hearingData.hearing_date) {
            toast.error('اختر تاريخ الجلسة');
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/appeals/${selectedAppeal.appeal_id}/schedule-hearing`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(hearingData)
                }
            );

            if (response.ok) {
                toast.success('تم جدولة الجلسة بنجاح');
                setShowHearingModal(false);
                resetForms();
                fetchAppeals();
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const handleIssueDecision = async () => {
        if (!decisionData.appeal_decision_summary) {
            toast.error('أدخل ملخص الحكم');
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/appeals/${selectedAppeal.appeal_id}/decision`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(decisionData)
                }
            );

            if (response.ok) {
                toast.success('تم إصدار حكم الاستئناف');
                setShowDecisionModal(false);
                resetForms();
                fetchAppeals();
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const handleCloseCase = async () => {
        try {
            setClosingCase(true);
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/appeals/${selectedAppeal.appeal_id}/close`,
                {
                    method: 'POST',
                    headers: getAuthHeaders()
                }
            );

            if (response.ok) {
                const result = await response.json();
                toast.success(result.message || 'تم إغلاق قضية الاستئناف');
                setShowCloseModal(false);
                resetForms();
                fetchAppeals();
            } else {
                const error = await response.json();
                toast.error(error.error || 'فشل في إغلاق القضية');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        } finally {
            setClosingCase(false);
        }
    };

    const resetForms = () => {
        setReviewAction('');
        setReviewNotes('');
        setRejectionReason('');
        setUpdateRequiredNotes('');
        setTransferData({ transferred_to_court: '', appeal_court_case_number: '' });
        setHearingData({ hearing_date: '', hearing_time: '', hearing_room: '', hearing_type: 'first', assigned_judge: '' });
        setDecisionData({ appeal_decision_type: 'upheld', appeal_decision_summary: '', appeal_decision_date: new Date().toISOString().split('T')[0], appeal_decision_file_url: '' });
        setSelectedAppeal(null);
    };

    const getStageBadge = (stage, compact = false) => {
        const config = APPEAL_STAGES[stage] || { label: stage, color: 'gray', icon: FileText };
        const Icon = config.icon;
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-${config.color}-100 text-${config.color}-700 dark:bg-${config.color}-900/30 dark:text-${config.color}-400 flex items-center gap-1 inline-flex whitespace-nowrap`}>
                <Icon size={compact ? 10 : 12} />
                {config.label}
            </span>
        );
    };

    const tabs = [
        { id: 'pending', label: 'جديدة', count: stats.pending || 0 },
        { id: 'under_review', label: 'قيد المراجعة', count: stats.under_review || 0 },
        { id: 'update_required', label: 'تعديل', count: stats.update_required || 0 },
        { id: 'accepted', label: 'مقبولة', count: (stats.accepted || 0) + (stats.ongoing || 0) },
        { id: 'rejected', label: 'مرفوضة', count: stats.rejected || 0 },
        { id: 'completed', label: 'منتهية', count: stats.completed || 0 }
    ];

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const openActionsModal = async (appeal) => {
        await fetchAppealDetails(appeal.appeal_id);
        setShowActionsModal(true);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader
                title="إدارة الاستئنافات"
                subtitle="مراجعة وإدارة طلبات الاستئناف"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

                    {/* Stats Cards */}
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:gap-4 mb-4 scrollbar-hide">
                        <StatCard icon={FileText} value={stats.pending || 0} label="جديدة" color="blue" />
                        <StatCard icon={Clock} value={stats.under_review || 0} label="قيد المراجعة" color="yellow" />
                        <StatCard icon={CheckCircle} value={stats.accepted || 0} label="مقبولة" color="green" />
                        <StatCard icon={XCircle} value={stats.rejected || 0} label="مرفوضة" color="red" />
                        <StatCard icon={Gavel} value={stats.completed || 0} label="منتهية" color="gray" />
                    </div>

                    {/* Search and Tabs */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4">
                        <div className="flex flex-col sm:flex-row gap-3 mb-3">
                            <div className="flex-1 relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="بحث برقم الاستئناف أو القضية..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pr-9 pl-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <button
                                onClick={() => fetchAppeals(true)}
                                disabled={refreshing}
                                className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl"
                            >
                                <RefreshCw size={18} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition text-xs sm:text-sm ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Appeals List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                            <p className="mt-4 text-gray-500 text-sm">جاري التحميل...</p>
                        </div>
                    ) : filteredAppeals.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                            <Scale className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-base font-medium text-gray-900 dark:text-white">لا توجد استئنافات</h3>
                            <p className="mt-2 text-sm text-gray-500">لا توجد استئنافات في هذا القسم</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAppeals.map(appeal => (
                                <div
                                    key={appeal.appeal_id}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <Scale className="text-blue-600 flex-shrink-0" size={18} />
                                            <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                                {appeal.appeal_number}
                                            </span>
                                        </div>
                                        {getStageBadge(appeal.appeal_stage, true)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        <div>
                                            <span className="text-gray-500">القضية: </span>
                                            <span className="font-medium">{appeal.original_case?.case_number || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">النوع: </span>
                                            <span className="font-medium">
                                                {appeal.appeal_type === 'full_appeal' ? 'كامل' : 'جزئي'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">التاريخ: </span>
                                            <span className="font-medium">{formatDate(appeal.submitted_at)}</span>
                                        </div>
                                        <div className="truncate">
                                            <span className="text-gray-500">المحامي: </span>
                                            <span className="font-medium">
                                                {appeal.original_case?.assigned_lawyer?.first_name} {appeal.original_case?.assigned_lawyer?.last_name}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                        <span className="font-medium">الأسباب: </span>
                                        {appeal.appeal_reasons?.substring(0, 100)}...
                                    </p>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            onClick={async () => {
                                                await fetchAppealDetails(appeal.appeal_id);
                                                setShowDetailsModal(true);
                                            }}
                                            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1"
                                        >
                                            <Eye size={14} />
                                            <span className="hidden sm:inline">التفاصيل</span>
                                        </button>

                                        {/* Desktop Action Buttons */}
                                        <div className="hidden sm:flex gap-2">
                                            {appeal.appeal_stage === 'appeal_submitted' && (
                                                <button
                                                    onClick={async () => {
                                                        await fetchAppealDetails(appeal.appeal_id);
                                                        setShowReviewModal(true);
                                                    }}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm flex items-center gap-1"
                                                >
                                                    <Scale size={14} />
                                                    مراجعة
                                                </button>
                                            )}

                                            {appeal.appeal_stage === 'appeal_accepted' && (
                                                <button
                                                    onClick={async () => {
                                                        await fetchAppealDetails(appeal.appeal_id);
                                                        setShowTransferModal(true);
                                                    }}
                                                    className="px-3 py-2 bg-purple-600 text-white rounded-xl text-sm flex items-center gap-1"
                                                >
                                                    <Send size={14} />
                                                    إحالة
                                                </button>
                                            )}

                                            {['appeal_file_transferred', 'appeal_hearing_scheduled', 'appeal_hearings_ongoing'].includes(appeal.appeal_stage) && (
                                                <>
                                                    <button
                                                        onClick={async () => {
                                                            await fetchAppealDetails(appeal.appeal_id);
                                                            setShowHearingModal(true);
                                                        }}
                                                        className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm flex items-center gap-1"
                                                    >
                                                        <Calendar size={14} />
                                                        جلسة
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            await fetchAppealDetails(appeal.appeal_id);
                                                            setShowDecisionModal(true);
                                                        }}
                                                        className="px-3 py-2 bg-green-600 text-white rounded-xl text-sm flex items-center gap-1"
                                                    >
                                                        <Gavel size={14} />
                                                        حكم
                                                    </button>
                                                </>
                                            )}

                                            {appeal.appeal_stage === 'appeal_decision_issued' && (
                                                <button
                                                    onClick={async () => {
                                                        await fetchAppealDetails(appeal.appeal_id);
                                                        setShowCloseModal(true);
                                                    }}
                                                    className="px-3 py-2 bg-gray-600 text-white rounded-xl text-sm flex items-center gap-1"
                                                >
                                                    <CheckCircle size={14} />
                                                    إغلاق
                                                </button>
                                            )}
                                        </div>

                                        {/* Mobile Actions Button */}
                                        {appeal.appeal_stage !== 'appeal_rejected' && appeal.appeal_stage !== 'appeal_case_closed' && (
                                            <button
                                                onClick={() => openActionsModal(appeal)}
                                                className="sm:hidden flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs flex items-center justify-center gap-1"
                                            >
                                                <ChevronDown size={14} />
                                                الإجراءات
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mobile Actions Modal */}
                {showActionsModal && selectedAppeal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 sm:hidden">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    الإجراءات المتاحة
                                </h2>
                                <button onClick={() => setShowActionsModal(false)} className="p-2">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4">
                                <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">{selectedAppeal.appeal_number}</p>
                                {getStageBadge(selectedAppeal.appeal_stage)}
                            </div>

                            <div className="space-y-2">
                                {selectedAppeal.appeal_stage === 'appeal_submitted' && (
                                    <button
                                        onClick={() => { setShowActionsModal(false); setShowReviewModal(true); }}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2"
                                    >
                                        <Scale size={18} /> مراجعة الاستئناف
                                    </button>
                                )}

                                {selectedAppeal.appeal_stage === 'appeal_accepted' && (
                                    <button
                                        onClick={() => { setShowActionsModal(false); setShowTransferModal(true); }}
                                        className="w-full py-3 bg-purple-600 text-white rounded-xl flex items-center justify-center gap-2"
                                    >
                                        <Send size={18} /> إحالة للمحكمة
                                    </button>
                                )}

                                {['appeal_file_transferred', 'appeal_hearing_scheduled', 'appeal_hearings_ongoing'].includes(selectedAppeal.appeal_stage) && (
                                    <>
                                        <button
                                            onClick={() => { setShowActionsModal(false); setShowHearingModal(true); }}
                                            className="w-full py-3 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2"
                                        >
                                            <Calendar size={18} /> جدولة جلسة
                                        </button>
                                        <button
                                            onClick={() => { setShowActionsModal(false); setShowDecisionModal(true); }}
                                            className="w-full py-3 bg-green-600 text-white rounded-xl flex items-center justify-center gap-2"
                                        >
                                            <Gavel size={18} /> إصدار حكم
                                        </button>
                                    </>
                                )}

                                {selectedAppeal.appeal_stage === 'appeal_decision_issued' && (
                                    <button
                                        onClick={() => { setShowActionsModal(false); setShowCloseModal(true); }}
                                        className="w-full py-3 bg-gray-600 text-white rounded-xl flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} /> إغلاق القضية
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Details Modal */}
                {showDetailsModal && selectedAppeal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Scale className="text-blue-600" size={20} />
                                    {selectedAppeal.appeal_number}
                                </h2>
                                <button onClick={() => setShowDetailsModal(false)} className="p-2">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-500">المرحلة</p>
                                        {getStageBadge(selectedAppeal.appeal_stage)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">النوع</p>
                                        <p className="font-medium text-sm">{selectedAppeal.appeal_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">القضية الأصلية</p>
                                        <p className="font-medium text-sm">{selectedAppeal.original_case?.case_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">تاريخ التقديم</p>
                                        <p className="font-medium text-sm">{formatDate(selectedAppeal.submitted_at)}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">أسباب الاستئناف</h4>
                                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                                        <p className="whitespace-pre-wrap text-sm">{selectedAppeal.appeal_reasons}</p>
                                    </div>
                                </div>

                                {selectedAppeal.stage_history?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">سجل المراحل</h4>
                                        <div className="space-y-1">
                                            {selectedAppeal.stage_history.map((h, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs">
                                                    <span className="text-gray-500">{formatDate(h.created_at)}</span>
                                                    <ArrowRight size={12} className="text-gray-400" />
                                                    <span className="font-medium">{APPEAL_STAGES[h.new_stage]?.label || h.new_stage}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedAppeal.hearings?.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">الجلسات</h4>
                                        <div className="space-y-2">
                                            {selectedAppeal.hearings.map((h, i) => (
                                                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs">
                                                    <Calendar size={14} className="text-blue-600" />
                                                    <span>جلسة {h.hearing_number}</span>
                                                    <span>{h.hearing_date}</span>
                                                    <span>{h.hearing_time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Modal */}
                {showReviewModal && selectedAppeal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Scale className="text-blue-600" size={20} />
                                    مراجعة الاستئناف
                                </h2>
                                <button onClick={() => { setShowReviewModal(false); resetForms(); }} className="p-2">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">اختر الإجراء *</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setReviewAction('accept')}
                                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${reviewAction === 'accept' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600'
                                                }`}
                                        >
                                            <CheckCircle className="text-green-600" size={20} />
                                            <span className="text-xs">قبول</span>
                                        </button>
                                        <button
                                            onClick={() => setReviewAction('reject')}
                                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${reviewAction === 'reject' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'
                                                }`}
                                        >
                                            <XCircle className="text-red-600" size={20} />
                                            <span className="text-xs">رفض</span>
                                        </button>
                                        <button
                                            onClick={() => setReviewAction('request_update')}
                                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${reviewAction === 'request_update' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-600'
                                                }`}
                                        >
                                            <AlertTriangle className="text-orange-600" size={20} />
                                            <span className="text-xs">تعديل</span>
                                        </button>
                                    </div>
                                </div>

                                {reviewAction === 'reject' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">سبب الرفض *</label>
                                        <select
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                        >
                                            <option value="">اختر السبب</option>
                                            <option value="انتهاء مدة الاستئناف">انتهاء مدة الاستئناف</option>
                                            <option value="نقص في المستندات">نقص في المستندات</option>
                                            <option value="عدم استيفاء الشكل القانوني">عدم استيفاء الشكل القانوني</option>
                                            <option value="عدم دفع الرسوم">عدم دفع الرسوم</option>
                                            <option value="أخرى">أخرى</option>
                                        </select>
                                    </div>
                                )}

                                {reviewAction === 'request_update' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">التعديلات المطلوبة *</label>
                                        <textarea
                                            value={updateRequiredNotes}
                                            onChange={(e) => setUpdateRequiredNotes(e.target.value)}
                                            rows={2}
                                            className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                                    <textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        rows={2}
                                        className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleReviewSubmit} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm">
                                        تأكيد
                                    </button>
                                    <button onClick={() => { setShowReviewModal(false); resetForms(); }} className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-xl text-sm">
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transfer Modal */}
                {showTransferModal && selectedAppeal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Send className="text-purple-600" size={20} />
                                    إحالة للمحكمة
                                </h2>
                                <button onClick={() => { setShowTransferModal(false); resetForms(); }} className="p-2">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">اسم محكمة الاستئناف *</label>
                                    <input
                                        type="text"
                                        value={transferData.transferred_to_court}
                                        onChange={(e) => setTransferData({ ...transferData, transferred_to_court: e.target.value })}
                                        className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                        placeholder="محكمة الاستئناف - رام الله"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">رقم القضية في المحكمة</label>
                                    <input
                                        type="text"
                                        value={transferData.appeal_court_case_number}
                                        onChange={(e) => setTransferData({ ...transferData, appeal_court_case_number: e.target.value })}
                                        className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleTransferSubmit} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium text-sm">
                                        إحالة الملف
                                    </button>
                                    <button onClick={() => { setShowTransferModal(false); resetForms(); }} className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-xl text-sm">
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hearing Modal */}
                {showHearingModal && selectedAppeal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="text-indigo-600" size={20} />
                                    جدولة جلسة
                                </h2>
                                <button onClick={() => { setShowHearingModal(false); resetForms(); }} className="p-2">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">التاريخ *</label>
                                        <input
                                            type="date"
                                            value={hearingData.hearing_date}
                                            onChange={(e) => setHearingData({ ...hearingData, hearing_date: e.target.value })}
                                            className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">الوقت</label>
                                        <input
                                            type="time"
                                            value={hearingData.hearing_time}
                                            onChange={(e) => setHearingData({ ...hearingData, hearing_time: e.target.value })}
                                            className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">القاعة</label>
                                    <input
                                        type="text"
                                        value={hearingData.hearing_room}
                                        onChange={(e) => setHearingData({ ...hearingData, hearing_room: e.target.value })}
                                        className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">القاضي</label>
                                    <input
                                        type="text"
                                        value={hearingData.assigned_judge}
                                        onChange={(e) => setHearingData({ ...hearingData, assigned_judge: e.target.value })}
                                        className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleScheduleHearing} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm">
                                        جدولة الجلسة
                                    </button>
                                    <button onClick={() => { setShowHearingModal(false); resetForms(); }} className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-xl text-sm">
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Decision Modal */}
                {showDecisionModal && selectedAppeal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Gavel className="text-green-600" size={20} />
                                    إصدار حكم
                                </h2>
                                <button onClick={() => { setShowDecisionModal(false); resetForms(); }} className="p-2">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">نوع الحكم *</label>
                                    <select
                                        value={decisionData.appeal_decision_type}
                                        onChange={(e) => setDecisionData({ ...decisionData, appeal_decision_type: e.target.value })}
                                        className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    >
                                        <option value="upheld">تأييد الحكم</option>
                                        <option value="modified">تعديل الحكم</option>
                                        <option value="overturned">إلغاء الحكم</option>
                                        <option value="remanded">إعادة للمحكمة الأدنى</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الحكم</label>
                                    <input
                                        type="date"
                                        value={decisionData.appeal_decision_date}
                                        onChange={(e) => setDecisionData({ ...decisionData, appeal_decision_date: e.target.value })}
                                        className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">ملخص الحكم *</label>
                                    <textarea
                                        value={decisionData.appeal_decision_summary}
                                        onChange={(e) => setDecisionData({ ...decisionData, appeal_decision_summary: e.target.value })}
                                        rows={3}
                                        className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleIssueDecision} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium text-sm">
                                        إصدار الحكم
                                    </button>
                                    <button onClick={() => { setShowDecisionModal(false); resetForms(); }} className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-xl text-sm">
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Close Case Modal */}
                {showCloseModal && selectedAppeal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CheckCircle className="text-gray-600" size={20} />
                                    إغلاق القضية
                                </h2>
                                <button onClick={() => { setShowCloseModal(false); resetForms(); }} className="p-2">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                                    <p className="font-bold text-base">{selectedAppeal.appeal_number}</p>
                                    {selectedAppeal.appeal_decision_type && (
                                        <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium ${selectedAppeal.appeal_decision_type === 'upheld' ? 'bg-gray-200 text-gray-700' :
                                            selectedAppeal.appeal_decision_type === 'modified' ? 'bg-yellow-100 text-yellow-700' :
                                                selectedAppeal.appeal_decision_type === 'overturned' ? 'bg-green-100 text-green-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {selectedAppeal.appeal_decision_type === 'upheld' && 'تأييد'}
                                            {selectedAppeal.appeal_decision_type === 'modified' && 'تعديل'}
                                            {selectedAppeal.appeal_decision_type === 'overturned' && 'إلغاء'}
                                            {selectedAppeal.appeal_decision_type === 'remanded' && 'إعادة'}
                                        </span>
                                    )}
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <Award className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                                        <div className="text-xs text-blue-800 dark:text-blue-300">
                                            <p className="font-medium mb-1">ستتم العمليات التالية:</p>
                                            <ul className="list-disc list-inside space-y-0.5">
                                                <li>إغلاق قضية الاستئناف</li>
                                                <li>تحديث حالة القضية الأساسية</li>
                                                <li>إشعار المحامي والعميل</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                                        <p className="text-xs text-amber-800 dark:text-amber-300">
                                            <span className="font-medium">تنبيه:</span> هذا الإجراء نهائي ولا يمكن التراجع عنه.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleCloseCase}
                                        disabled={closingCase}
                                        className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {closingCase ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={16} />
                                                جاري الإغلاق...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} />
                                                تأكيد الإغلاق
                                            </>
                                        )}
                                    </button>
                                    <button onClick={() => { setShowCloseModal(false); resetForms(); }} className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-xl text-sm">
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, value, label, color }) => (
    <div className="flex-shrink-0 w-[110px] sm:w-auto bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
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

export default AppealsManagement;
