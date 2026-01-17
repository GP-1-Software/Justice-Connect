import { Scale, FileText, Clock, CheckCircle2 } from 'lucide-react';

const CaseStats = ({ stats }) => {
  const statCards = [
    {
      title: 'القضايا النشطة',
      value: stats?.active || 0,
      icon: Scale,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-500'
    },
    {
      title: 'قيد المراجعة',
      value: stats?.pending || 0,
      icon: Clock,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      borderColor: 'border-yellow-500'
    },
    {
      title: 'القضايا المنجزة',
      value: stats?.completed || 0,
      icon: CheckCircle2,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-500'
    },
    {
      title: 'إجمالي القضايا',
      value: stats?.total || 0,
      icon: FileText,
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 xl:gap-5 mb-4 sm:mb-6 lg:mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-5 xl:p-6 border-r-4 ${stat.borderColor} hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] sm:hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">{stat.title}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl flex-shrink-0`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CaseStats;
