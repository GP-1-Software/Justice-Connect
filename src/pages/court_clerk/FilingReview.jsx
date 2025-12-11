// ============================================
// Filing Review - صفحة مراجعة اللائحة
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
    Paperclip
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

    useEffect(() => {
        fetchFilingDetails();
    }, [filing_id]);

    const fetchFilingDetails = async () => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/court-clerk/filings/${filing_id}`,
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
                `http://localhost:5000/api/court-clerk/filings/${filing_id}/review`,
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!filing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <FileText size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">اللائحة غير موجودة</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Header */}
            <CourtClerkHeader 
                title={`مراجعة اللائحة رقم: ${filing.filing_number}`}
                subtitle={`المحكمة: ${filing.court_name} - ${filing.city}`}
                showBackButton={true}
                backPath="/court-clerk/inbox"
            />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Side - Filing Details */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Basic Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">معلومات الدعوى</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoField label="نوع الدعوى" value={filing.case_type} />
                                <InfoField label="رقم القضية" value={filing.case?.case_number || 'غير محدد'} />
                                <InfoField label="المحكمة" value={filing.court_name} />
                                <InfoField label="المدينة" value={filing.city} />
                            </div>
                        </div>

                        {/* Parties */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">أطراف الدعوى</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">المدعي</h3>
                                    <p className="text-gray-900 dark:text-white">{filing.plaintiff_name}</p>
                                    {filing.plaintiff_id_number && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">الهوية: {filing.plaintiff_id_number}</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">المدعى عليه</h3>
                                    <p className="text-gray-900 dark:text-white">{filing.defendant_name}</p>
                                    {filing.defendant_id_number && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">الهوية: {filing.defendant_id_number}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Filing Content */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">ملخص اللائحة</h2>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{filing.filing_summary}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">الطلبات</h2>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{filing.legal_requests}</p>
                        </div>

                        {filing.jurisdiction_info && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">الاختصاص القضائي</h2>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{filing.jurisdiction_info}</p>
                            </div>
                        )}

                        {/* Lawyer Response Section */}
                        {filing.lawyer_response && (
                            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg shadow-md p-6">
                                <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                                    <CheckCircle size={20} className="text-green-600" />
                                    رد المحامي على طلب التعديل
                                </h2>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{filing.lawyer_response}</p>
                                    {filing.lawyer_response_date && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                            تاريخ الرد: {new Date(filing.lawyer_response_date).toLocaleString('ar-EG')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                <Paperclip size={20} />
                                المرفقات ({filing.attachments?.length || 0})
                            </h2>
                            {filing.attachments && filing.attachments.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Original Filing Attachments */}
                                    {filing.attachments.filter(a => a.attachment_type !== 'update_response').length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">مرفقات اللائحة الأصلية</h3>
                                            <div className="space-y-2">
                                                {filing.attachments.filter(a => a.attachment_type !== 'update_response').map(attachment => (
                                                    <div key={attachment.attachment_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <FileText size={20} className="text-blue-500" />
                                                            <div>
                                                                <p className="font-medium text-gray-800 dark:text-gray-200">{attachment.file_name}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {attachment.attachment_type} - {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={attachment.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                                                        >
                                                            <Download size={20} className="text-gray-600 dark:text-gray-400" />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Lawyer Response Attachments */}
                                    {filing.attachments.filter(a => a.attachment_type === 'update_response').length > 0 && (
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                                            <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                                                <CheckCircle size={16} />
                                                مرفقات رد المحامي
                                            </h3>
                                            <div className="space-y-2">
                                                {filing.attachments.filter(a => a.attachment_type === 'update_response').map(attachment => (
                                                    <div key={attachment.attachment_id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <FileText size={20} className="text-green-500" />
                                                            <div>
                                                                <p className="font-medium text-gray-800 dark:text-gray-200">{attachment.file_name}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {new Date(attachment.created_at).toLocaleString('ar-EG')} - {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={attachment.file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition"
                                                        >
                                                            <Download size={20} className="text-green-600 dark:text-green-400" />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">لا توجد مرفقات</p>
                            )}
                        </div>

                        {/* Lawyer Events (Notes & Documents) */}
                        {filing.lawyerEvents && filing.lawyerEvents.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg shadow-md p-6">
                                <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                                    <FileText size={20} className="text-blue-600" />
                                    أنشطة المحامي وملاحظاته
                                </h2>
                                <div className="space-y-3">
                                    {filing.lawyerEvents.map(event => (
                                        <div key={event.event_id} className={`p-4 rounded-lg ${
                                            event.event_type === 'postpone' 
                                                ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700' 
                                                : 'bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700'
                                        }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    event.event_type === 'postpone'
                                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300'
                                                }`}>
                                                    {event.event_type === 'document' && 'مستند / مذكرة'}
                                                    {event.event_type === 'postpone' && 'طلب تأجيل'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(event.created_at).toLocaleString('ar-EG')}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{event.title}</h4>
                                            {event.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews History */}
                        {filing.reviews && filing.reviews.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">سجل المراجعات والردود</h2>
                                <div className="space-y-3">
                                    {filing.reviews.map(review => (
                                        <div key={review.review_id} className={`p-4 rounded-lg ${
                                            review.review_action === 'lawyer_response' 
                                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                                                : 'bg-gray-50 dark:bg-gray-700'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    review.review_action === 'lawyer_response'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                                                        : review.review_action === 'requested_update'
                                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300'
                                                        : review.review_action === 'accepted'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                                                        : review.review_action === 'rejected'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                                }`}>
                                                    {review.review_action === 'lawyer_response' && 'رد المحامي'}
                                                    {review.review_action === 'requested_update' && 'طلب تعديل'}
                                                    {review.review_action === 'accepted' && 'مقبول'}
                                                    {review.review_action === 'rejected' && 'مرفوض'}
                                                    {review.review_action === 'requested_documents' && 'طلب مستندات'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(review.created_at).toLocaleString('ar-EG')}
                                                </span>
                                            </div>
                                            {review.review_notes && (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                                    {review.review_notes}
                                                </p>
                                            )}
                                            {review.requested_changes && (
                                                <div className="text-sm text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 p-2 rounded mb-2">
                                                    <strong>التعديلات المطلوبة:</strong> {review.requested_changes}
                                                </div>
                                            )}
                                            {review.requested_documents && (
                                                <div className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                                                    <strong>المستندات المرفقة:</strong> {review.requested_documents}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Actions */}
                    <div className="space-y-6">
                        
                        {/* Lawyer & Client Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">المحامي</h2>
                            <p className="font-medium text-gray-900 dark:text-white">{filing.lawyer?.first_name} {filing.lawyer?.last_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{filing.lawyer?.email}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{filing.lawyer?.phone}</p>
                        </div>

                        {/* Review Actions */}
                        {filing.filing_status === 'submitted' || filing.filing_status === 'under_review' ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">إجراءات المراجعة</h2>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => openReviewModal('accepted')}
                                        className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={20} />
                                        قبول اللائحة
                                    </button>
                                    <button
                                        onClick={() => openReviewModal('rejected')}
                                        className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={20} />
                                        رفض اللائحة
                                    </button>
                                    <button
                                        onClick={() => openReviewModal('requested_update')}
                                        className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                                    >
                                        <AlertCircle size={20} />
                                        طلب تعديل
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <p className="text-gray-600 dark:text-gray-400 text-center">
                                    تمت مراجعة هذه اللائحة
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {reviewAction === 'accepted' && 'قبول اللائحة'}
                            {reviewAction === 'rejected' && 'رفض اللائحة'}
                            {reviewAction === 'requested_update' && 'طلب تعديل'}
                        </h2>

                        <form onSubmit={handleReview}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        ملاحظات المراجعة
                                    </label>
                                    <textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        rows={4}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
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
                                            rows={4}
                                            required
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
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
                                            rows={4}
                                            required
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                                            placeholder="حدد التعديلات المطلوبة..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                                >
                                    {submitting ? 'جاري الإرسال...' : 'تأكيد'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoField = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="font-medium text-gray-800 dark:text-gray-200">{value}</p>
    </div>
);

export default FilingReview;
