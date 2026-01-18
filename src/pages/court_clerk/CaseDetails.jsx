import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowRight,
    ArrowLeft,
    Loader2,
    AlertCircle,
    Calendar,
    FileText,
    Scale,
    User,
    Clock,
    CheckCircle,
    Shield,
    Gavel
} from 'lucide-react';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';
import { getAuthHeaders } from '../../utils/authHelpers';

const STAGES = {
    submitted: { label: 'تم التقديم', color: '#9e9e9e' },
    under_review: { label: 'قيد المراجعة', color: '#ff9800' },
    update_required: { label: 'مطلوب تعديل', color: '#ff5252' },
    ready_for_registration: { label: 'جاهزة للتسجيل', color: '#64b5f6' },
    registered: { label: 'مسجلة رسمياً', color: '#2e7d32' },
    service_in_progress: { label: 'قيد التبليغ', color: '#1e88e5' },
    service_completed: { label: 'تم التبليغ', color: '#43a047' },
    awaiting_response: { label: 'بانتظار الرد', color: '#fb8c00' },
    first_hearing_scheduled: { label: 'أول جلسة مجدولة', color: '#1565c0' },
    hearings_ongoing: { label: 'جلسات جارية', color: '#42a5f5' },
    judgment_issued: { label: 'صدر الحكم', color: '#2e7d32' },
    appeal_period: { label: 'فترة الاستئناف', color: '#ffeb3b' },
    in_execution: { label: 'قيد التنفيذ', color: '#7b1fa2' },
    fully_executed: { label: 'منفذة بالكامل', color: '#00e676' }
};

const infoRow = (label, value) => (
    <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value || '-'}</p>
    </div>
);

const CourtClerkCaseDetails = () => {
    const { caseId } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!caseId) return;
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`https://justice-connect-mobile.onrender.com/api/court-clerk/cases/${caseId}`, {
                    headers: getAuthHeaders()
                });
                if (!response.ok) {
                    throw new Error('فشل في تحميل بيانات القضية');
                }
                const data = await response.json();
                setCaseData(data.data);
            } catch (err) {
                console.error(err);
                setError(err.message || 'حدث خطأ غير متوقع');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [caseId]);

    const stageInfo = useMemo(() => {
        if (!caseData?.case_stage) return null;
        return STAGES[caseData.case_stage] || null;
    }, [caseData?.case_stage]);

    const filingInfo = useMemo(() => {
        if (!caseData?.filing) return null;
        return Array.isArray(caseData.filing) ? caseData.filing[0] : caseData.filing;
    }, [caseData?.filing]);

    const hearings = useMemo(() => {
        if (!caseData?.hearings) return [];
        return Array.isArray(caseData.hearings) ? caseData.hearings : [];
    }, [caseData?.hearings]);

    const decisions = useMemo(() => {
        if (!caseData?.decisions) return [];
        return Array.isArray(caseData.decisions) ? caseData.decisions : [];
    }, [caseData?.decisions]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col" dir="rtl">
                <CourtClerkHeader title="تفاصيل القضية" subtitle="جاري التحميل..." />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col" dir="rtl">
                <CourtClerkHeader title="تفاصيل القضية" subtitle="حدث خطأ" />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-lg text-gray-800 dark:text-gray-100 mb-2">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة
                    </button>
                </div>
            </div>
        );
    }

    if (!caseData) {
        return null;
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader
                title="تفاصيل القضية"
                subtitle={caseData.case_number ? `القضية ${caseData.case_number}` : 'عرض بيانات القضية'}
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة
                    </button>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">رقم القضية</p>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{caseData.case_number}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{caseData.title}</p>
                            </div>
                            {stageInfo && (
                                <div className="flex flex-col items-end gap-2">
                                    <span
                                        className="px-4 py-2 rounded-full text-sm font-medium"
                                        style={{
                                            backgroundColor: `${stageInfo.color}20`,
                                            color: stageInfo.color
                                        }}
                                    >
                                        {stageInfo.label}
                                    </span>
                                    {caseData.stage_updated_at && (
                                        <p className="text-xs text-gray-500">
                                            آخر تحديث: {new Date(caseData.stage_updated_at).toLocaleDateString('ar-EG')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                            {infoRow('المحكمة', caseData.court_name)}
                            {infoRow('نوع الدعوى', caseData.case_type)}
                            {infoRow('تاريخ التقديم', caseData.created_at ? new Date(caseData.created_at).toLocaleDateString('ar-EG') : '-')}
                            {infoRow('عدد الجلسات', hearings.length)}
                            {infoRow('عدد القرارات', decisions.length)}
                            {infoRow('الأولوية', caseData.priority === 'high' ? 'عالية' : caseData.priority === 'low' ? 'منخفضة' : 'عادية')}
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="text-blue-500" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">بيانات العميل</h3>
                            </div>
                            {caseData.client ? (
                                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    <p><strong>الاسم:</strong> {caseData.client.full_name || `${caseData.client.first_name || ''} ${caseData.client.last_name || ''}`}</p>
                                    <p><strong>الهوية:</strong> {caseData.client.id_number || '-'}</p>
                                    <p><strong>البريد:</strong> {caseData.client.email || '-'}</p>
                                    <p><strong>الهاتف:</strong> {caseData.client.phone || '-'}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">لا توجد بيانات عميل</p>
                            )}
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <Scale className="text-green-500" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">بيانات المحامي</h3>
                            </div>
                            {caseData.lawyer ? (
                                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    <p><strong>الاسم:</strong> {`${caseData.lawyer.first_name || ''} ${caseData.lawyer.last_name || ''}`}</p>
                                    <p><strong>البريد:</strong> {caseData.lawyer.email || '-'}</p>
                                    <p><strong>الهاتف:</strong> {caseData.lawyer.phone || '-'}</p>
                                    <p><strong>الاختصاص:</strong> {caseData.lawyer.specialization || '-'}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">لا يوجد محامي مرتبط</p>
                            )}
                        </div>
                    </div>

                    {/* Filing */}
                    {filingInfo && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="text-indigo-500" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">بيانات اللائحة</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {infoRow('رقم اللائحة', filingInfo.filing_number)}
                                {infoRow('حالة اللائحة', filingInfo.filing_status)}
                                {infoRow('المدعي', filingInfo.plaintiff_name)}
                                {infoRow('المدعى عليه', filingInfo.defendant_name)}
                                {infoRow('تاريخ التقديم', filingInfo.submitted_at ? new Date(filingInfo.submitted_at).toLocaleDateString('ar-EG') : '-')}
                                {infoRow('المطالبة', filingInfo.legal_requests)}
                            </div>
                        </div>
                    )}

                    {/* Hearings */}
                    {hearings.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="text-purple-500" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">الجلسات ({hearings.length})</h3>
                            </div>
                            <div className="space-y-3">
                                {hearings.slice(0, 4).map((hearing) => (
                                    <div key={hearing.hearing_id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">الجلسة {hearing.hearing_number || '-'}</p>
                                            <p className="text-sm text-gray-500">
                                                {hearing.hearing_date ? new Date(hearing.hearing_date).toLocaleDateString('ar-EG') : '-'} {hearing.hearing_time && ` - ${hearing.hearing_time}`}
                                            </p>
                                        </div>
                                        <span
                                            className="px-3 py-1 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: hearing.hearing_status === 'held' ? '#22c55e20' : '#3b82f620',
                                                color: hearing.hearing_status === 'held' ? '#22c55e' : '#3b82f6'
                                            }}
                                        >
                                            {hearing.hearing_status === 'held' ? 'منعقدة' :
                                                hearing.hearing_status === 'scheduled' ? 'مجدولة' :
                                                    hearing.hearing_status === 'postponed' ? 'مؤجلة' :
                                                        hearing.hearing_status || 'غير محدد'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Decisions */}
                    {decisions.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <Gavel className="text-red-500" />
                                <h3 className="font-semibold text-gray-900 dark:text-white">القرارات ({decisions.length})</h3>
                            </div>
                            <div className="space-y-3">
                                {decisions.slice(0, 3).map((decision) => (
                                    <div key={decision.decision_id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <p className="font-medium text-gray-900 dark:text-white">{decision.decision_title || 'قرار قضائي'}</p>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {decision.decision_date ? new Date(decision.decision_date).toLocaleDateString('ar-EG') : '-'}
                                        </p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{decision.decision_summary || 'لا يوجد ملخص'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourtClerkCaseDetails;
