import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, User, FileText, Tag } from 'lucide-react';

const CaseHeader = ({ caseData }) => {
  const { t } = useTranslation();

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

  const statusInfo = getStatusBadge(caseData.status);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {caseData.title || t('cases.untitled') || 'قضية بدون عنوان'}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('cases.caseNumber') || 'رقم القضية'}: #{caseData.case_number || caseData.id}
          </p>
        </div>
      </div>

      {/* Case Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {caseData.client_name && (
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('cases.client') || 'العميل'}</p>
              <p className="font-semibold text-gray-900 dark:text-white">{caseData.client_name}</p>
            </div>
          </div>
        )}

        {caseData.case_type && (
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('cases.type') || 'النوع'}</p>
              <p className="font-semibold text-gray-900 dark:text-white">{caseData.case_type}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('cases.createdAt') || 'تاريخ الإنشاء'}</p>
            <p className="font-semibold text-gray-900 dark:text-white">{formatDate(caseData.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('cases.lastUpdate') || 'آخر تحديث'}</p>
            <p className="font-semibold text-gray-900 dark:text-white">{formatDate(caseData.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {caseData.description && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {caseData.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default CaseHeader;
