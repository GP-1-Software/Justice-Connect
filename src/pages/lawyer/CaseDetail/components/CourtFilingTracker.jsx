import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../supabaseClient';
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
    Upload,
    Download,
    MessageSquare,
    Zap,
    Timer,
    Star,
    AlertTriangle,
    Send,
    FileCheck,
    Truck,
    Shield,
    Award,
    X,
    Paperclip,
    Users,
    ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import FilingUpdateResponse from './FilingUpdateResponse';
import { getAuthHeaders } from '../../../../utils/authHelpers';

/**
 * Court Filing Tracker - متتبع مراحل القضية الـ 14
 * Real-time updates with lawyer action buttons
 */
const CourtFilingTracker = ({ caseId, caseData }) => {
    const navigate = useNavigate();
    const [filing, setFiling] = useState(null);
    const [hearings, setHearings] = useState([]);
    const [decisions, setDecisions] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSection, setExpandedSection] = useState('status');
    const [actionLoading, setActionLoading] = useState(null);

    // Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadType, setUploadType] = useState(''); // 'defense_memo' or 'new_documents'
    const [uploadFiles, setUploadFiles] = useState([]);
    const [uploadNotes, setUploadNotes] = useState('');
    const [uploading, setUploading] = useState(false);

    const [showPostponeModal, setShowPostponeModal] = useState(false);
    const [postponeReason, setPostponeReason] = useState('');
    const [postponeSubmitting, setPostponeSubmitting] = useState(false);

    // Appeal Modal states
    const [showAppealModal, setShowAppealModal] = useState(false);
    const [appealData, setAppealData] = useState({
        appeal_type: 'full_appeal',
        appeal_reasons: '',
        documents: []
    });
    const [appealSubmitting, setAppealSubmitting] = useState(false);
    const appealFileInputRef = useRef(null);

    // Appeal Status & Update states
    const [caseAppeal, setCaseAppeal] = useState(null);
    const [loadingAppeal, setLoadingAppeal] = useState(false);
    const [showAppealUpdateModal, setShowAppealUpdateModal] = useState(false);
    const [appealUpdateData, setAppealUpdateData] = useState({
        update_response: '',
        additional_documents: []
    });
    const [appealUpdateSubmitting, setAppealUpdateSubmitting] = useState(false);
    const appealUpdateFileRef = useRef(null);

    const fileInputRef = useRef(null);

    // 14 Stages Configuration (+ rejected for filing)
    // Appeal Stages Configuration (10 stages)
    const APPEAL_STAGES_CONFIG = {
        'appeal_submitted': {
            order: 1,
            label: 'تم التقديم',
            icon: FileText,
            color: '#9e9e9e',
            description: 'تم تقديم طلب الاستئناف'
        },
        'appeal_under_review': {
            order: 2,
            label: 'قيد المراجعة',
            icon: Clock,
            color: '#ff9800',
            description: 'قلم المحكمة يراجع طلب الاستئناف'
        },
        'appeal_update_required': {
            order: 3,
            label: 'مطلوب تعديل',
            icon: AlertCircle,
            color: '#f44336',
            description: 'يرجى تقديم التعديلات المطلوبة'
        },
        'appeal_accepted': {
            order: 4,
            label: 'تم القبول',
            icon: CheckCircle,
            color: '#4caf50',
            description: 'تم قبول طلب الاستئناف'
        },
        'appeal_rejected': {
            order: 5,
            label: 'تم الرفض',
            icon: XCircle,
            color: '#f44336',
            description: 'تم رفض طلب الاستئناف'
        },
        'appeal_file_transferred': {
            order: 6,
            label: 'تم إحالة الملف',
            icon: Truck,
            color: '#2196f3',
            description: 'تم إحالة الملف لمحكمة الاستئناف'
        },
        'appeal_hearing_scheduled': {
            order: 7,
            label: 'تم تحديد جلسة',
            icon: Calendar,
            color: '#9c27b0',
            description: 'تم تحديد موعد جلسة الاستئناف'
        },
        'appeal_hearings_ongoing': {
            order: 8,
            label: 'جلسات جارية',
            icon: Gavel,
            color: '#ff5722',
            description: 'جلسات الاستئناف جارية'
        },
        'appeal_decision_issued': {
            order: 9,
            label: 'صدر الحكم',
            icon: Award,
            color: '#4caf50',
            description: 'صدر حكم محكمة الاستئناف'
        },
        'appeal_case_closed': {
            order: 10,
            label: 'انتهت القضية',
            icon: CheckCircle,
            color: '#2e7d32',
            description: 'انتهت قضية الاستئناف'
        }
    };

    const STAGES_CONFIG = {
        'rejected': {
            order: 0,
            label: 'مرفوضة',
            icon: XCircle,
            color: '#f44336',
            bgColor: 'bg-red-100',
            textColor: 'text-red-700',
            description: 'تم رفض اللائحة - يرجى مراجعة سبب الرفض وإعادة التقديم',
            actions: [
                { id: 'view_rejection_reason', label: 'عرض سبب الرفض', icon: AlertTriangle, variant: 'danger' },
                { id: 'contact_court_clerk', label: 'مراسلة قلم المحكمة', icon: MessageSquare, variant: 'secondary' }
            ]
        },
        'submitted': {
            order: 1,
            label: 'تم التقديم',
            icon: FileText,
            color: '#9e9e9e',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-700',
            description: 'تم تقديم اللائحة وتنتظر المراجعة',
            actions: []
        },
        'under_review': {
            order: 2,
            label: 'قيد المراجعة',
            icon: Clock,
            color: '#ff9800',
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-700',
            description: 'المحكمة تدرس الدعوى',
            actions: []
        },
        'update_required': {
            order: 3,
            label: 'مطلوب تعديل',
            icon: AlertTriangle,
            color: '#ff5252',
            bgColor: 'bg-red-100',
            textColor: 'text-red-700',
            description: 'مطلوب تعديلات أو مستندات إضافية',
            actions: [
                { id: 'contact_court_clerk', label: 'مراسلة قلم المحكمة', icon: MessageSquare, variant: 'secondary' }
            ]
        },
        'ready_for_registration': {
            order: 4,
            label: 'جاهزة للتسجيل',
            icon: CheckCircle,
            color: '#64b5f6',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-700',
            description: 'تمت الموافقة - بانتظار دفع الرسوم وإصدار فاتورة',
            actions: []
        },
        'awaiting_fees': {
            order: 5,
            label: 'بانتظار دفع الرسوم',
            icon: Clock,
            color: '#ff9800',
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-700',
            description: 'تم إصدار فاتورة الرسوم - يجب على العميل دفع الرسوم',
            actions: []
        },
        'registered': {
            order: 6,
            label: 'مسجلة رسمياً',
            icon: Star,
            color: '#2e7d32',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700',
            description: 'تم تسجيل الدعوى رسمياً في المحكمة',
            showStar: true,
            actions: [
                { id: 'download_registration_receipt', label: 'تحميل إيصال التسجيل المختوم PDF', icon: Download, variant: 'primary' }
            ]
        },
        'service_in_progress': {
            order: 7,
            label: 'قيد التبليغ',
            icon: Truck,
            color: '#1e88e5',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-700',
            description: 'جاري تبليغ الأطراف',
            actions: [
                { id: 'track_service_status', label: 'متابعة حالة التبليغ يومياً', icon: RefreshCw, variant: 'primary' },
                { id: 'request_service_speedup', label: 'طلب تسريع التبليغ', icon: Zap, variant: 'secondary' }
            ]
        },
        'service_completed': {
            order: 8,
            label: 'تم التبليغ',
            icon: CheckCircle,
            color: '#43a047',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700',
            description: 'تم تبليغ جميع الأطراف بنجاح',
            actions: []
        },
        'awaiting_response': {
            order: 9,
            label: 'بانتظار الرد',
            icon: Timer,
            color: '#fb8c00',
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-700',
            description: 'بانتظار رد المدعى عليه',
            showCountdown: true,
            actions: [
                { id: 'remind_defendant', label: 'تذكير المدعى عليه', icon: Bell, variant: 'secondary' }
            ]
        },
        'first_hearing_scheduled': {
            order: 10,
            label: 'أول جلسة مجدولة',
            icon: Calendar,
            color: '#1565c0',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            description: 'تم تحديد موعد الجلسة الأولى',
            showHearingDate: true,
            actions: [
                { id: 'upload_defense_memo', label: 'رفع مذكرة دفاعية أو ردية', icon: Upload, variant: 'primary' },
                { id: 'request_postponement', label: 'طلب تأجيل الجلسة', icon: Clock, variant: 'secondary' }
            ]
        },
        'hearings_ongoing': {
            order: 11,
            label: 'جلسات جارية',
            icon: Scale,
            color: '#42a5f5',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-700',
            description: 'القضية في مرحلة الجلسات',
            actions: [
                { id: 'upload_defense_memo', label: 'رفع مذكرة دفاعية أو ردية', icon: Upload, variant: 'primary' },
                { id: 'request_postponement', label: 'طلب تأجيل الجلسة القادمة', icon: Clock, variant: 'secondary' }
            ]
        },
        'judgment_issued': {
            order: 12,
            label: 'صدر الحكم',
            icon: Gavel,
            color: '#2e7d32',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700',
            description: 'صدر الحكم في القضية',
            actions: [
                // { id: 'download_judgment', label: 'تحميل الحكم PDF', icon: Download, variant: 'primary' },
                { id: 'submit_appeal', label: 'تقديم استئناف إلكتروني', icon: AlertTriangle, variant: 'danger' }
            ]
        },
        'appeal_period': {
            order: 13,
            label: 'فترة الاستئناف',
            icon: AlertCircle,
            color: '#ffeb3b',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            description: 'من الممكن تقديم استئناف - 30 يوم',
            showCountdown: true,
            actions: [
                { id: 'submit_appeal', label: 'تقديم استئناف إلكتروني الآن', icon: Send, variant: 'danger' }
            ]
        },
        'in_execution': {
            order: 14,
            label: 'قيد التنفيذ',
            icon: Shield,
            color: '#7b1fa2',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-700',
            description: 'جاري تنفيذ الحكم',
            actions: [
                // { id: 'open_execution_file', label: 'فتح ملف تنفيذ إلكتروني', icon: FileText, variant: 'primary' },
                { id: 'mark_fully_executed', label: 'تم تنفيذ الحكم بشكل نهائي', icon: CheckCircle, variant: 'danger' }
            ]
        },
        'fully_executed': {
            order: 15,
            label: 'منفذة بالكامل',
            icon: Award,
            color: '#00e676',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700',
            description: 'تم تنفيذ الحكم بالكامل - نهاية القضية',
            showBell: true,
            actions: [
                // { id: 'download_execution_notice', label: 'تحميل إشعار التنفيذ النهائي', icon: Download, variant: 'primary' },
                // { id: 'close_case', label: 'إغلاق القضية من عندي', icon: CheckCircle, variant: 'secondary' }
            ]
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
        loadCaseAppeal(); // Load appeal data

        // Real-time subscriptions
        const filingChannel = supabase
            .channel(`filing-updates-${caseId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'court_clerk_filings', filter: `case_id=eq.${caseId}` },
                (payload) => {
                    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                        setFiling(payload.new);
                        toast.success('تم تحديث حالة الدعوى');
                    }
                }
            )
            .subscribe();

        const caseChannel = supabase
            .channel(`case-updates-${caseId}`)
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
            .channel(`hearings-updates-${caseId}`)
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
            .channel(`decisions-updates-${caseId}`)
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

    // Handle action button click
    const handleAction = async (actionId) => {
        setActionLoading(actionId);

        try {
            switch (actionId) {
                case 'upload_defense_memo':
                    setUploadType('defense_memo');
                    setShowUploadModal(true);
                    break;

                case 'upload_new_documents':
                    setUploadType('new_documents');
                    setShowUploadModal(true);
                    break;

                case 'contact_court_clerk':
                    toast('سيتم فتح نافذة المراسلة', { icon: '💬' });
                    break;

                case 'download_registration_receipt':
                case 'download_judgment':
                case 'download_execution_notice':
                    toast('جاري تحميل الملف...', { icon: '📥' });
                    break;

                case 'track_service_status':
                case 'track_execution':
                    setExpandedSection('services');
                    break;

                case 'request_service_speedup':
                case 'remind_defendant':
                    toast.success('تم إرسال الطلب بنجاح');
                    break;

                case 'request_postponement':
                    setShowPostponeModal(true);
                    break;

                case 'submit_appeal':
                    setShowAppealModal(true);
                    break;

                case 'open_execution_file':
                    toast('سيتم فتح نموذج ملف التنفيذ', { icon: '📋' });
                    break;

                case 'submit_execution_request':
                    toast('سيتم فتح نموذج الطلب التنفيذي', { icon: '📝' });
                    break;

                case 'close_case':
                    toast.success('تم إغلاق القضية من طرفك');
                    break;

                case 'mark_fully_executed':
                    // Show confirmation before marking as fully executed
                    if (window.confirm('هل أنت متأكد من أن الحكم تم تنفيذه بشكل نهائي؟\n\nسيتم تحويل حالة القضية إلى "منفذة بالكامل" وإرسال إشعارات للعميل.')) {
                        try {
                            const response = await fetch(`https://justice-connect-mobile.onrender.com/api/court-clerk/public/cases/${caseId}/mark-fully-executed`, {
                                method: 'POST',
                                headers: getAuthHeaders()
                            });

                            if (response.ok) {
                                toast.success('تم تأكيد تنفيذ الحكم بشكل نهائي');
                                // Supabase Realtime will update the UI automatically
                            } else {
                                const error = await response.json();
                                toast.error(error.error || 'فشل في تحديث حالة القضية');
                            }
                        } catch (err) {
                            console.error('Mark fully executed error:', err);
                            toast.error('حدث خطأ أثناء تحديث حالة القضية');
                        }
                    }
                    break;

                default:
                    toast('الإجراء قيد التطوير');
            }
        } catch (error) {
            console.error('Action error:', error);
            toast.error('حدث خطأ أثناء تنفيذ الإجراء');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle appeal file selection
    const handleAppealFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const maxSize = 10 * 1024 * 1024; // 10MB

        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                toast.error(`الملف ${file.name} أكبر من 10 ميجابايت`);
                return false;
            }
            return true;
        });

        setAppealData(prev => ({
            ...prev,
            documents: [...prev.documents, ...validFiles]
        }));
    };

    // Remove appeal document
    const removeAppealDocument = (index) => {
        setAppealData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    };

    // Submit appeal
    const handleSubmitAppeal = async () => {
        if (!appealData.appeal_reasons.trim()) {
            toast.error('يرجى إدخال أسباب الاستئناف');
            return;
        }

        setAppealSubmitting(true);
        const user = JSON.parse(localStorage.getItem('user'));

        try {
            // Upload documents first if any
            const uploadedDocs = [];
            for (const file of appealData.documents) {
                const fileName = `appeals/${caseId}/${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage
                    .from('case-documents')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (!error) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('case-documents')
                        .getPublicUrl(fileName);
                    uploadedDocs.push({ name: file.name, url: publicUrl });
                }
            }

            // Submit appeal to backend
            const response = await fetch('https://justice-connect-mobile.onrender.com/api/court-clerk/public/appeals/submit', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    original_case_id: caseId,
                    appeal_type: appealData.appeal_type,
                    appeal_reasons: appealData.appeal_reasons,
                    appeal_documents: uploadedDocs,
                    submitted_by: user.user_id || user.lawyer_id || user.client_id,
                    submitted_by_type: 'lawyer'
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(`تم تقديم الاستئناف بنجاح - رقم ${data.data.appeal_number}`);
                setShowAppealModal(false);
                setAppealData({ appeal_type: 'full_appeal', appeal_reasons: '', documents: [] });
            } else {
                const error = await response.json();
                toast.error(error.error || 'فشل في تقديم الاستئناف');
            }
        } catch (error) {
            console.error('Appeal submission error:', error);
            toast.error('حدث خطأ أثناء تقديم الاستئناف');
        } finally {
            setAppealSubmitting(false);
        }
    };

    // Load case appeal data
    const loadCaseAppeal = async () => {
        try {
            setLoadingAppeal(true);
            const response = await fetch(`https://justice-connect-mobile.onrender.com/api/court-clerk/public/appeals/case/${caseId}`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setCaseAppeal(data.data);
            }
        } catch (error) {
            console.error('Error loading appeal:', error);
        } finally {
            setLoadingAppeal(false);
        }
    };

    // Handle appeal update file selection
    const handleAppealUpdateFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const maxSize = 10 * 1024 * 1024;
        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                toast.error(`الملف ${file.name} أكبر من 10 ميجابايت`);
                return false;
            }
            return true;
        });
        setAppealUpdateData(prev => ({
            ...prev,
            additional_documents: [...prev.additional_documents, ...validFiles]
        }));
    };

    // Submit appeal update
    const handleSubmitAppealUpdate = async () => {
        if (!appealUpdateData.update_response.trim()) {
            toast.error('يرجى إدخال الرد على طلب التعديل');
            return;
        }

        setAppealUpdateSubmitting(true);

        try {
            // Upload new documents first
            const uploadedDocs = [];
            for (const file of appealUpdateData.additional_documents) {
                const fileName = `appeals/${caseId}/updates/${Date.now()}-${file.name}`;
                const { error } = await supabase.storage
                    .from('case-documents')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (!error) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('case-documents')
                        .getPublicUrl(fileName);
                    uploadedDocs.push({ name: file.name, url: publicUrl });
                }
            }

            const response = await fetch(
                `https://justice-connect-mobile.onrender.com/api/court-clerk/public/appeals/${caseAppeal.appeal_id}/submit-update`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        update_response: appealUpdateData.update_response,
                        additional_documents: uploadedDocs
                    })
                }
            );

            if (response.ok) {
                toast.success('تم تقديم التعديلات بنجاح');
                setShowAppealUpdateModal(false);
                setAppealUpdateData({ update_response: '', additional_documents: [] });
                loadCaseAppeal(); // Reload appeal data
            } else {
                const error = await response.json();
                toast.error(error.error || 'فشل في تقديم التعديلات');
            }
        } catch (error) {
            console.error('Appeal update error:', error);
            toast.error('حدث خطأ أثناء تقديم التعديلات');
        } finally {
            setAppealUpdateSubmitting(false);
        }
    };

    // Handle file selection for upload
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const maxSize = 10 * 1024 * 1024; // 10MB

        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                toast.error(`الملف ${file.name} أكبر من 10 ميجابايت`);
                return false;
            }
            return true;
        });

        setUploadFiles(prev => [...prev, ...validFiles]);
    };

    // Remove file from upload list
    const removeUploadFile = (index) => {
        setUploadFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Upload documents (defense memo or new documents)
    const handleUploadDocuments = async () => {
        if (uploadFiles.length === 0) {
            toast.error('يرجى اختيار ملف واحد على الأقل');
            return;
        }

        setUploading(true);
        const user = JSON.parse(localStorage.getItem('user'));

        try {
            const uploadedFiles = [];

            for (const file of uploadFiles) {
                const fileName = `${caseId}/${uploadType}/${Date.now()}-${file.name}`;

                const { data, error } = await supabase.storage
                    .from('case-documents')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (error) {
                    console.error('Upload error:', error);
                    continue;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('case-documents')
                    .getPublicUrl(fileName);

                uploadedFiles.push({
                    file_name: file.name,
                    file_url: publicUrlData.publicUrl,
                    file_type: file.type,
                    file_size: file.size,
                    document_type: uploadType
                });
            }

            if (uploadedFiles.length === 0) {
                throw new Error('فشل في رفع الملفات');
            }

            // Insert into filing_attachments table
            const attachmentRecords = uploadedFiles.map(f => ({
                filing_id: filing?.filing_id,
                file_name: f.file_name,
                file_url: f.file_url,
                file_type: f.file_type,
                file_size: f.file_size,
                attachment_type: uploadType === 'defense_memo' ? 'defense_memo' : 'new_document',
                uploaded_by: user.lawyer_id || user.user_id,
                uploaded_by_type: 'lawyer'
            }));

            const { error: insertError } = await supabase
                .from('filing_attachments')
                .insert(attachmentRecords);

            if (insertError) {
                console.error('Insert error:', insertError);
            }

            // Add timeline event
            await supabase.from('timeline_events').insert({
                case_id: caseId,
                event_type: 'document',
                author_id: user.lawyer_id || user.user_id,
                author_type: 'lawyer',
                title: uploadType === 'defense_memo' ? 'تم رفع مذكرة دفاعية' : 'تم رفع مستندات جديدة',
                description: uploadNotes || `تم رفع ${uploadedFiles.length} ملف`,
                visibility: 'all'
            });

            // Send notification to court clerk via backend
            try {
                const response = await fetch('https://justice-connect-mobile.onrender.com/api/court-clerk/notifications/document-uploaded', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        case_id: caseId,
                        filing_id: filing?.filing_id,
                        document_type: uploadType === 'defense_memo' ? 'مذكرة دفاعية' : 'مستندات جديدة',
                        document_count: uploadedFiles.length,
                        lawyer_name: user.full_name || user.name
                    })
                });
            } catch (notifError) {
                console.error('Notification error:', notifError);
            }

            toast.success(uploadType === 'defense_memo' ? 'تم رفع المذكرة الدفاعية بنجاح' : 'تم رفع المستندات بنجاح');
            setShowUploadModal(false);
            setUploadFiles([]);
            setUploadNotes('');
            setUploadType('');

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('حدث خطأ أثناء رفع الملفات');
        } finally {
            setUploading(false);
        }
    };

    // Handle postponement request
    const handlePostponeRequest = async () => {
        if (!postponeReason.trim()) {
            toast.error('يرجى إدخال سبب التأجيل');
            return;
        }

        setPostponeSubmitting(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const nextHearing = hearings.find(h => h.hearing_status === 'scheduled' && new Date(h.hearing_date) > new Date());

        try {
            // Add postponement request to timeline_events
            const { error: insertError } = await supabase.from('timeline_events').insert({
                case_id: caseId,
                event_type: 'postpone',
                author_id: user.lawyer_id || user.user_id,
                author_type: 'lawyer',
                title: 'طلب تأجيل جلسة',
                description: `سبب التأجيل: ${postponeReason}${nextHearing ? ` - الجلسة المطلوب تأجيلها: ${new Date(nextHearing.hearing_date).toLocaleDateString('ar-EG')}` : ''}`,
                visibility: 'all'
            });

            if (insertError) {
                console.error('Insert error:', insertError);
            }

            // Send notification to court clerk
            try {
                await fetch('https://justice-connect-mobile.onrender.com/api/court-clerk/notifications/postpone-request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        case_id: caseId,
                        hearing_id: nextHearing?.hearing_id,
                        reason: postponeReason,
                        hearing_date: nextHearing?.hearing_date,
                        lawyer_name: user.full_name || user.name
                    })
                });
            } catch (notifError) {
                console.error('Notification error:', notifError);
            }

            toast.success('تم إرسال طلب التأجيل بنجاح');
            setShowPostponeModal(false);
            setPostponeReason('');

        } catch (error) {
            console.error('Postpone request error:', error);
            toast.error('حدث خطأ أثناء إرسال الطلب');
        } finally {
            setPostponeSubmitting(false);
        }
    };

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
        // Build query params for file-case page
        const handleNavigateToFileCasePage = () => {
            const params = new URLSearchParams();
            params.set('caseId', caseId);
            if (caseData?.client_id) params.set('clientId', caseData.client_id);
            if (caseData?.title) params.set('title', caseData.title);
            if (caseData?.case_type) params.set('caseType', caseData.case_type);
            if (caseData?.description) params.set('description', caseData.description);
            navigate(`/lawyer/file-case?${params.toString()}`);
        };

        return (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-600">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                    لا توجد لائحة مقدمة
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    لم يتم تقديم لائحة دعوى رسمية لهذه القضية بعد. يمكنك تقديم الدعوى إلكترونياً لقلم المحكمة.
                </p>

                {/* Case Info Summary */}
                {caseData?.client_id && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 max-w-md mx-auto border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3 text-right">
                            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">القضية مرتبطة بعميل</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    سيتم ربط الدعوى تلقائياً بالقضية #{caseData.case_number || caseId}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleNavigateToFileCasePage}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                    <Scale className="w-6 h-6" />
                    <span>تقديم دعوى رسمية</span>
                    <ExternalLink className="w-5 h-5" />
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    سيتم توجيهك لصفحة تقديم الدعوى الإلكترونية
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

            {/* Action Buttons for Current Stage */}
            {currentStage.actions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        الإجراءات المتاحة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentStage.actions.map((action) => {
                            const ActionIcon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => handleAction(action.id)}
                                    disabled={actionLoading === action.id}
                                    className={`flex items-center gap-3 p-4 rounded-xl transition-all ${action.variant === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : action.variant === 'primary'
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                                        } ${actionLoading === action.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {actionLoading === action.id ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <ActionIcon className="w-5 h-5" />
                                    )}
                                    <span className="font-medium">{action.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filing Update Response - shows when update_required */}
            {currentStageKey === 'update_required' && (
                <FilingUpdateResponse filing={filing} onUpdateSent={loadFilingData} />
            )}

            {/* Appeal Stages Progress Timeline - Shows only if there's an appeal */}
            {caseAppeal && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-lg p-6 border-2 border-purple-200 dark:border-purple-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Scale className="w-5 h-5 text-purple-600" />
                        مراحل الاستئناف (10 مراحل)
                    </h3>

                    <div className="relative overflow-x-auto">
                        <div className="flex gap-2 min-w-max pb-4">
                            {Object.entries(APPEAL_STAGES_CONFIG).map(([key, stage], index) => {
                                const StepIcon = stage.icon;
                                const currentStage = caseAppeal.appeal_stage;
                                const currentOrder = APPEAL_STAGES_CONFIG[currentStage]?.order || 1;
                                const isActive = currentStage === key;
                                const isPast = stage.order < currentOrder;

                                return (
                                    <div key={key} className="flex flex-col items-center relative">
                                        {index > 0 && (
                                            <div className={`absolute top-5 right-full w-2 h-0.5 ${isPast ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
                                                }`} />
                                        )}

                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? 'ring-4 ring-opacity-30' : ''
                                                } ${isPast ? 'bg-purple-500 text-white' : isActive ? '' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                                            style={isActive ? {
                                                backgroundColor: stage.color,
                                                color: 'white',
                                                boxShadow: `0 0 0 4px ${stage.color}40`
                                            } : {}}
                                        >
                                            <StepIcon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[10px] mt-2 text-center max-w-[60px] leading-tight ${isActive ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400'
                                            }`}>
                                            {stage.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Current Appeal Stage Description */}
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {APPEAL_STAGES_CONFIG[caseAppeal.appeal_stage]?.description || 'جاري معالجة الاستئناف'}
                        </p>
                    </div>

                    {/* Next Hearing Info - يظهر إذا كانت هناك جلسة قادمة */}
                    {caseAppeal.hearings?.length > 0 && (
                        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-r-4 border-indigo-500">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="text-indigo-600" size={18} />
                                <span className="font-medium text-indigo-800 dark:text-indigo-300">
                                    {caseAppeal.hearings.filter(h => h.hearing_status === 'scheduled').length > 0
                                        ? 'الجلسة القادمة'
                                        : `جلسات الاستئناف (${caseAppeal.hearings.length})`}
                                </span>
                            </div>
                            {(() => {
                                const nextHearing = caseAppeal.hearings.find(h => h.hearing_status === 'scheduled');
                                if (nextHearing) {
                                    return (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-500">التاريخ:</span>
                                                <p className="font-bold text-indigo-700 dark:text-indigo-400">
                                                    {new Date(nextHearing.hearing_date).toLocaleDateString('ar-EG')}
                                                </p>
                                            </div>
                                            {nextHearing.hearing_time && (
                                                <div>
                                                    <span className="text-gray-500">الوقت:</span>
                                                    <p className="font-medium">{nextHearing.hearing_time}</p>
                                                </div>
                                            )}
                                            {nextHearing.hearing_room && (
                                                <div>
                                                    <span className="text-gray-500">القاعة:</span>
                                                    <p className="font-medium">{nextHearing.hearing_room}</p>
                                                </div>
                                            )}
                                            {nextHearing.assigned_judge && (
                                                <div>
                                                    <span className="text-gray-500">القاضي:</span>
                                                    <p className="font-medium">{nextHearing.assigned_judge}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                } else {
                                    return (
                                        <p className="text-sm text-indigo-700 dark:text-indigo-400">
                                            تم عقد {caseAppeal.hearings.length} جلسة
                                        </p>
                                    );
                                }
                            })()}
                        </div>
                    )}

                    {/* Appeal Decision Info - يظهر إذا صدر حكم */}
                    {caseAppeal.appeal_decision_type && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-r-4 border-green-500">
                            <div className="flex items-center gap-2 mb-2">
                                <Gavel className="text-green-600" size={18} />
                                <span className="font-medium text-green-800 dark:text-green-300">حكم الاستئناف</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${caseAppeal.appeal_decision_type === 'upheld' ? 'bg-gray-200 text-gray-700' :
                                    caseAppeal.appeal_decision_type === 'modified' ? 'bg-yellow-200 text-yellow-700' :
                                        caseAppeal.appeal_decision_type === 'overturned' ? 'bg-green-200 text-green-700' :
                                            'bg-blue-200 text-blue-700'
                                    }`}>
                                    {caseAppeal.appeal_decision_type === 'upheld' && 'تأييد الحكم'}
                                    {caseAppeal.appeal_decision_type === 'modified' && 'تعديل الحكم'}
                                    {caseAppeal.appeal_decision_type === 'overturned' && 'إلغاء الحكم'}
                                    {caseAppeal.appeal_decision_type === 'remanded' && 'إعادة للمحكمة الأدنى'}
                                </span>
                                {caseAppeal.appeal_decision_date && (
                                    <span className="text-sm text-gray-500">
                                        {new Date(caseAppeal.appeal_decision_date).toLocaleDateString('ar-EG')}
                                    </span>
                                )}
                            </div>
                            {caseAppeal.appeal_decision_summary && (
                                <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                                    {caseAppeal.appeal_decision_summary}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Transferred Court Info */}
                    {caseAppeal.transferred_to_court && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-r-4 border-purple-500">
                            <div className="flex items-center gap-2 mb-2">
                                <Truck className="text-purple-600" size={18} />
                                <span className="font-medium text-purple-800 dark:text-purple-300">محكمة الاستئناف</span>
                            </div>
                            <p className="text-sm text-purple-700 dark:text-purple-400">
                                <strong>المحكمة:</strong> {caseAppeal.transferred_to_court}
                            </p>
                            {caseAppeal.appeal_court_case_number && (
                                <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                                    <strong>رقم القضية:</strong> {caseAppeal.appeal_court_case_number}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Stages Progress Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-blue-500" />
                    مراحل الدعوى (15 مرحلة)
                </h3>

                <div className="relative overflow-x-auto stage-scrollbar">
                    <div className="flex gap-2 min-w-max pb-6">
                        {Object.entries(STAGES_CONFIG).map(([key, stage], index) => {
                            const StepIcon = stage.icon;
                            const currentOrder = STAGES_CONFIG[currentStageKey]?.order || 1;
                            const isActive = currentStageKey === key;
                            const isPast = stage.order < currentOrder;

                            return (
                                <div key={key} className="flex flex-col items-center relative">
                                    {index > 0 && (
                                        <div className={`absolute top-5 right-full w-2 h-0.5 ${isPast ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                            }`} />
                                    )}

                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? 'ring-4 ring-opacity-30' : ''
                                            } ${isPast ? 'bg-green-500 text-white' : isActive ? '' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                                        style={isActive ? {
                                            backgroundColor: stage.color,
                                            color: 'white',
                                            boxShadow: `0 0 0 4px ${stage.color}40`
                                        } : {}}
                                    >
                                        <StepIcon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[10px] mt-2 text-center max-w-[60px] leading-tight ${isActive ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400'
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
                    title="تفاصيل اللائحة"
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
                                    <InfoRow label="الرسوم" value={`${filing.court_fees} ₪`} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Review Notes - Show when update requested */}
                    {filing.requested_changes && (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-t border-orange-200 dark:border-orange-800">
                            <h4 className="text-orange-800 dark:text-orange-400 font-semibold mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                التعديلات المطلوبة من قلم المحكمة
                            </h4>
                            <p className="text-orange-700 dark:text-orange-300 whitespace-pre-wrap">{filing.requested_changes}</p>
                        </div>
                    )}

                    {/* Lawyer Response - Show if exists */}
                    {filing.lawyer_response && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
                            <h4 className="text-blue-800 dark:text-blue-400 font-semibold mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                رد المحامي
                            </h4>
                            <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">{filing.lawyer_response}</p>
                            {filing.lawyer_response_date && (
                                <p className="text-sm text-blue-500 mt-2">تاريخ الرد: {formatDate(filing.lawyer_response_date)}</p>
                            )}
                        </div>
                    )}

                    {filing.rejection_reason && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                            <h4 className="text-red-800 dark:text-red-400 font-semibold mb-2 flex items-center gap-2">
                                <XCircle className="w-4 h-4" />
                                سبب الرفض
                            </h4>
                            <p className="text-red-700 dark:text-red-300">{filing.rejection_reason}</p>
                        </div>
                    )}

                    {filing.review_notes && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                            <h4 className="text-gray-800 dark:text-gray-200 font-semibold mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                ملاحظات المراجعة
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300">{filing.review_notes}</p>
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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hearing.hearing_status === 'held' ? 'bg-green-100 text-green-600' :
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
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${hearing.hearing_status === 'held' ? 'bg-green-100 text-green-800' :
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
                                {hearing.hearing_minutes_url && (
                                    <a href={hearing.hearing_minutes_url} target="_blank" rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                                        <Download className="w-4 h-4" />
                                        تحميل محضر الجلسة
                                    </a>
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
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${decision.decision_type === 'final_judgment' ? 'bg-red-100 text-red-600' :
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
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${decision.decision_type === 'final_judgment' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
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
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${decision.in_favor_of === 'plaintiff' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
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

            {/* Appeal Status Section */}
            {caseAppeal && (
                <CollapsibleSection
                    title="حالة الاستئناف"
                    icon={Scale}
                    iconColor="text-purple-500"
                    isExpanded={expandedSection === 'appeal'}
                    onToggle={() => setExpandedSection(expandedSection === 'appeal' ? null : 'appeal')}
                >
                    <div className="p-4 space-y-4">
                        {/* Appeal Info Card */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Scale className="text-purple-600" size={20} />
                                    <span className="font-bold text-gray-900 dark:text-white">{caseAppeal.appeal_number}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${caseAppeal.appeal_stage === 'appeal_update_required'
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                    : caseAppeal.appeal_stage === 'appeal_accepted'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : caseAppeal.appeal_stage === 'appeal_rejected'
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                    {caseAppeal.appeal_stage === 'appeal_submitted' && 'تم التقديم'}
                                    {caseAppeal.appeal_stage === 'appeal_under_review' && 'قيد المراجعة'}
                                    {caseAppeal.appeal_stage === 'appeal_update_required' && 'مطلوب تعديل'}
                                    {caseAppeal.appeal_stage === 'appeal_accepted' && 'مقبول'}
                                    {caseAppeal.appeal_stage === 'appeal_rejected' && 'مرفوض'}
                                    {caseAppeal.appeal_stage === 'appeal_file_transferred' && 'تم الإحالة'}
                                    {caseAppeal.appeal_stage === 'appeal_hearing_scheduled' && 'تم تحديد جلسة'}
                                    {caseAppeal.appeal_stage === 'appeal_hearings_ongoing' && 'جلسات جارية'}
                                    {caseAppeal.appeal_stage === 'appeal_decision_issued' && 'صدر الحكم'}
                                    {caseAppeal.appeal_stage === 'appeal_case_closed' && 'منتهي'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-500">نوع الاستئناف:</span>
                                    <p className="font-medium">{caseAppeal.appeal_type === 'full_appeal' ? 'كامل' : 'جزئي'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">تاريخ التقديم:</span>
                                    <p className="font-medium">{new Date(caseAppeal.submitted_at).toLocaleDateString('ar-EG')}</p>
                                </div>
                            </div>

                            {/* Update Required Alert */}
                            {caseAppeal.appeal_stage === 'appeal_update_required' && (
                                <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <p className="font-medium text-orange-800 dark:text-orange-300">مطلوب تعديلات</p>
                                            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                                                {caseAppeal.update_required_notes || 'يرجى مراجعة طلب التعديل وتقديم المستندات المطلوبة'}
                                            </p>
                                            <button
                                                onClick={() => setShowAppealUpdateModal(true)}
                                                className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm flex items-center gap-2"
                                            >
                                                <Send size={16} />
                                                تقديم التعديلات
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {caseAppeal.appeal_stage === 'appeal_rejected' && caseAppeal.rejection_reason && (
                                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <p className="font-medium text-red-800 dark:text-red-300">سبب الرفض:</p>
                                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">{caseAppeal.rejection_reason}</p>
                                </div>
                            )}

                            {/* Appeal Decision */}
                            {caseAppeal.appeal_decision_type && (
                                <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <p className="font-medium text-green-800 dark:text-green-300 mb-1">حكم الاستئناف:</p>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${caseAppeal.appeal_decision_type === 'upheld' ? 'bg-gray-200 text-gray-700' :
                                        caseAppeal.appeal_decision_type === 'modified' ? 'bg-yellow-200 text-yellow-700' :
                                            caseAppeal.appeal_decision_type === 'overturned' ? 'bg-green-200 text-green-700' :
                                                'bg-blue-200 text-blue-700'
                                        }`}>
                                        {caseAppeal.appeal_decision_type === 'upheld' && 'تأييد الحكم'}
                                        {caseAppeal.appeal_decision_type === 'modified' && 'تعديل الحكم'}
                                        {caseAppeal.appeal_decision_type === 'overturned' && 'إلغاء الحكم'}
                                        {caseAppeal.appeal_decision_type === 'remanded' && 'إعادة للمحكمة الأدنى'}
                                    </span>
                                    {caseAppeal.appeal_decision_summary && (
                                        <p className="text-sm text-green-700 dark:text-green-400 mt-2">{caseAppeal.appeal_decision_summary}</p>
                                    )}
                                    {caseAppeal.appeal_decision_date && (
                                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                            تاريخ الحكم: {new Date(caseAppeal.appeal_decision_date).toLocaleDateString('ar-EG')}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Transferred Court Info */}
                            {caseAppeal.transferred_to_court && (
                                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-r-4 border-purple-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Truck className="text-purple-600" size={18} />
                                        <span className="font-medium text-purple-800 dark:text-purple-300">تم إحالة الملف</span>
                                    </div>
                                    <p className="text-sm text-purple-700 dark:text-purple-400">
                                        <strong>المحكمة:</strong> {caseAppeal.transferred_to_court}
                                    </p>
                                    {caseAppeal.appeal_court_case_number && (
                                        <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                                            <strong>رقم القضية:</strong> {caseAppeal.appeal_court_case_number}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Appeal Hearings */}
                        {caseAppeal.hearings?.length > 0 && (
                            <div className="border-t pt-4 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                                    <Calendar className="text-indigo-500" size={16} />
                                    جلسات الاستئناف ({caseAppeal.hearings.length})
                                </p>
                                <div className="space-y-2">
                                    {caseAppeal.hearings.map((hearing, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                                {hearing.hearing_number || i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {new Date(hearing.hearing_date).toLocaleDateString('ar-EG')}
                                                    {hearing.hearing_time && ` - ${hearing.hearing_time}`}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {hearing.hearing_room && `قاعة ${hearing.hearing_room}`}
                                                    {hearing.assigned_judge && ` • القاضي: ${hearing.assigned_judge}`}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs ${hearing.hearing_status === 'held' ? 'bg-green-100 text-green-700' :
                                                hearing.hearing_status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {hearing.hearing_status === 'held' ? 'منعقدة' :
                                                    hearing.hearing_status === 'scheduled' ? 'مجدولة' : hearing.hearing_status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stage History */}
                        {caseAppeal.stage_history?.length > 0 && (
                            <div className="border-t pt-4 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">سجل المراحل:</p>
                                <div className="space-y-2">
                                    {caseAppeal.stage_history.slice(0, 5).map((h, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{new Date(h.created_at).toLocaleDateString('ar-EG')}</span>
                                            <span>•</span>
                                            <span>{h.reason || 'تغيير المرحلة'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${service.attempt_result === 'served' ? 'bg-green-100 text-green-800' :
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

            {/* Upload Documents Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {uploadType === 'defense_memo' ? 'رفع مذكرة دفاعية أو ردية' : 'رفع مستندات جديدة'}
                                </h3>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* File Upload Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors mb-4"
                            >
                                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-600 dark:text-gray-400">اضغط لرفع الملفات أو اسحبها هنا</p>
                                <p className="text-sm text-gray-400 mt-1">PDF, Word, صور (حد أقصى 10 ميجابايت)</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {/* Selected Files */}
                            {uploadFiles.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {uploadFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Paperclip className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                                                <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                            </div>
                                            <button
                                                onClick={() => removeUploadFile(index)}
                                                className="p-1 hover:bg-red-100 rounded text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Notes */}
                            <textarea
                                value={uploadNotes}
                                onChange={(e) => setUploadNotes(e.target.value)}
                                placeholder="ملاحظات إضافية (اختياري)"
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-4"
                                rows={3}
                            />

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleUploadDocuments}
                                    disabled={uploading || uploadFiles.length === 0}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            جاري الرفع...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            رفع الملفات
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadFiles([]);
                                        setUploadNotes('');
                                    }}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Postponement Request Modal */}
            <AnimatePresence>
                {showPostponeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPostponeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    طلب تأجيل الجلسة القادمة
                                </h3>
                                <button
                                    onClick={() => setShowPostponeModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Next Hearing Info */}
                            {hearings.find(h => h.hearing_status === 'scheduled' && new Date(h.hearing_date) > new Date()) && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                        <strong>الجلسة القادمة:</strong>{' '}
                                        {new Date(hearings.find(h => h.hearing_status === 'scheduled' && new Date(h.hearing_date) > new Date())?.hearing_date).toLocaleDateString('ar-EG', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            )}

                            {/* Reason */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    سبب طلب التأجيل *
                                </label>
                                <textarea
                                    value={postponeReason}
                                    onChange={(e) => setPostponeReason(e.target.value)}
                                    placeholder="اذكر السبب المقنع لطلب التأجيل..."
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                    rows={4}
                                />
                            </div>

                            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                سيتم مراجعة الطلب من قبل قلم المحكمة
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePostponeRequest}
                                    disabled={postponeSubmitting || !postponeReason.trim()}
                                    className="flex-1 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {postponeSubmitting ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            جاري الإرسال...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            إرسال الطلب
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPostponeModal(false);
                                        setPostponeReason('');
                                    }}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Appeal Modal */}
            <AnimatePresence>
                {showAppealModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto appeal-modal"
                            dir="rtl"
                        >
                            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Scale className="text-blue-600" />
                                    تقديم استئناف
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowAppealModal(false);
                                        setAppealData({ appeal_type: 'full_appeal', appeal_reasons: '', documents: [] });
                                    }}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Case Info */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>القضية:</strong> {caseData?.case_number || caseId}
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        <strong>العنوان:</strong> {caseData?.title || '-'}
                                    </p>
                                </div>

                                {/* Appeal Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        نوع الاستئناف *
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setAppealData(prev => ({ ...prev, appeal_type: 'full_appeal' }))}
                                            className={`p-4 rounded-lg border-2 text-center transition ${appealData.appeal_type === 'full_appeal'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                                                }`}
                                        >
                                            <Scale className="mx-auto mb-2 text-blue-600" size={28} />
                                            <p className="font-medium">استئناف كامل</p>
                                            <p className="text-xs text-gray-500 mt-1">طعن في الحكم بالكامل</p>
                                        </button>
                                        <button
                                            onClick={() => setAppealData(prev => ({ ...prev, appeal_type: 'partial_appeal' }))}
                                            className={`p-4 rounded-lg border-2 text-center transition ${appealData.appeal_type === 'partial_appeal'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                                                }`}
                                        >
                                            <FileText className="mx-auto mb-2 text-orange-600" size={28} />
                                            <p className="font-medium">استئناف جزئي</p>
                                            <p className="text-xs text-gray-500 mt-1">طعن في جزء من الحكم</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Appeal Reasons */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        أسباب الاستئناف *
                                    </label>
                                    <textarea
                                        value={appealData.appeal_reasons}
                                        onChange={(e) => setAppealData(prev => ({ ...prev, appeal_reasons: e.target.value }))}
                                        rows={5}
                                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                        placeholder="اكتب أسباب الاستئناف بالتفصيل...&#10;&#10;مثال:&#10;1. خطأ في تطبيق القانون&#10;2. إغفال أدلة جوهرية&#10;3. مخالفة الإجراءات"
                                    />
                                </div>

                                {/* Documents Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        المستندات المؤيدة (اختياري)
                                    </label>
                                    <input
                                        type="file"
                                        ref={appealFileInputRef}
                                        onChange={handleAppealFileSelect}
                                        multiple
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => appealFileInputRef.current?.click()}
                                        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 transition flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                                    >
                                        <Upload size={20} />
                                        إضافة مستندات
                                    </button>

                                    {/* Uploaded files list */}
                                    {appealData.documents.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {appealData.documents.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <span className="text-sm truncate flex-1">{file.name}</span>
                                                    <button
                                                        onClick={() => removeAppealDocument(i)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Info Box */}
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg flex items-start gap-3">
                                    <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                                    <div className="text-sm text-amber-800 dark:text-amber-300">
                                        <p className="font-medium mb-1">ملاحظة هامة:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>يجب تقديم الاستئناف خلال 30 يوماً من صدور الحكم</li>
                                            <li>سيتم مراجعة الاستئناف من قبل قلم المحكمة</li>
                                            <li>قد يُطلب منك تعديلات أو مستندات إضافية</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSubmitAppeal}
                                        disabled={appealSubmitting || !appealData.appeal_reasons.trim()}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {appealSubmitting ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                جاري التقديم...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                تقديم الاستئناف
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAppealModal(false);
                                            setAppealData({ appeal_type: 'full_appeal', appeal_reasons: '', documents: [] });
                                        }}
                                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Appeal Update Modal - لتقديم التعديلات */}
            <AnimatePresence>
                {showAppealUpdateModal && caseAppeal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
                            dir="rtl"
                        >
                            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <AlertTriangle className="text-orange-600" />
                                    تقديم التعديلات المطلوبة
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowAppealUpdateModal(false);
                                        setAppealUpdateData({ update_response: '', additional_documents: [] });
                                    }}
                                    className="text-gray-500 hover:text-gray-700 p-1"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Required Changes Info */}
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">التعديلات المطلوبة:</p>
                                    <p className="text-sm text-orange-700 dark:text-orange-400">
                                        {caseAppeal.update_required_notes || 'يرجى مراجعة الاستئناف وتقديم المستندات المطلوبة'}
                                    </p>
                                </div>

                                {/* Response */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        ردك على طلب التعديل *
                                    </label>
                                    <textarea
                                        value={appealUpdateData.update_response}
                                        onChange={(e) => setAppealUpdateData(prev => ({ ...prev, update_response: e.target.value }))}
                                        rows={5}
                                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-orange-500"
                                        placeholder="اكتب ردك على طلب التعديل وأي توضيحات إضافية..."
                                    />
                                </div>

                                {/* Additional Documents */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        مستندات إضافية (اختياري)
                                    </label>
                                    <input
                                        type="file"
                                        ref={appealUpdateFileRef}
                                        onChange={handleAppealUpdateFileSelect}
                                        multiple
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => appealUpdateFileRef.current?.click()}
                                        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-400 transition flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
                                    >
                                        <Upload size={20} />
                                        إضافة مستندات
                                    </button>

                                    {appealUpdateData.additional_documents.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {appealUpdateData.additional_documents.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <span className="text-sm truncate flex-1">{file.name}</span>
                                                    <button
                                                        onClick={() => setAppealUpdateData(prev => ({
                                                            ...prev,
                                                            additional_documents: prev.additional_documents.filter((_, idx) => idx !== i)
                                                        }))}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSubmitAppealUpdate}
                                        disabled={appealUpdateSubmitting || !appealUpdateData.update_response.trim()}
                                        className="flex-1 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {appealUpdateSubmitting ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                جاري الإرسال...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                إرسال التعديلات
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAppealUpdateModal(false);
                                            setAppealUpdateData({ update_response: '', additional_documents: [] });
                                        }}
                                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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

export default CourtFilingTracker;
