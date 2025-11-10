import { ArrowRight, Scale, Calendar, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CaseDetailsHeader = ({ caseData }) => {
  const navigate = useNavigate();

  const getStatusConfig = (status) => {
    const configs = {
      'pending': {
        label: 'قيد المراجعة',
        icon: Clock,
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
      },
      'active': {
        label: 'نشطة',
        icon: CheckCircle2,
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
      },
      'closed': {
        label: 'مغلقة',
        icon: CheckCircle2,
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
      },
      'rejected': {
        label: 'مرفوضة',
        icon: XCircle,
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
      }
    };
    return configs[status] || configs['pending'];
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      'low': {
        label: 'منخفضة',
        color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      },
      'medium': {
        label: 'متوسطة',
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      },
      'high': {
        label: 'عالية',
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      },
      'urgent': {
        label: 'عاجلة',
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      }
    };
    return configs[priority] || configs['medium'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const status = getStatusConfig(caseData?.status);
  const priority = getPriorityConfig(caseData?.priority);
  const StatusIcon = status.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-4 sm:px-5 lg:px-6 py-4 sm:py-5">
        <button
          onClick={() => navigate('/client/cases')}
          className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors mb-4 group"
        >
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          <span className="text-sm sm:text-base font-medium">العودة للقضايا</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0" />
          <span className="text-xs sm:text-sm text-blue-100">
            #{caseData?.case_number || caseData?.case_id}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3">
          {caseData?.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {status.label}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${priority.color}`}>
            {priority.label}
          </span>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">تاريخ الإنشاء</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
              {formatDate(caseData?.created_at)}
            </p>
          </div>
        </div>

        {caseData?.next_hearing_date && (
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">الجلسة القادمة</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                {formatDate(caseData?.next_hearing_date)}
              </p>
            </div>
          </div>
        )}

        {caseData?.filing_date && (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">تاريخ التقديم</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                {formatDate(caseData?.filing_date)}
              </p>
            </div>
          </div>
        )}

        {caseData?.court_name && (
          <div className="flex items-start gap-2 col-span-2 sm:col-span-1">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">المحكمة</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                {caseData?.court_name}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseDetailsHeader;
