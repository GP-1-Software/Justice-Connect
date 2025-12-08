import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../supabaseClient';
import {
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Scale,
    Calendar,
    Gavel,
    Bell,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Download,
    Timer,
    Star,
    AlertTriangle,
    Truck,
    Shield,
    Award,
    Eye,
    Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Client Court Filing Tracker - متتبع مراحل القضية للعميل (قراءة فقط)
 * Shows 14 stages with real-time updates - NO action buttons
 */
const ClientCourtFilingTracker = ({ caseId, caseData }) => {
    const [filing, setFiling] = useState(null);
    const [hearings, setHearings] = useState([]);
    const [decisions, setDecisions] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSection, setExpandedSection] = useState('status');

    // 14 Stages Configuration (same as lawyer but NO actions) + rejected handling
    const STAGES_CONFIG = {
        'rejected': {
            order: 0,
            label: 'قيد المراجعة', // للعميل نخفي الرفض ونعرضه كـ "قيد المراجعة" 
            icon: Clock,
            color: '#ff9800',
            description: 'المحكمة تدرس الدعوى',
            clientNote: 'المحامي يعمل على تحديث اللائحة'
        },
        'submitted': { 
            order: 1,
            label: 'تم التقديم', 
            icon: FileText, 
            color: '#9e9e9e',
            description: 'تم تقديم اللائحة وتنتظر المراجعة'
        },
        'under_review': { 
            order: 2,
            label: 'قيد المراجعة', 
            icon: Clock, 
            color: '#ff9800',
            description: 'المحكمة تدرس الدعوى'
        },
        'update_required': { 
            order: 3,
            label: 'قيد المراجعة', // العميل يشوف "قيد المراجعة" مع تنبيه صغير
            icon: Clock, 
            color: '#ff9800',
            description: 'المحكمة تدرس الدعوى - المحامي يعمل على بعض التعديلات',
            clientNote: 'المحامي يعمل على تحديثات مطلوبة'
        },
        'ready_for_registration': { 
            order: 4,
            label: 'جاهزة للتسجيل', 
            icon: CheckCircle, 
            color: '#64b5f6',
            description: 'تمت الموافقة - بانتظار دفع الرسوم'
        },
        'awaiting_fees': { 
            order: 5,
            label: 'بانتظار دفع الرسوم', 
            icon: Clock, 
            color: '#ff9800',
            description: 'تم إصدار فاتورة الرسوم - يرجى دفع الرسوم لاستكمال التسجيل',
            clientNote: 'يرجى الذهاب لصفحة رسوم المحكمة لدفع الرسوم',
            showPaymentAlert: true
        },
        'registered': { 
            order: 6,
            label: 'مسجلة رسمياً', 
            icon: Star, 
            color: '#2e7d32',
            description: 'تم تسجيل الدعوى رسمياً في المحكمة',
            showStar: true
        },
        'service_in_progress': { 
            order: 7,
            label: 'قيد التبليغ', 
            icon: Truck, 
            color: '#1e88e5',
            description: 'جاري تبليغ الأطراف'
        },
        'service_completed': { 
            order: 8,
            label: 'تم التبليغ', 
            icon: CheckCircle, 
            color: '#43a047',
            description: 'تم تبليغ جميع الأطراف بنجاح'
        },
        'awaiting_response': { 
            order: 9,
            label: 'بانتظار الرد', 
            icon: Timer, 
            color: '#fb8c00',
            description: 'بانتظار رد المدعى عليه',
            showCountdown: true
        },
        'first_hearing_scheduled': { 
            order: 10,
            label: 'أول جلسة مجدولة', 
            icon: Calendar, 
            color: '#1565c0',
            description: 'تم تحديد موعد الجلسة الأولى',
            showHearingDate: true
        },
        'hearings_ongoing': { 
            order: 11,
            label: 'جلسات جارية', 
            icon: Scale, 
            color: '#42a5f5',
            description: 'القضية في مرحلة الجلسات'
        },
        'judgment_issued': { 
            order: 12,
            label: 'صدر الحكم', 
            icon: Gavel, 
            color: '#2e7d32',
            description: 'صدر الحكم في القضية'
        },
        'appeal_period': { 
            order: 13,
            label: 'فترة الاستئناف', 
            icon: AlertCircle, 
            color: '#ffeb3b',
            description: 'من الممكن تقديم استئناف - 30 يوم',
            showCountdown: true
        },
        'in_execution': { 
            order: 14,
            label: 'قيد التنفيذ', 
            icon: Shield, 
            color: '#7b1fa2',
            description: 'جاري تنفيذ الحكم'
        },
        'fully_executed': { 
            order: 15,
            label: 'منفذة بالكامل', 
            icon: Award, 
            color: '#00e676',
            description: 'تم تنفيذ الحكم بالكامل - نهاية القضية',
            showBell: true
        }
    };

    // Get current stage from case or filing
    const currentStageKey = useMemo(() => {
        return caseData?.case_stage || filing?.filing_status || 'submitted';
    }, [caseData?.case_stage, filing?.filing_status]);

    const currentStage = STAGES_CONFIG[currentStageKey] || STAGES_CONFIG['submitted'];

    // Calculate countdown days
    const getCountdownDays = (deadline) => {
        if (!deadline) return null;
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    // Load filing data
    const loadFilingData = async () => {
        if (!caseId) return;
        
        try {
            const { data: filingData, error: filingError } = await supabase
                .from('court_clerk_filings')
                .select('*')
                .eq('case_id', caseId)
                .order('submitted_at', { ascending: false })
                .limit(1)
                .single();

            if (filingError && filingError.code !== 'PGRST116') {
                console.error('Filing error:', filingError);
            }
            setFiling(filingData);

            const { data: hearingsData } = await supabase
                .from('court_hearings')
                .select('*')
                .eq('case_id', caseId)
                .order('hearing_date', { ascending: true });
            setHearings(hearingsData || []);

            const { data: decisionsData } = await supabase
                .from('court_decisions')
                .select('*')
                .eq('case_id', caseId)
                .order('decision_date', { ascending: false });
            setDecisions(decisionsData || []);

            const { data: servicesData } = await supabase
                .from('service_of_process')
                .select('*')
                .eq('case_id', caseId)
                .order('created_at', { ascending: false });
            setServices(servicesData || []);

        } catch (error) {
            console.error('Error loading filing data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFilingData();

        // Real-time subscriptions
        const filingChannel = supabase
            .channel(`client-filing-updates-${caseId}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'court_clerk_filings', filter: `case_id=eq.${caseId}` },
                (payload) => {
                    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                        setFiling(payload.new);
                        toast.success('تم تحديث حالة القضية');
                    }
                }
            )
            .subscribe();

        const caseChannel = supabase
            .channel(`client-case-updates-${caseId}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'cases', filter: `case_id=eq.${caseId}` },
                (payload) => {
                    if (payload.new.case_stage !== payload.old?.case_stage) {
                        const newStage = STAGES_CONFIG[payload.new.case_stage];
                        toast.success(`تم الانتقال إلى مرحلة: ${newStage?.label || payload.new.case_stage}`);
                    }
                }
            )
            .subscribe();

        const hearingsChannel = supabase
            .channel(`client-hearings-updates-${caseId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'court_hearings', filter: `case_id=eq.${caseId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setHearings(prev => [...prev, payload.new]);
                        toast.success('تم تحديد موعد جلسة جديدة');
                    } else if (payload.eventType === 'UPDATE') {
                        setHearings(prev => prev.map(h => h.hearing_id === payload.new.hearing_id ? payload.new : h));
                    }
                }
            )
            .subscribe();

        const decisionsChannel = supabase
            .channel(`client-decisions-updates-${caseId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'court_decisions', filter: `case_id=eq.${caseId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setDecisions(prev => [payload.new, ...prev]);
                        toast.success('صدر قرار جديد في القضية');
                    }
                }
            )
            .subscribe();

        return () => {
            filingChannel.unsubscribe();
            caseChannel.unsubscribe();
            hearingsChannel.unsubscribe();
            decisionsChannel.unsubscribe();
        };
    }, [caseId]);

    // Format helpers
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="mr-3 text-gray-600">جاري تحميل البيانات...</span>
            </div>
        );
    }

    if (!filing && !caseData?.case_stage) {
        return (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    لا توجد لائحة مقدمة
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    لم يتم تقديم لائحة دعوى لهذه القضية بعد
                </p>
            </div>
        );
    }

    const StageIcon = currentStage.icon;
    const nextHearing = hearings.find(h => h.hearing_status === 'scheduled');
    const responseDeadline = caseData?.response_deadline;
    const appealDeadline = caseData?.appeal_deadline;

    return (
        <div className="space-y-6">
            {/* Read-only Badge */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-800 dark:text-blue-300">
                    هذه نظرة على حالة قضيتك - المحامي يتولى جميع الإجراءات
                </span>
            </div>

            {/* Current Stage Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${currentStage.color}, ${currentStage.color}dd)` }}
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl relative">
                            <StageIcon className="w-8 h-8" />
                            {currentStage.showStar && <Star className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold">{currentStage.label}</h3>
                                {currentStage.showBell && <Bell className="w-5 h-5 animate-bounce" />}
                            </div>
                            <p className="text-white/80 text-sm mt-1">{currentStage.description}</p>
                            {currentStage.clientNote && (
                                <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {currentStage.clientNote}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="text-left">
                        {filing?.filing_number && (
                            <div>
                                <p className="text-white/60 text-xs">رقم اللائحة</p>
                                <p className="font-mono font-bold">{filing.filing_number}</p>
                            </div>
                        )}
                        {(filing?.official_case_number || caseData?.official_case_number) && (
                            <div className="mt-2">
                                <p className="text-white/60 text-xs">رقم الدعوى الرسمي</p>
                                <p className="font-mono font-bold text-lg">{filing?.official_case_number || caseData?.official_case_number}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Countdown Display */}
                {currentStage.showCountdown && (responseDeadline || appealDeadline) && (
                    <div className="mt-4 bg-white/10 rounded-lg p-3 flex items-center gap-3">
                        <Timer className="w-6 h-6" />
                        <div>
                            <p className="text-sm font-medium">
                                {currentStageKey === 'appeal_period' ? 'متبقي للاستئناف:' : 'متبقي للرد:'}
                            </p>
                            <p className="text-2xl font-bold">
                                {getCountdownDays(currentStageKey === 'appeal_period' ? appealDeadline : responseDeadline)} يوم
                            </p>
                        </div>
                    </div>
                )}

                {/* Next Hearing Display */}
                {currentStage.showHearingDate && nextHearing && (
                    <div className="mt-4 bg-white/10 rounded-lg p-3 flex items-center gap-3">
                        <Calendar className="w-6 h-6" />
                        <div>
                            <p className="text-sm font-medium">موعد الجلسة:</p>
                            <p className="text-lg font-bold">
                                {formatDate(nextHearing.hearing_date)} - {formatTime(nextHearing.hearing_time)}
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Stages Progress Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-blue-500" />
                    مراحل الدعوى
                </h3>
                
                <div className="relative overflow-x-auto">
                    <div className="flex gap-2 min-w-max pb-4">
                        {Object.entries(STAGES_CONFIG).map(([key, stage], index) => {
                            const StepIcon = stage.icon;
                            const currentOrder = STAGES_CONFIG[currentStageKey]?.order || 1;
                            const isActive = currentStageKey === key;
                            const isPast = stage.order < currentOrder;
                            
                            // Skip update_required for client - show as under_review
                            if (key === 'update_required') return null;
                            
                            return (
                                <div key={key} className="flex flex-col items-center relative">
                                    {index > 0 && key !== 'ready_for_registration' && (
                                        <div className={`absolute top-5 right-full w-2 h-0.5 ${
                                            isPast ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                        }`} />
                                    )}
                                    
                                    <div 
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                            isActive ? 'ring-4 ring-opacity-30' : ''
                                        } ${isPast ? 'bg-green-500 text-white' : isActive ? '' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                                        style={isActive ? { 
                                            backgroundColor: stage.color, 
                                            color: 'white',
                                            boxShadow: `0 0 0 4px ${stage.color}40`
                                        } : {}}
                                    >
                                        <StepIcon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[10px] mt-2 text-center max-w-[60px] leading-tight ${
                                        isActive ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {stage.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filing Details */}
            {filing && (
                <CollapsibleSection
                    title="تفاصيل الدعوى"
                    icon={FileText}
                    iconColor="text-blue-500"
                    isExpanded={expandedSection === 'details'}
                    onToggle={() => setExpandedSection(expandedSection === 'details' ? '' : 'details')}
                >
                    {/* Basic Info */}
                    <div className="p-4 grid md:grid-cols-2 gap-4">
                        <InfoRow label="رقم اللائحة" value={filing.filing_number} />
                        <InfoRow label="المحكمة" value={filing.court_name} />
                        <InfoRow label="المدينة" value={filing.city} />
                        <InfoRow label="نوع الدعوى" value={filing.case_type} />
                        <InfoRow label="تاريخ التقديم" value={formatDate(filing.submitted_at)} />
                        <InfoRow label="حالة اللائحة" value={
                            filing.filing_status === 'submitted' ? 'مقدمة' :
                            filing.filing_status === 'under_review' ? 'قيد المراجعة' :
                            filing.filing_status === 'rejected' ? 'مرفوضة' :
                            filing.filing_status === 'requested_update' ? 'بحاجة لتعديل' :
                            filing.filing_status === 'ready_for_registration' ? 'جاهزة للتسجيل' :
                            filing.filing_status === 'registered' ? 'مسجلة' :
                            filing.filing_status
                        } />
                    </div>
                    
                    {/* Parties Section */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            أطراف الدعوى
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المدعي</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{filing.plaintiff_name}</p>
                                {filing.plaintiff_id_number && (
                                    <p className="text-sm text-gray-500">رقم الهوية: {filing.plaintiff_id_number}</p>
                                )}
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المدعى عليه</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{filing.defendant_name}</p>
                                {filing.defendant_id_number && (
                                    <p className="text-sm text-gray-500">رقم الهوية: {filing.defendant_id_number}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Filing Content */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">محتوى اللائحة</h4>
                        
                        {filing.filing_summary && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">ملخص اللائحة:</p>
                                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg whitespace-pre-wrap">
                                    {filing.filing_summary}
                                </p>
                            </div>
                        )}
                        
                        {filing.legal_requests && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">الطلبات:</p>
                                <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-r-4 border-blue-500 whitespace-pre-wrap">
                                    {filing.legal_requests}
                                </p>
                            </div>
                        )}
                        
                        {filing.jurisdiction_info && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">الاختصاص القضائي:</p>
                                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                    {filing.jurisdiction_info}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* Registration Info - Only show if registered */}
                    {(filing.registry_number || filing.official_case_number) && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                            <h4 className="font-semibold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                بيانات التسجيل
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                {filing.registry_number && (
                                    <InfoRow label="رقم القيد" value={filing.registry_number} className="text-green-600 font-bold" />
                                )}
                                {filing.official_case_number && (
                                    <InfoRow label="رقم الدعوى الرسمي" value={filing.official_case_number} className="text-green-600 font-bold" />
                                )}
                                {filing.registration_date && (
                                    <InfoRow label="تاريخ التسجيل" value={formatDate(filing.registration_date)} />
                                )}
                                {filing.court_fees && (
                                    <InfoRow label="الرسوم" value={`${filing.court_fees} د.أ`} />
                                )}
                            </div>
                        </div>
                    )}
                </CollapsibleSection>
            )}

            {/* Hearings Section */}
            {hearings.length > 0 && (
                <CollapsibleSection
                    title={`الجلسات (${hearings.length})`}
                    icon={Calendar}
                    iconColor="text-purple-500"
                    isExpanded={expandedSection === 'hearings'}
                    onToggle={() => setExpandedSection(expandedSection === 'hearings' ? '' : 'hearings')}
                >
                    <div className="divide-y dark:divide-gray-700">
                        {hearings.map((hearing) => (
                            <div key={hearing.hearing_id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            hearing.hearing_status === 'held' ? 'bg-green-100 text-green-600' :
                                            hearing.hearing_status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                                            hearing.hearing_status === 'postponed' ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                الجلسة {hearing.hearing_number}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(hearing.hearing_date)} - {formatTime(hearing.hearing_time)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        hearing.hearing_status === 'held' ? 'bg-green-100 text-green-800' :
                                        hearing.hearing_status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                        hearing.hearing_status === 'postponed' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {hearing.hearing_status === 'held' ? 'منعقدة' :
                                         hearing.hearing_status === 'scheduled' ? 'مجدولة' :
                                         hearing.hearing_status === 'postponed' ? 'مؤجلة' :
                                         hearing.hearing_status === 'cancelled' ? 'ملغاة' : hearing.hearing_status}
                                    </span>
                                </div>
                                {hearing.hearing_summary && (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 mr-13">
                                        {hearing.hearing_summary}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Decisions Section */}
            {decisions.length > 0 && (
                <CollapsibleSection
                    title={`القرارات والأحكام (${decisions.length})`}
                    icon={Gavel}
                    iconColor="text-red-500"
                    isExpanded={expandedSection === 'decisions'}
                    onToggle={() => setExpandedSection(expandedSection === 'decisions' ? '' : 'decisions')}
                >
                    <div className="divide-y dark:divide-gray-700">
                        {decisions.map((decision) => (
                            <div key={decision.decision_id} className={`p-4 ${decision.decision_type === 'final_judgment' ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            decision.decision_type === 'final_judgment' ? 'bg-red-100 text-red-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            <Gavel className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {decision.decision_title || (
                                                    decision.decision_type === 'final_judgment' ? 'حكم نهائي' :
                                                    decision.decision_type === 'preliminary' ? 'قرار تمهيدي' :
                                                    decision.decision_type
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                تاريخ القرار: {formatDate(decision.decision_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            decision.decision_type === 'final_judgment' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                            {decision.decision_type === 'final_judgment' ? 'حكم نهائي' : 'قرار تمهيدي'}
                                        </span>
                                        {decision.is_appealable && (
                                            <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs font-medium">
                                                قابل للاستئناف
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Decision Summary */}
                                {decision.decision_summary && (
                                    <div className="mb-3 mr-13">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">ملخص القرار:</p>
                                        <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                            {decision.decision_summary}
                                        </p>
                                    </div>
                                )}
                                
                                {/* Ruling (منطوق الحكم) */}
                                {decision.ruling && (
                                    <div className="mb-3 mr-13">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">منطوق الحكم:</p>
                                        <p className="text-gray-800 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-r-4 border-blue-500">
                                            {decision.ruling}
                                        </p>
                                    </div>
                                )}
                                
                                {/* In Favor Of */}
                                {decision.in_favor_of && (
                                    <div className="mb-3 mr-13">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">الحكم لصالح:</p>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            decision.in_favor_of === 'plaintiff' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            decision.in_favor_of === 'defendant' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {decision.in_favor_of === 'plaintiff' ? 'المدعي' :
                                             decision.in_favor_of === 'defendant' ? 'المدعى عليه' :
                                             decision.in_favor_of === 'partial' ? 'حكم جزئي' :
                                             decision.in_favor_of}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Appeal Deadline */}
                                {decision.is_appealable && decision.appeal_deadline && (
                                    <div className="mb-3 mr-13">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">آخر موعد للاستئناف:</p>
                                        <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg text-sm">
                                            {formatDate(decision.appeal_deadline)}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Download File */}
                                {decision.decision_file_url && (
                                    <a href={decision.decision_file_url} target="_blank" rel="noopener noreferrer"
                                        className="mt-2 mr-13 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                        <Download className="w-4 h-4" />
                                        تحميل ملف القرار
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Services Section */}
            {services.length > 0 && (
                <CollapsibleSection
                    title={`التبليغات (${services.length})`}
                    icon={Bell}
                    iconColor="text-green-500"
                    isExpanded={expandedSection === 'services'}
                    onToggle={() => setExpandedSection(expandedSection === 'services' ? '' : 'services')}
                >
                    <div className="divide-y dark:divide-gray-700">
                        {services.map((service) => (
                            <div key={service.service_id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            تبليغ {service.defendant_name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {service.service_method === 'bailiff' ? 'محضر' :
                                             service.service_method === 'mail' ? 'بريد' :
                                             service.service_method === 'publication' ? 'نشر' :
                                             service.service_method === 'electronic' ? 'إلكتروني' :
                                             service.service_method} - {formatDate(service.attempt_date)}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        service.attempt_result === 'served' ? 'bg-green-100 text-green-800' :
                                        service.attempt_result === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        service.attempt_result === 'not_served' ? 'bg-red-100 text-red-800' :
                                        service.attempt_result === 'refused' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {service.attempt_result === 'served' ? 'تم التبليغ' :
                                         service.attempt_result === 'pending' ? 'قيد التبليغ' :
                                         service.attempt_result === 'not_served' ? 'لم يتم' :
                                         service.attempt_result === 'refused' ? 'رُفض' : service.attempt_result}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}
        </div>
    );
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, iconColor, isExpanded, onToggle, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <button
            onClick={onToggle}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t dark:border-gray-700"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

// Info Row Component
const InfoRow = ({ label, value, className = '' }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <span className="text-gray-500 dark:text-gray-400 text-sm">{label}</span>
        <span className={`text-gray-900 dark:text-white font-medium ${className}`}>{value || '-'}</span>
    </div>
);

export default ClientCourtFilingTracker;
