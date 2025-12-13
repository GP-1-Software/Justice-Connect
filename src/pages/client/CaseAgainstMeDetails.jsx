import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useClientAuth } from '../../hooks/useClientAuth';
import {
    ArrowRight,
    AlertTriangle,
    Building2,
    Calendar,
    FileText,
    Scale,
    User,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Phone,
    Mail,
    MapPin,
    ExternalLink
} from 'lucide-react';

const CaseAgainstMeDetails = () => {
    const { caseId } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useClientAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filing, setFiling] = useState(null);
    const [caseData, setCaseData] = useState(null);
    const [services, setServices] = useState([]);
    const [hearings, setHearings] = useState([]);

    // Fetch case details
    const fetchCaseDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!userProfile?.id_number) {
                throw new Error('المستخدم غير مسجل الدخول');
            }

            // Fetch filing where user is defendant
            const { data: filingData, error: filingError } = await supabase
                .from('court_clerk_filings')
                .select(`
          *,
          cases:case_id (
            case_id,
            title,
            status,
            case_stage,
            court_name,
            case_number,
            filing_date,
            created_at
          )
        `)
                .eq('case_id', caseId)
                .eq('defendant_id_number', userProfile.id_number)
                .single();

            if (filingError) throw new Error('لا يمكن الوصول إلى هذه القضية');
            if (!filingData) throw new Error('القضية غير موجودة');

            setFiling(filingData);
            setCaseData(filingData.cases);

            // Fetch service of process records
            const { data: servicesData } = await supabase
                .from('service_of_process')
                .select('*')
                .eq('case_id', caseId)
                .order('attempt_date', { ascending: false });

            setServices(servicesData || []);

            // Fetch hearings
            const { data: hearingsData } = await supabase
                .from('court_hearings')
                .select('*')
                .eq('case_id', caseId)
                .order('hearing_date', { ascending: true });

            setHearings(hearingsData || []);

        } catch (err) {
            console.error('Error fetching case details:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userProfile && caseId) {
            fetchCaseDetails();
        }
    }, [userProfile, caseId]);

    // Get status display
    const getFilingStatusBadge = (status) => {
        const config = {
            'submitted': { label: 'مقدمة', color: 'bg-blue-100 text-blue-700', icon: Clock },
            'under_review': { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            'registered': { label: 'مسجلة رسمياً', color: 'bg-green-100 text-green-700', icon: CheckCircle },
            'rejected': { label: 'مرفوضة', color: 'bg-red-100 text-red-700', icon: XCircle }
        };
        const conf = config[status] || config['submitted'];
        const Icon = conf.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${conf.color}`}>
                <Icon className="w-4 h-4" />
                {conf.label}
            </span>
        );
    };

    // Get case stage display
    const getCaseStageBadge = (stage) => {
        const stageLabels = {
            'submitted': 'تم التقديم',
            'under_review': 'قيد المراجعة',
            'registered': 'مسجلة',
            'pending_service': 'قيد التبليغ',
            'service_completed': 'تم التبليغ',
            'first_hearing_scheduled': 'تم تحديد الجلسة الأولى',
            'hearings_ongoing': 'جلسات جارية',
            'appeal_period': 'فترة الاستئناف',
            'in_execution': 'قيد التنفيذ',
            'closed': 'مغلقة'
        };
        return stageLabels[stage] || stage || 'غير محدد';
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'غير محدد';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">جاري تحميل تفاصيل القضية...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-200 dark:border-red-800 p-8 max-w-md w-full text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">حدث خطأ</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/client/cases')}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                    >
                        العودة للقضايا
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/client/cases')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowRight className="w-5 h-5" />
                    <span>العودة للقضايا</span>
                </button>

                {/* Warning Header */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 sm:p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-orange-800 dark:text-orange-300 mb-1">
                                قضية مرفوعة ضدك
                            </h2>
                            <p className="text-orange-700 dark:text-orange-400 text-sm">
                                هذه القضية مرفوعة ضدك كمدعى عليه. ننصحك بشدة بالتواصل مع محامٍ متخصص للحصول على استشارة قانونية.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Case Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold mb-1">
                                    {filing.filing_summary || caseData?.title || 'دعوى قضائية'}
                                </h1>
                                {caseData?.case_number && (
                                    <p className="text-orange-100">رقم القضية: {caseData.case_number}</p>
                                )}
                            </div>
                            {getFilingStatusBadge(filing.filing_status)}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Key Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">المدعي (الطرف المُقدِّم)</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{filing.plaintiff_name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                                    <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">المدعى عليه (أنت)</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{filing.defendant_name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                                    <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">نوع القضية</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{filing.case_type}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                                    <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">المحكمة المختصة</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{filing.court_name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                                    <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">تاريخ التقديم</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{formatDate(filing.submitted_at || filing.created_at)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg">
                                    <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">مرحلة القضية</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{getCaseStageBadge(caseData?.case_stage)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Case Description */}
                        {filing.legal_requests && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-500" />
                                    موضوع الدعوى والطلبات
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    {filing.legal_requests}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Service of Process Section */}
                {services.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Mail className="w-5 h-5 text-blue-500" />
                                سجل التبليغات ({services.length})
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {services.map((service) => (
                                <div key={service.service_id} className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(service.attempt_date)}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${service.attempt_result === 'served'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : service.attempt_result === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {service.attempt_result === 'served' ? 'تم التبليغ' :
                                                service.attempt_result === 'pending' ? 'قيد التبليغ' :
                                                    service.attempt_result === 'refused' ? 'رُفض' : 'لم يتم'}
                                        </span>
                                    </div>
                                    {service.service_notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{service.service_notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hearings Section */}
                {hearings.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-500" />
                                الجلسات ({hearings.length})
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {hearings.map((hearing) => (
                                <div key={hearing.hearing_id} className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            الجلسة رقم {hearing.hearing_number}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${hearing.hearing_status === 'held'
                                                ? 'bg-green-100 text-green-700'
                                                : hearing.hearing_status === 'scheduled'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {hearing.hearing_status === 'held' ? 'انعقدت' :
                                                hearing.hearing_status === 'scheduled' ? 'محددة' : 'مؤجلة'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <p>التاريخ: {formatDate(hearing.hearing_date)} - الساعة: {hearing.hearing_time}</p>
                                        {hearing.hearing_summary && (
                                            <p className="mt-1">{hearing.hearing_summary}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">ماذا أفعل الآن؟</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/client/search-lawyers')}
                            className="w-full flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 transition-all"
                        >
                            <span className="font-medium">البحث عن محامٍ للتمثيل القانوني</span>
                            <ExternalLink className="w-5 h-5" />
                        </button>
                        <a
                            href="tel:+970"
                            className="w-full flex items-center justify-between bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl p-4 transition-all"
                        >
                            <span className="font-medium">الاتصال بالمحكمة للاستفسار</span>
                            <Phone className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseAgainstMeDetails;
