import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, FileText, ArrowLeft, Trash2, Check, X, Building2, Ban } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';

const CaseCard = ({ caseData, onCaseDeleted, onCaseUpdated }) => {
  const navigate = useNavigate();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();

    if (!confirm(`هل أنت متأكد من حذف القضية "${caseData.title}"؟`)) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cases')
        .delete()
        .eq('case_id', caseData.case_id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('لم يتم حذف أي سجل. قد تكون هناك مشكلة في الصلاحيات.');
      }

      alert('تم حذف القضية بنجاح');

      if (onCaseDeleted) {
        onCaseDeleted(caseData.case_id);
      }
    } catch (error) {
      console.error('Delete error:', error.message);
      alert(`حدث خطأ أثناء حذف القضية: ${error.message}`);
    }
  };

  const handleAccept = async (e) => {
    e.stopPropagation();

    if (!confirm('هل أنت متأكد من قبول هذه القضية؟')) {
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('case_id', caseData.case_id)
        .select()
        .single();

      if (error) throw error;

      alert('تم قبول القضية بنجاح');

      if (onCaseUpdated) {
        onCaseUpdated(data);
      }
    } catch (error) {
      console.error('Accept error:', error.message);
      alert(`حدث خطأ أثناء قبول القضية: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (e) => {
    e.stopPropagation();
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('الرجاء إدخال سبب الرفض');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('case_id', caseData.case_id)
        .select()
        .single();

      if (error) throw error;

      alert('تم رفض القضية');
      setShowRejectModal(false);

      if (onCaseUpdated) {
        onCaseUpdated(data);
      }
    } catch (error) {
      console.error('Reject error:', error.message);
      alert(`حدث خطأ أثناء رفض القضية: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Court Stage configuration (14 stages from court clerk system)
  const COURT_STAGES = {
    'submitted': { label: 'تم التقديم', color: 'gray' },
    'under_review': { label: 'قيد المراجعة', color: 'orange' },
    'update_required': { label: 'مطلوب تعديل', color: 'red' },
    'ready_for_registration': { label: 'جاهزة للتسجيل', color: 'blue' },
    'registered': { label: 'مسجلة رسمياً', color: 'teal' },
    'service_in_progress': { label: 'جاري التبليغ', color: 'purple' },
    'service_completed': { label: 'تم التبليغ', color: 'indigo' },
    'awaiting_response': { label: 'بانتظار الرد', color: 'yellow' },
    'first_hearing_scheduled': { label: 'جلسة أولى محددة', color: 'cyan' },
    'hearings_ongoing': { label: 'جلسات جارية', color: 'blue' },
    'judgment_issued': { label: 'صدر الحكم', color: 'amber' },
    'appeal_period': { label: 'فترة استئناف', color: 'orange' },
    'in_execution': { label: 'قيد التنفيذ', color: 'violet' },
    'fully_executed': { label: 'تم التنفيذ', color: 'green' }
  };

  const getCourtStageBadge = (stage) => {
    const stageInfo = COURT_STAGES[stage];
    if (!stageInfo) return null;
    
    const colorMap = {
      'gray': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-500' },
      'orange': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-500' },
      'red': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-500' },
      'blue': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500' },
      'teal': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-500' },
      'purple': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500' },
      'indigo': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-500' },
      'yellow': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-500' },
      'cyan': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-500' },
      'amber': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500' },
      'violet': { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-500' },
      'green': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-500' }
    };
    
    return { ...stageInfo, ...colorMap[stageInfo.color] };
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': {
        label: 'معلقة',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-700 dark:text-orange-400',
        borderColor: 'border-t-4 border-t-orange-500',
        statusBarBg: 'bg-gradient-to-r from-orange-400 to-orange-600',
        glowColor: 'shadow-orange-500/20'
      },
      'active': {
        label: 'نشطة',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-700 dark:text-green-400',
        borderColor: 'border-t-4 border-t-green-500',
        statusBarBg: 'bg-gradient-to-r from-green-400 to-green-600',
        glowColor: 'shadow-green-500/20'
      },
      'in_progress': {
        label: 'قيد التنفيذ',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-700 dark:text-blue-400',
        borderColor: 'border-t-4 border-t-blue-500',
        statusBarBg: 'bg-gradient-to-r from-blue-400 to-blue-600',
        glowColor: 'shadow-blue-500/20'
      },
      'completed': {
        label: 'مكتملة',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        textColor: 'text-gray-700 dark:text-gray-400',
        borderColor: 'border-t-4 border-t-gray-500',
        statusBarBg: 'bg-gradient-to-r from-gray-400 to-gray-600',
        glowColor: 'shadow-gray-500/20'
      },
      'closed': {
        label: 'مغلقة',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        textColor: 'text-red-700 dark:text-red-400',
        borderColor: 'border-t-4 border-t-red-500',
        statusBarBg: 'bg-gradient-to-r from-red-400 to-red-600',
        glowColor: 'shadow-red-500/20'
      },
      'rejected': {
        label: 'مرفوضة',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        textColor: 'text-gray-700 dark:text-gray-400',
        borderColor: 'border-t-4 border-t-gray-500',
        statusBarBg: 'bg-gradient-to-r from-gray-400 to-gray-600',
        glowColor: 'shadow-gray-500/20'
      }
    };
    return statusMap[status] || statusMap['pending'];
  };

  // Check if case needs accept/reject buttons
  // Only show if: status is pending AND case was assigned by someone else (has client_id but no case_stage means client created it)
  const showAcceptRejectButtons = caseData.status === 'pending' && !caseData.case_stage && caseData.client_id;
  
  const courtStageBadge = getCourtStageBadge(caseData.case_stage);

  const getCaseTypeLabel = (caseType) => {
    const typeMap = {
      'civil': 'مدني',
      'criminal': 'جنائي',
      'commercial': 'تجاري',
      'family': 'أسري',
      'labor': 'عمالي',
      'real_estate': 'عقاري',
      'administrative': 'إداري',
      'مدني': 'مدني',
      'جنائي': 'جنائي',
      'تجاري': 'تجاري',
      'أسري': 'أسري',
      'عمالي': 'عمالي',
      'عقاري': 'عقاري',
      'إداري': 'إداري'
    };
    return typeMap[caseType] || caseType;
  };

  const statusInfo = getStatusBadge(caseData.status);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl ${caseData.is_disabled ? 'border-red-500 dark:border-red-600 opacity-75' : statusInfo.borderColor} border hover:shadow-2xl hover:${statusInfo.glowColor} transition-all duration-300 cursor-pointer overflow-hidden group hover:scale-[1.02] transform ${caseData.is_disabled ? '' : 'border-gray-200 dark:border-gray-700'}`}
      onClick={() => navigate(`/lawyer/cases/${caseData.case_id}`)}
    >
      {/* Disabled Banner */}
      {caseData.is_disabled && (
        <div className="bg-red-500 dark:bg-red-600 text-white px-4 py-2.5 flex items-center gap-2.5">
          <Ban className="w-5 h-5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">تم تعطيل هذه القضية من قبل الإدارة</p>
            {caseData.disabled_reason && (
              <p className="text-xs opacity-90 mt-0.5">السبب: {caseData.disabled_reason}</p>
            )}
          </div>
        </div>
      )}

      {/* Status Bar at Top */}
      <div className={`h-1.5 ${statusInfo.statusBarBg}`}></div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {/* Show Court Stage if exists, otherwise show status */}
          {courtStageBadge ? (
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold ${courtStageBadge.bg} ${courtStageBadge.text} border border-current/20`}>
              {courtStageBadge.label}
            </span>
          ) : (
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.textColor} border border-current/20`}>
              {statusInfo.label}
            </span>
          )}
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
            title="حذف القضية"
          >
            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[#0A3D91] dark:text-white mb-2 line-clamp-2 leading-tight">
          {caseData.title || 'قضية بدون عنوان'}
        </h3>

        {/* Case Number if exists */}
        {caseData.case_number && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-mono">
            #{caseData.case_number}
          </p>
        )}

        {/* Details */}
        <div className="space-y-2.5 mb-4">
          {caseData.client_name && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
              <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <User className="h-4 w-4 text-green-500" />
              </div>
              <span className="font-medium">{caseData.client_name}</span>
            </div>
          )}

          {caseData.case_type && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <span>{getCaseTypeLabel(caseData.case_type)}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-500">
            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Calendar className="h-4 w-4 text-purple-500" />
            </div>
            <span>آخر تحديث: {formatDate(caseData.updated_at)}</span>
          </div>

          {caseData.court_name && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
              <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Building2 className="h-4 w-4 text-amber-500" />
              </div>
              <span>{caseData.court_name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {caseData.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
            {caseData.description}
          </p>
        )}

        {/* Actions for Pending Cases - Only show if case was assigned by client, not created by lawyer */}
        {showAcceptRejectButtons && (
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              <Check className="h-4 w-4" />
              قبول
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              <X className="h-4 w-4" />
              رفض
            </button>
          </div>
        )}

        {/* View Button - Always show except when accept/reject buttons are shown */}
        {!showAcceptRejectButtons && (
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-[#0A3D91] dark:text-blue-400 font-bold">
              عرض التفاصيل
            </span>
            <ArrowLeft className="h-5 w-5 text-[#0A3D91] dark:text-blue-400 group-hover:-translate-x-2 transition-transform duration-300" />
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowRejectModal(false);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              سبب رفض القضية
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="اكتب سبب رفض القضية..."
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmReject}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRejectModal(false);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseCard;
