import React from 'react';
import { 
  FileText, 
  User, 
  Briefcase, 
  Calendar, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Pause
} from 'lucide-react';

const CaseCard = ({ caseData, onClick }) => {
  // Status colors and icons
  const statusConfig = {
    pending: {
      color: 'yellow',
      icon: Clock,
      label: 'معلقة',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
    },
    active: {
      color: 'blue',
      icon: CheckCircle,
      label: 'نشطة',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
    },
    in_progress: {
      color: 'purple',
      icon: Clock,
      label: 'قيد المعالجة',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-400',
      badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
    },
    completed: {
      color: 'green',
      icon: CheckCircle,
      label: 'مكتملة',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    },
    closed: {
      color: 'gray',
      icon: Pause,
      label: 'مغلقة',
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      text: 'text-gray-700 dark:text-gray-400',
      badge: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
    },
    rejected: {
      color: 'red',
      icon: XCircle,
      label: 'مرفوضة',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    }
  };

  // Priority colors
  const priorityConfig = {
    high: {
      label: 'عالية',
      badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    },
    medium: {
      label: 'متوسطة',
      badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
    },
    low: {
      label: 'منخفضة',
      badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    }
  };

  const status = statusConfig[caseData.status] || statusConfig.pending;
  const priority = priorityConfig[caseData.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;

  return (
    <div
      onClick={onClick}
      className={`${status.bg} border ${status.border} rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 space-x-reverse flex-1 min-w-0">
          <div className={`p-2 sm:p-3 ${status.badge} rounded-lg flex-shrink-0`}>
            <FileText className={`h-5 w-5 sm:h-6 sm:w-6 ${status.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
              {caseData.title}
            </h3>
            {caseData.case_number && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                رقم القضية: {caseData.case_number}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2 flex-shrink-0 mr-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${status.badge} flex items-center space-x-1 space-x-reverse`}>
            <StatusIcon className="h-3 w-3" />
            <span>{status.label}</span>
          </span>
          {caseData.priority && (
            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${priority.badge}`}>
              {priority.label}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {caseData.description && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
          {caseData.description}
        </p>
      )}

      {/* Case Type */}
      {caseData.case_type && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
            {caseData.case_type}
          </span>
        </div>
      )}

      {/* Client and Lawyer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Client */}
        {caseData.client && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">العميل</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {caseData.client.first_name} {caseData.client.last_name}
              </p>
            </div>
          </div>
        )}

        {/* Lawyer */}
        {caseData.lawyer ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
              <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">المحامي</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {caseData.lawyer.first_name} {caseData.lawyer.last_name}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">المحامي</p>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                لم يتم التعيين
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Dates */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-600 dark:text-gray-400">
          <Calendar className="h-3 w-3" />
          <span>تاريخ الإنشاء:</span>
          <span className="font-medium">
            {new Date(caseData.created_at).toLocaleDateString('en-GB')}
          </span>
        </div>
        
        {caseData.next_hearing_date && (
          <div className="flex items-center space-x-1 space-x-reverse text-xs text-orange-600 dark:text-orange-400">
            <Calendar className="h-3 w-3" />
            <span>الجلسة القادمة:</span>
            <span className="font-medium">
              {new Date(caseData.next_hearing_date).toLocaleDateString('en-GB')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseCard;
