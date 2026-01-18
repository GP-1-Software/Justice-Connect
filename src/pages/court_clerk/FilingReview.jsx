// ============================================
// Filing Review - صفحة مراجعة اللائحة
// Mobile Responsive Version
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FileText,
    Download,
    CheckCircle,
    XCircle,
    AlertCircle,
    Send,
    Paperclip,
    User,
    Building,
    Briefcase,
    Phone,
    Mail,
    ChevronDown,
    ChevronUp,
    Scale,
    Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const FilingReview = () => {
    const navigate = useNavigate();
    const { filing_id } = useParams();
    const [filing, setFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewAction, setReviewAction] = useState('');
    const [reviewNotes, setReviewNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [requestedChanges, setRequestedChanges] = useState('');
    const [requestedDocuments, setRequestedDocuments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Collapsible sections state for mobile
    const [expandedSections, setExpandedSections] = useState({
        parties: true,
        summary: true,
        requests: false,
        jurisdiction: false,
        attachments: true,
        reviews: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    useEffect(() => {
        fetchFilingDetails();
    }, [filing_id]);

    const fetchFilingDetails = async () => {
        try {
            const response = await fetch(
                `https://justice-connect-mobile.onrender.com/api/court-clerk/filings/${filing_id}`,
                { headers: getAuthHeaders() }
            );

            if (response.ok) {
                const data = await response.json();
                setFiling(data.data);
            } else {
                toast.error('فشل في تحميل تفاصيل اللائحة');
            }
        } catch (error) {
            console.error('Error fetching filing:', error);
            toast.error('حدث خطأ أثناء تحميل اللائحة');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                filing_id,
                review_action: reviewAction,
                review_notes: reviewNotes
            };

            if (reviewAction === 'rejected') {
                payload.rejection_reason = rejectionReason;
            } else if (reviewAction === 'requested_update') {
                payload.requested_changes = requestedChanges;
            } else if (reviewAction === 'requested_documents') {
                payload.requested_documents = requestedDocuments;
            }

            const response = await fetch(
                `https://justice-connect-mobile.onrender.com/api/court-clerk/filings/${filing_id}/review`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                }
            );

            if (response.ok) {
                toast.success('تم إجراء المراجعة بنجاح');
                setShowReviewModal(false);
                fetchFilingDetails();
            } else {
                const data = await response.json();
                toast.error(data.error || 'فشل في إجراء المراجعة');
            }
        } catch (error) {
            console.error('Error reviewing filing:', error);
            toast.error('حدث خطأ أثناء المراجعة');
        } finally {
            setSubmitting(false);
        }
    };

    const openReviewModal = (action) => {
        setReviewAction(action);
        setShowReviewModal(true);
        setReviewNotes('');
        setRejectionReason('');
        setRequestedChanges('');
        setRequestedDocuments('');
    };

    // Section Header Component
    const SectionHeader = ({ title, icon: Icon, section, count }) => (
        <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg border-b border-gray-200 dark:border-gray-600"
        >
            <div className="flex items-center gap-2">
                <Icon size={18} className="text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200">
                    {title}
                    {count !== undefined && <span className="text-gray-500 mr-1">({count})</span>}
                </h2>
            </div>
            {expandedSections[section] ? (
                <ChevronUp size={18} className="text-gray-500" />
            ) : (
                <ChevronDown size={18} className="text-gray-500" />
            )}
        </button>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!filing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <FileText size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">اللائحة غير موجودة</p>
                </div>
            </div>
        );
    }

    const canReview = filing.filing_status === 'submitted' || filing.filing_status === 'under_review';

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Header */}
            <CourtClerkHeader
                title={`لائحة: ${filing.filing_number}`}
                subtitle={`${filing.court_name} - ${filing.city}`}
                showBackButton={true}
                backPath="/court-clerk/inbox"
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

                    {/* Mobile Action Buttons - Fixed at Top */}
                    {canReview && (
                        <div className="lg:hidden bg-white dark:bg-gray-800 rounded-xl shadow-md p-3 mb-4 sticky top-0 z-40">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openReviewModal('accepted')}
                                    className="flex-1 px-3 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 active:scale-95 transition"
                                >
                                    <CheckCircle size={16} />
                                    قبول
                                </button>
                                <button
                                    onClick={() => openReviewModal('rejected')}
                                    className="flex-1 px-3 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 active:scale-95 transition"
                                >
                                    <XCircle size={16} />
                                    رفض
                                </button>
                                <button
                                    onClick={() => openReviewModal('requested_update')}
                                    className="flex-1 px-3 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 active:scale-95 transition"
                                >
                                    <AlertCircle size={16} />
                                    تعديل
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                        {/* Left Side - Filing Details */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Quick Info Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    <InfoField
                                        icon={Briefcase}
                                        label="نوع الدعوى"
                                        value={filing.case_type}
                                    />
                                    <InfoField
                                        icon={Scale}
                                        label="رقم القضية"
                                        value={filing.case?.case_number || 'غير محدد'}
                                    />
                                    <InfoField
                                        icon={Building}
                                        label="المحكمة"
                                        value={filing.court_name}
                                    />
                                    <InfoField
                                        icon={Calendar}
                                        label="تاريخ التقديم"
                                        value={new Date(filing.submitted_at).toLocaleDateString('ar-EG')}
                                    />
                                </div>
                            </div>

                            {/* Parties - Collapsible */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                                <SectionHeader title="أطراف الدعوى" icon={User} section="parties" />
                                {expandedSections.parties && (
                                    <div className="p-4 sm:p-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">المدعي</p>
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{filing.plaintiff_name}</p>
                                                {filing.plaintiff_id_number && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">الهوية: {filing.plaintiff_id_number}</p>
                                                )}
                                            </div>
                                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                <p className="text-xs text-red-600 dark:text-red-400 mb-1">المدعى عليه</p>
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{filing.defendant_name}</p>
                                                {filing.defendant_id_number && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">الهوية: {filing.defendant_id_number}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Filing Summary - Collapsible */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                                <SectionHeader title="ملخص اللائحة" icon={FileText} section="summary" />
                                {expandedSections.summary && (
                                    <div className="p-4 sm:p-6">
                                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                            {filing.filing_summary}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Legal Requests - Collapsible */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                                <SectionHeader title="الطلبات" icon={Scale} section="requests" />
                                {expandedSections.requests && (
                                    <div className="p-4 sm:p-6">
                                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                            {filing.legal_requests}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Jurisdiction Info */}
                            {filing.jurisdiction_info && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                                    <SectionHeader title="الاختصاص القضائي" icon={Building} section="jurisdiction" />
                                    {expandedSections.jurisdiction && (
                                        <div className="p-4 sm:p-6">
                                            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                {filing.jurisdiction_info}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lawyer Response */}
                            {filing.lawyer_response && (
                                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 sm:p-6">
                                    <h2 className="text-sm sm:text-base font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                                        <CheckCircle size={18} className="text-green-600" />
                                        رد المحامي على طلب التعديل
                                    </h2>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{filing.lawyer_response}</p>
                                        {filing.lawyer_response_date && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                تاريخ الرد: {new Date(filing.lawyer_response_date).toLocaleString('ar-EG')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Attachments - Collapsible */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                                <SectionHeader
                                    title="المرفقات"
                                    icon={Paperclip}
                                    section="attachments"
                                    count={filing.attachments?.length || 0}
                                />
                                {expandedSections.attachments && (
                                    <div className="p-4 sm:p-6">
                                        {filing.attachments && filing.attachments.length > 0 ? (
                                            <div className="space-y-2">
                                                {filing.attachments.map(attachment => (
                                                    <div
                                                        key={attachment.attachment_id}
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <FileText size={18} className="text-blue-500 flex-shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                                                                    {attachment.file_name}
                                                                </p>
                                                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                                                    {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={attachment.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition flex-shrink-0"
                                                        >
                                                            <Download size={18} className="text-gray-600 dark:text-gray-400" />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">لا توجد مرفقات</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Reviews History - Collapsible */}
                            {filing.reviews && filing.reviews.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                                    <SectionHeader
                                        title="سجل المراجعات"
                                        icon={CheckCircle}
                                        section="reviews"
                                        count={filing.reviews.length}
                                    />
                                    {expandedSections.reviews && (
                                        <div className="p-4 sm:p-6 space-y-3">
                                            {filing.reviews.map(review => (
                                                <div
                                                    key={review.review_id}
                                                    className={`p-3 rounded-lg text-sm ${review.review_action === 'accepted'
                                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                        : review.review_action === 'rejected'
                                                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                                            : review.review_action === 'requested_update'
                                                                ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                                                                : 'bg-gray-50 dark:bg-gray-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`px-2 py-0.5 text-xs rounded-full ${review.review_action === 'accepted'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                                                            : review.review_action === 'rejected'
                                                                ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'
                                                                : review.review_action === 'requested_update'
                                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300'
                                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                                            }`}>
                                                            {review.review_action === 'accepted' && 'مقبول'}
                                                            {review.review_action === 'rejected' && 'مرفوض'}
                                                            {review.review_action === 'requested_update' && 'طلب تعديل'}
                                                            {review.review_action === 'lawyer_response' && 'رد المحامي'}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {new Date(review.created_at).toLocaleDateString('ar-EG')}
                                                        </span>
                                                    </div>
                                                    {review.review_notes && (
                                                        <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                                                            {review.review_notes}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Side - Actions (Desktop Only) */}
                        <div className="hidden lg:block space-y-6">

                            {/* Lawyer Info */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                    <User size={20} className="text-blue-600" />
                                    المحامي
                                </h2>
                                <div className="space-y-3">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {filing.lawyer?.first_name} {filing.lawyer?.last_name}
                                    </p>
                                    {filing.lawyer?.email && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <Mail size={14} />
                                            {filing.lawyer.email}
                                        </p>
                                    )}
                                    {filing.lawyer?.phone && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <Phone size={14} />
                                            {filing.lawyer.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Review Actions - Desktop */}
                            {canReview ? (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-4">
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">إجراءات المراجعة</h2>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => openReviewModal('accepted')}
                                            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 transition"
                                        >
                                            <CheckCircle size={20} />
                                            قبول اللائحة
                                        </button>
                                        <button
                                            onClick={() => openReviewModal('rejected')}
                                            className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 transition"
                                        >
                                            <XCircle size={20} />
                                            رفض اللائحة
                                        </button>
                                        <button
                                            onClick={() => openReviewModal('requested_update')}
                                            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2 transition"
                                        >
                                            <AlertCircle size={20} />
                                            طلب تعديل
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                                    <p className="text-gray-600 dark:text-gray-400 text-center">
                                        تمت مراجعة هذه اللائحة
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Padding for Mobile */}
                    <div className="h-4 sm:h-8"></div>
                </div>

                {/* Review Modal */}
                {showReviewModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                        {reviewAction === 'accepted' && 'قبول اللائحة'}
                                        {reviewAction === 'rejected' && 'رفض اللائحة'}
                                        {reviewAction === 'requested_update' && 'طلب تعديل'}
                                    </h2>
                                    <button
                                        onClick={() => setShowReviewModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                    >
                                        <XCircle size={20} className="text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleReview} className="p-4 sm:p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            ملاحظات المراجعة
                                        </label>
                                        <textarea
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            rows={3}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500"
                                            placeholder="أدخل ملاحظاتك..."
                                        />
                                    </div>

                                    {reviewAction === 'rejected' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                سبب الرفض *
                                            </label>
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                rows={3}
                                                required
                                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500"
                                                placeholder="أدخل سبب الرفض..."
                                            />
                                        </div>
                                    )}

                                    {reviewAction === 'requested_update' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                التعديلات المطلوبة *
                                            </label>
                                            <textarea
                                                value={requestedChanges}
                                                onChange={(e) => setRequestedChanges(e.target.value)}
                                                rows={3}
                                                required
                                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500"
                                                placeholder="حدد التعديلات المطلوبة..."
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-400 font-medium transition"
                                    >
                                        {submitting ? 'جاري الإرسال...' : 'تأكيد'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewModal(false)}
                                        className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 font-medium transition"
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

// Info Field Component
const InfoField = ({ icon: Icon, label, value }) => (
    <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
            <Icon size={10} className="flex-shrink-0" />
            {label}
        </p>
        <p className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm truncate">{value}</p>
    </div>
);

export default FilingReview;
