import React from 'react';
import { 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const StatsCards = ({ summary, loading }) => {
  const stats = [
    {
      title: 'القضايا النشطة',
      value: summary?.activeCases || 0,
      icon: Briefcase,
      color: 'blue',
      trend: '+2 هذا الأسبوع',
      description: 'قضايا قيد المتابعة'
    },
    {
      title: 'المواعيد القادمة',
      value: summary?.upcomingAppointments || 0,
      icon: Calendar,
      color: 'green',
      trend: '3 مواعيد هذا الأسبوع',
      description: 'مواعيد مجدولة'
    },
    {
      title: 'الرسائل غير المقروءة',
      value: summary?.unreadMessages || 0,
      icon: MessageSquare,
      color: 'purple',
      trend: '2 رسائل جديدة',
      description: 'رسائل تحتاج مراجعة'
    },
    {
      title: 'الرصيد المتاح',
      value: `${summary?.balance || 0} ريال`,
      icon: CreditCard,
      color: 'orange',
      trend: 'دفعة جديدة +500 ريال',
      description: 'رصيد الحساب'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      green: 'from-green-500 to-green-600 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      purple: 'from-purple-500 to-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      orange: 'from-orange-500 to-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colorClasses = getColorClasses(stat.color);
        
        return (
          <div 
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.trend}
              </span>
            </div>
            
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.description}
              </p>
            </div>
            
            <div className="flex items-center text-sm">
              <span className="font-semibold text-gray-900 dark:text-white">
                {stat.title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;



