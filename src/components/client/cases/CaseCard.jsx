import { 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Scale,
  ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CaseCard = ({ caseData }) => {
  const navigate = useNavigate();

  // Status configurations
  const statusConfig = {
    pending: {
      label: 'قيد المراجعة',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock
    },
    active: {
      label: 'نشطة',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: CheckCircle
    },
    closed: {
      label: 'مغلقة',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle
    },
    rejected: {
      label: 'مرفوضة',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle
    }
  };

  // Priority configurations
  const priorityConfig = {
    low: {
      label: 'عادية',
      color: 'bg-gray-100 text-gray-700'
    },
    medium: {
      label: 'متوسطة',
      color: 'bg-blue-100 text-blue-700'
    },
    high: {
      label: 'عاجلة',
      color: 'bg-orange-100 text-orange-700'
    },
    urgent: {
      label: 'حرجة',
      color: 'bg-red-100 text-red-700'
    }
  };

  // Case type translations
  const caseTypeLabels = {
    criminal: 'جنائي',
    civil: 'مدني',
    commercial: 'تجاري',
    family: 'أحوال شخصية',
    labor: 'عمالي',
    administrative: 'إداري'
  };

  const status = statusConfig[caseData.status] || statusConfig.pending;
  const priority = priorityConfig[caseData.priority] || priorityConfig.low;
  const StatusIcon = status.icon;

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

  const handleViewDetails = () => {
    navigate(`/client/cases/${caseData.case_id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02] sm:hover:scale-105">
      {/* Header */}
      <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                #{caseData.case_number || caseData.case_id}
              </span>
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2 line-clamp-2">
              {caseData.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 hidden sm:block">
              {caseData.description}
            </p>
          </div>
        </div>

        {/* Status and Priority Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-2 sm:mt-3">
          <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${status.color}`}>
            <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {status.label}
          </span>
          <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${priority.color}`}>
            {priority.label}
          </span>
          <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hidden sm:inline-flex">
            {caseTypeLabels[caseData.case_type] || caseData.case_type}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 lg:p-6 space-y-2.5 sm:space-y-3 lg:space-y-4">
        {/* Lawyer Info */}
        {caseData.lawyer && (
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg border border-blue-100 dark:border-gray-600">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              {caseData.lawyer.profile_image_url ? (
                <img
                  src={caseData.lawyer.profile_image_url}
                  alt={`${caseData.lawyer.first_name} ${caseData.lawyer.last_name}`}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">المحامي المسؤول</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                {caseData.lawyer.first_name} {caseData.lawyer.last_name}
              </p>
            </div>
          </div>
        )}

        {/* Case Details */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
          <div className="flex items-start gap-1.5 sm:gap-2">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">تاريخ الإنشاء</p>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                {formatDate(caseData.created_at)}
              </p>
            </div>
          </div>

          {caseData.next_hearing_date && (
            <div className="flex items-start gap-1.5 sm:gap-2">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">الجلسة القادمة</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                  {formatDate(caseData.next_hearing_date)}
                </p>
              </div>
            </div>
          )}

          {caseData.court_name && (
            <div className="flex items-start gap-1.5 sm:gap-2 col-span-2">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">المحكمة</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                  {caseData.court_name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tasks Progress (if available) - Hidden on mobile */}
        {caseData.tasks_count !== undefined && (
          <div className="pt-2.5 sm:pt-3 lg:pt-4 border-t border-gray-100 dark:border-gray-700 hidden sm:block">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">تقدم المهام</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {caseData.completed_tasks || 0} / {caseData.tasks_count}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${caseData.tasks_count > 0 ? ((caseData.completed_tasks || 0) / caseData.tasks_count) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-700/50 dark:to-gray-700/30 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={handleViewDetails}
          className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-[1.02] sm:hover:scale-105 font-semibold shadow-lg text-sm sm:text-base"
        >
          <span>عرض التفاصيل</span>
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};

export default CaseCard;
