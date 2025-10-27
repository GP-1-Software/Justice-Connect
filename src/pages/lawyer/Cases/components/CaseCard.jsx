import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, FileText, ArrowRight } from 'lucide-react';

const CaseCard = ({ caseData }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'active': { label: 'نشط', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      'in_progress': { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      'completed': { label: 'مكتمل', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      'closed': { label: 'مغلق', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
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
      className="bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/lawyer/cases/${caseData.case_id}`)}
    >
      <div className="p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <span className="text-xs text-gray-400">#{formatCaseId(caseData)}</span>
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

        {/* View Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
            عرض التفاصيل
          </span>
          <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default CaseCard;
