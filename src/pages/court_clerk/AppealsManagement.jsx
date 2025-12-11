// Court Clerk - Appeals Management - إدارة الاستئنافات
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Scale, FileText, Clock, CheckCircle, XCircle, AlertTriangle,
    Search, Eye, Calendar, User, Building, Gavel, Send, ArrowRight,
    Plus, RefreshCw, Filter, Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

// مراحل الاستئناف
const APPEAL_STAGES = {
    appeal_submitted: { label: 'تم تقديم الاستئناف', color: 'blue', icon: FileText },
    appeal_under_review: { label: 'قيد المراجعة', color: 'yellow', icon: Clock },
    appeal_update_required: { label: 'مطلوب تعديل', color: 'orange', icon: AlertTriangle },
    appeal_accepted: { label: 'تم قبول الاستئناف', color: 'green', icon: CheckCircle },
    appeal_rejected: { label: 'تم رفض الاستئناف', color: 'red', icon: XCircle },
    appeal_file_transferred: { label: 'تم إحالة الملف', color: 'purple', icon: Send },
    appeal_hearing_scheduled: { label: 'تم تحديد جلسة', color: 'indigo', icon: Calendar },
    appeal_hearings_ongoing: { label: 'جلسات جارية', color: 'blue', icon: Scale },
    appeal_decision_issued: { label: 'صدر حكم الاستئناف', color: 'green', icon: Gavel },
    appeal_case_closed: { label: 'انتهت القضية', color: 'gray', icon: CheckCircle }
};

const AppealsManagement = () => {
    const navigate = useNavigate();
    const [appeals, setAppeals] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showHearingModal, setShowHearingModal] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
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

    const fetchAppeals = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/court-clerk/appeals', {
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
        }
    };

    const fetchAppealDetails = async (appealId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/court-clerk/appeals/${appealId}`, {
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

    // Filter appeals based on tab
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
                `http://localhost:5000/api/court-clerk/appeals/${selectedAppeal.appeal_id}/review`,
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
                `http://localhost:5000/api/court-clerk/appeals/${selectedAppeal.appeal_id}/transfer`,
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
                `http://localhost:5000/api/court-clerk/appeals/${selectedAppeal.appeal_id}/schedule-hearing`,
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
                `http://localhost:5000/api/court-clerk/appeals/${selectedAppeal.appeal_id}/decision`,
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
                `http://localhost:5000/api/court-clerk/appeals/${selectedAppeal.appeal_id}/close`,
                {
                    method: 'POST',
                    headers: getAuthHeaders()
                }
            );

            if (response.ok) {
                const result = await response.json();
                toast.success(result.message || 'تم إغلاق قضية الاستئناف وتحديث حالة القضية');
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

    const getStageBadge = (stage) => {
        const config = APPEAL_STAGES[stage] || { label: stage, color: 'gray', icon: FileText };
        const Icon = config.icon;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-700 dark:bg-${config.color}-900/30 dark:text-${config.color}-400 flex items-center gap-1 inline-flex`}>
                <Icon size={14} />
                {config.label}
            </span>
        );
    };

    const tabs = [
        { id: 'pending', label: 'جديدة', count: stats.pending || 0 },
        { id: 'under_review', label: 'قيد المراجعة', count: stats.under_review || 0 },
        { id: 'update_required', label: 'بحاجة تعديل', count: stats.update_required || 0 },
        { id: 'accepted', label: 'مقبولة', count: (stats.accepted || 0) + (stats.ongoing || 0) },
        { id: 'rejected', label: 'مرفوضة', count: stats.rejected || 0 },
        { id: 'completed', label: 'منتهية', count: stats.completed || 0 }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader
                title="إدارة الاستئنافات"
                subtitle="مراجعة وإدارة طلبات الاستئناف"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">استئنافات جديدة</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.pending || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <Clock className="text-yellow-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">قيد المراجعة</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.under_review || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">مقبولة</p>
                                <p className="text-2xl font-bold text-green-600">{stats.accepted || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <XCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">مرفوضة</p>
                                <p className="text-2xl font-bold text-red-600">{stats.rejected || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <Gavel className="text-gray-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">منتهية</p>
                                <p className="text-2xl font-bold text-gray-600">{stats.completed || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="بحث برقم الاستئناف أو رقم القضية..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-10 pl-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <button
                            onClick={fetchAppeals}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                            <RefreshCw size={18} />
                            تحديث
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-gray-300 dark:bg-gray-600'
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">جاري التحميل...</p>
                    </div>
                ) : filteredAppeals.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                        <Scale className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">لا توجد استئنافات</h3>
                        <p className="mt-2 text-gray-500">لا توجد استئنافات في هذا القسم</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAppeals.map(appeal => (
                            <div
                                key={appeal.appeal_id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Scale className="text-blue-600" size={24} />
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                                {appeal.appeal_number}
                                            </h3>
                                            {getStageBadge(appeal.appeal_stage)}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <div>
                                                <span className="text-gray-500">القضية الأصلية:</span>
                                                <p className="font-medium">{appeal.original_case?.case_number || '-'}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">نوع الاستئناف:</span>
                                                <p className="font-medium">
                                                    {appeal.appeal_type === 'full_appeal' ? 'استئناف كامل' :
                                                        appeal.appeal_type === 'partial_appeal' ? 'استئناف جزئي' : appeal.appeal_type}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">تاريخ التقديم:</span>
                                                <p className="font-medium">
                                                    {new Date(appeal.submitted_at).toLocaleDateString('ar-EG')}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">المحامي:</span>
                                                <p className="font-medium">
                                                    {appeal.original_case?.assigned_lawyer?.first_name} {appeal.original_case?.assigned_lawyer?.last_name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={async () => {
                                                await fetchAppealDetails(appeal.appeal_id);
                                                setShowDetailsModal(true);
                                            }}
                                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                                        >
                                            <Eye size={16} />
                                            التفاصيل
                                        </button>

                                        {/* Action buttons based on stage */}
                                        {appeal.appeal_stage === 'appeal_submitted' && (
                                            <button
                                                onClick={async () => {
                                                    await fetchAppealDetails(appeal.appeal_id);
                                                    setShowReviewModal(true);
                                                }}
                                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                            >
                                                <Scale size={16} />
                                                مراجعة
                                            </button>
                                        )}

                                        {appeal.appeal_stage === 'appeal_accepted' && (
                                            <button
                                                onClick={async () => {
                                                    await fetchAppealDetails(appeal.appeal_id);
                                                    setShowTransferModal(true);
                                                }}
                                                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                                            >
                                                <Send size={16} />
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
                                                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                                                >
                                                    <Calendar size={16} />
                                                    جلسة
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        await fetchAppealDetails(appeal.appeal_id);
                                                        setShowDecisionModal(true);
                                                    }}
                                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                                                >
                                                    <Gavel size={16} />
                                                    حكم
                                                </button>
                                            </>
                                        )}

                                        {/* إغلاق القضية - يظهر بعد إصدار الحكم */}
                                        {appeal.appeal_stage === 'appeal_decision_issued' && (
                                            <button
                                                onClick={async () => {
                                                    await fetchAppealDetails(appeal.appeal_id);
                                                    setShowCloseModal(true);
                                                }}
                                                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-1"
                                            >
                                                <CheckCircle size={16} />
                                                إغلاق القضية
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Show reasons preview */}
                                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">أسباب الاستئناف:</span> {appeal.appeal_reasons?.substring(0, 150)}...
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedAppeal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Scale className="text-blue-600" />
                                تفاصيل الاستئناف - {selectedAppeal.appeal_number}
                            </h2>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">رقم الاستئناف</p>
                                    <p className="font-bold">{selectedAppeal.appeal_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">المرحلة</p>
                                    {getStageBadge(selectedAppeal.appeal_stage)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">نوع الاستئناف</p>
                                    <p className="font-medium">{selectedAppeal.appeal_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">القضية الأصلية</p>
                                    <p className="font-medium">{selectedAppeal.original_case?.case_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">تاريخ التقديم</p>
                                    <p className="font-medium">{new Date(selectedAppeal.submitted_at).toLocaleDateString('ar-EG')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">المحامي</p>
                                    <p className="font-medium">{selectedAppeal.original_case?.assigned_lawyer?.first_name} {selectedAppeal.original_case?.assigned_lawyer?.last_name}</p>
                                </div>
                            </div>

                            {/* Appeal Reasons */}
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">أسباب الاستئناف</h4>
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <p className="whitespace-pre-wrap">{selectedAppeal.appeal_reasons}</p>
                                </div>
                            </div>

                            {/* Documents */}
                            {selectedAppeal.appeal_documents?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">المستندات المرفقة</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAppeal.appeal_documents.map((doc, i) => (
                                            <a
                                                key={i}
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg flex items-center gap-2"
                                            >
                                                <FileText size={16} />
                                                {doc.name || `مستند ${i + 1}`}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stage History */}
                            {selectedAppeal.stage_history?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">سجل المراحل</h4>
                                    <div className="space-y-2">
                                        {selectedAppeal.stage_history.map((h, i) => (
                                            <div key={i} className="flex items-center gap-3 text-sm">
                                                <span className="text-gray-500">
                                                    {new Date(h.created_at).toLocaleDateString('ar-EG')}
                                                </span>
                                                <ArrowRight size={14} className="text-gray-400" />
                                                <span className="font-medium">{APPEAL_STAGES[h.new_stage]?.label || h.new_stage}</span>
                                                {h.reason && <span className="text-gray-500">- {h.reason}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hearings */}
                            {selectedAppeal.hearings?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">الجلسات</h4>
                                    <div className="space-y-2">
                                        {selectedAppeal.hearings.map((h, i) => (
                                            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <Calendar size={18} className="text-blue-600" />
                                                <span>جلسة {h.hearing_number}</span>
                                                <span>{h.hearing_date}</span>
                                                <span>{h.hearing_time}</span>
                                                <span className="text-gray-500">قاعة {h.hearing_room}</span>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-xl w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Scale className="text-blue-600" />
                            مراجعة الاستئناف
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اختر الإجراء *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setReviewAction('accept')}
                                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${reviewAction === 'accept' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600'
                                            }`}
                                    >
                                        <CheckCircle className="text-green-600" size={24} />
                                        <span className="text-sm">قبول</span>
                                    </button>
                                    <button
                                        onClick={() => setReviewAction('reject')}
                                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${reviewAction === 'reject' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'
                                            }`}
                                    >
                                        <XCircle className="text-red-600" size={24} />
                                        <span className="text-sm">رفض</span>
                                    </button>
                                    <button
                                        onClick={() => setReviewAction('request_update')}
                                        className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${reviewAction === 'request_update' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-600'
                                            }`}
                                    >
                                        <AlertTriangle className="text-orange-600" size={24} />
                                        <span className="text-sm">طلب تعديل</span>
                                    </button>
                                </div>
                            </div>

                            {reviewAction === 'reject' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سبب الرفض *</label>
                                    <select
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التعديلات المطلوبة *</label>
                                    <textarea
                                        value={updateRequiredNotes}
                                        onChange={(e) => setUpdateRequiredNotes(e.target.value)}
                                        rows={3}
                                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="اكتب التعديلات المطلوبة من المحامي..."
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملاحظات إضافية</label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    rows={2}
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleReviewSubmit}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    تأكيد
                                </button>
                                <button
                                    onClick={() => { setShowReviewModal(false); resetForms(); }}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && selectedAppeal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Send className="text-purple-600" />
                            إحالة لمحكمة الاستئناف
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اسم محكمة الاستئناف *</label>
                                <input
                                    type="text"
                                    value={transferData.transferred_to_court}
                                    onChange={(e) => setTransferData({ ...transferData, transferred_to_court: e.target.value })}
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="مثال: محكمة الاستئناف - رام الله"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رقم القضية في محكمة الاستئناف</label>
                                <input
                                    type="text"
                                    value={transferData.appeal_court_case_number}
                                    onChange={(e) => setTransferData({ ...transferData, appeal_court_case_number: e.target.value })}
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={handleTransferSubmit} className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                    إحالة الملف
                                </button>
                                <button onClick={() => { setShowTransferModal(false); resetForms(); }} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg">
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hearing Modal */}
            {showHearingModal && selectedAppeal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="text-indigo-600" />
                            جدولة جلسة استئناف
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التاريخ *</label>
                                    <input
                                        type="date"
                                        value={hearingData.hearing_date}
                                        onChange={(e) => setHearingData({ ...hearingData, hearing_date: e.target.value })}
                                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الوقت</label>
                                    <input
                                        type="time"
                                        value={hearingData.hearing_time}
                                        onChange={(e) => setHearingData({ ...hearingData, hearing_time: e.target.value })}
                                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">القاعة</label>
                                <input
                                    type="text"
                                    value={hearingData.hearing_room}
                                    onChange={(e) => setHearingData({ ...hearingData, hearing_room: e.target.value })}
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">القاضي</label>
                                <input
                                    type="text"
                                    value={hearingData.assigned_judge}
                                    onChange={(e) => setHearingData({ ...hearingData, assigned_judge: e.target.value })}
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={handleScheduleHearing} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    جدولة الجلسة
                                </button>
                                <button onClick={() => { setShowHearingModal(false); resetForms(); }} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg">
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Decision Modal */}
            {showDecisionModal && selectedAppeal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-xl w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Gavel className="text-green-600" />
                            إصدار حكم الاستئناف
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع الحكم *</label>
                                <select
                                    value={decisionData.appeal_decision_type}
                                    onChange={(e) => setDecisionData({ ...decisionData, appeal_decision_type: e.target.value })}
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="upheld">تأييد الحكم</option>
                                    <option value="modified">تعديل الحكم</option>
                                    <option value="overturned">إلغاء الحكم</option>
                                    <option value="remanded">إعادة للمحكمة الأدنى</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاريخ الحكم</label>
                                <input
                                    type="date"
                                    value={decisionData.appeal_decision_date}
                                    onChange={(e) => setDecisionData({ ...decisionData, appeal_decision_date: e.target.value })}
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملخص الحكم *</label>
                                <textarea
                                    value={decisionData.appeal_decision_summary}
                                    onChange={(e) => setDecisionData({ ...decisionData, appeal_decision_summary: e.target.value })}
                                    rows={4}
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="اكتب ملخص حكم الاستئناف..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={handleIssueDecision} className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    إصدار الحكم
                                </button>
                                <button onClick={() => { setShowDecisionModal(false); resetForms(); }} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg">
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Case Modal */}
            {showCloseModal && selectedAppeal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="text-gray-600" />
                            إغلاق قضية الاستئناف
                        </h2>

                        <div className="space-y-4">
                            {/* Appeal Summary */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-2">رقم الاستئناف</p>
                                <p className="font-bold text-lg">{selectedAppeal.appeal_number}</p>

                                {selectedAppeal.appeal_decision_type && (
                                    <div className="mt-3 pt-3 border-t dark:border-gray-600">
                                        <p className="text-sm text-gray-500 mb-1">حكم الاستئناف</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedAppeal.appeal_decision_type === 'upheld' ? 'bg-gray-200 text-gray-700' :
                                            selectedAppeal.appeal_decision_type === 'modified' ? 'bg-yellow-100 text-yellow-700' :
                                                selectedAppeal.appeal_decision_type === 'overturned' ? 'bg-green-100 text-green-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {selectedAppeal.appeal_decision_type === 'upheld' && 'تأييد الحكم'}
                                            {selectedAppeal.appeal_decision_type === 'modified' && 'تعديل الحكم'}
                                            {selectedAppeal.appeal_decision_type === 'overturned' && 'إلغاء الحكم'}
                                            {selectedAppeal.appeal_decision_type === 'remanded' && 'إعادة للمحكمة الأدنى'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                                <Award className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="text-sm text-blue-800 dark:text-blue-300">
                                    <p className="font-medium mb-1">ستتم العمليات التالية:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>إغلاق قضية الاستئناف</li>
                                        <li>تحديث حالة القضية الأساسية إلى <strong>"مُنفذة بالكامل"</strong></li>
                                        <li>إشعار المحامي والعميل بانتهاء القضية</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="text-sm text-amber-800 dark:text-amber-300">
                                    <p className="font-medium mb-1">تنبيه هام:</p>
                                    <p>هذا الإجراء نهائي ولا يمكن التراجع عنه.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCloseCase}
                                    disabled={closingCase}
                                    className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {closingCase ? (
                                        <>
                                            <RefreshCw className="animate-spin" size={18} />
                                            جاري الإغلاق...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} />
                                            تأكيد إغلاق القضية
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => { setShowCloseModal(false); resetForms(); }}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppealsManagement;
