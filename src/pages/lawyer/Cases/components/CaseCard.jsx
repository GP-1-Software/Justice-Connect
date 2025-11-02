import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, FileText, ArrowRight, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';

const CaseCard = ({ caseData, onCaseDeleted, onCaseUpdated }) => {
  const navigate = useNavigate();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    if (!confirm(`هل أنت متأكد من حذف القضية "${caseData.title}"؟`)) {
      return;
    }

    try {
      console.log('Attempting to delete case:', caseData.case_id);
      
      const { data, error } = await supabase
        .from('cases')
        .delete()
        .eq('case_id', caseData.case_id)
        .select();

      console.log('Delete result:', { data, error });

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      // Check if any rows were deleted
      if (!data || data.length === 0) {
        throw new Error('لم يتم حذف أي سجل. قد تكون هناك مشكلة في الصلاحيات.');
      }

      alert('تم حذف القضية بنجاح');
      
      // Call callback to update parent state
      if (onCaseDeleted) {
        onCaseDeleted(caseData.case_id);
      }
    } catch (error) {
      console.error('Delete error:', error.message);
      alert(`حدث خطأ أثناء حذف القضية: ${error.message}`);
      // Don't update UI if delete failed
    }
  };

  const handleAccept = async (e) => {
    e.stopPropagation(); // Prevent card click

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
    e.stopPropagation(); // Prevent card click
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'active': { label: 'نشط', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      'in_progress': { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      'completed': { label: 'مكتمل', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      'closed': { label: 'مغلق', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      'rejected': { label: 'مرفوض', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    };
    return statusMap[status] || statusMap['pending'];
  };

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

  const formatCaseId = (caseData) => {
    // If case_number exists and is properly formatted, use it
    if (caseData.case_number && caseData.case_number.includes('CASE-')) {
      return caseData.case_number;
    }
    
    // If case_id is a serial integer, format it properly
    if (caseData.case_id && typeof caseData.case_id === 'number') {
      const year = new Date(caseData.created_at || Date.now()).getFullYear();
      return `CASE-${year}-${String(caseData.case_id).padStart(5, '0')}#`;
    }
    
    // Fallback to case_id or case_number
    return caseData.case_number || caseData.case_id || 'N/A';
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-xl transition-all duration-300 cursor-pointer group border-r-4 border-blue-500"
      onClick={() => navigate(`/lawyer/cases/${caseData.case_id}`)}
    >
      <div className="p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">#{caseData.case_id}</span>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group/delete"
              title="حذف القضية"
            >
              <Trash2 className="h-4 w-4 text-gray-400 group-hover/delete:text-red-600" />
            </button>
          </div>
        </div>

        {/* Case Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {caseData.title || 'قضية بدون عنوان'}
        </h3>

        {/* Case Info */}
        <div className="space-y-2 mb-4">
          {caseData.client_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="h-4 w-4 text-gray-400" />
              <span>{caseData.client_name}</span>
            </div>
          )}
          
          {caseData.case_type && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <FileText className="h-4 w-4 text-gray-400" />
              <span>{getCaseTypeLabel(caseData.case_type)}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>آخر تحديث: {formatDate(caseData.updated_at)}</span>
          </div>
        </div>

        {/* Description Preview */}
        {caseData.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
            {caseData.description}
          </p>
        )}

        {/* Actions for Pending Cases */}
        {caseData.status === 'pending' && (
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              قبول
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              رفض
            </button>
          </div>
        )}

        {/* View Button for Non-Pending Cases */}
        {caseData.status !== 'pending' && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
              عرض التفاصيل
            </span>
            <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              سبب رفض القضية
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="اكتب سبب رفض القضية..."
              className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmReject}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRejectModal(false);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition disabled:opacity-50"
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
