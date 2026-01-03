import React from 'react';
import { 
  Calendar, 
  MessageSquare, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';
import { formatTimeAgo } from '../../../../utils/dateUtils';

const RecentActivity = ({ activities, loading }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'appointment':
        return Calendar;
      case 'message':
        return MessageSquare;
      case 'case_update':
        return FileText;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type, status) => {
    if (type === 'appointment') {
      switch (status) {
        case 'pending':
          return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
        case 'completed':
          return 'text-green-600 bg-green-50 dark:bg-green-900/20';
        case 'cancelled':
          return 'text-red-600 bg-red-50 dark:bg-red-900/20';
        default:
          return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      }
    }
    
    switch (type) {
      case 'message':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
      case 'case_update':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };


  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            النشاط الأخير
          </h2>
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start space-x-4 space-x-reverse animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            النشاط الأخير
          </h2>
        </div>
        
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            لا يوجد نشاط حديث
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          النشاط الأخير
        </h2>
 
      </div>
      
      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const colorClasses = getActivityColor(activity.type, activity.status);
          
          return (
            <div key={activity.id || index} className="flex items-start space-x-4 space-x-reverse group">
              <div className={`p-2 rounded-lg ${colorClasses}`}>
                <Icon className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {activity.title}
                    </h4>
                    
                    {activity.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    
                    {activity.caseTitle && (
                      <span className="inline-block mt-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                        {activity.caseTitle}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                    
                    {activity.status && (
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'pending' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          activity.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          activity.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {activity.status === 'pending' ? 'قيد الانتظار' :
                           activity.status === 'completed' ? 'مكتمل' :
                           activity.status === 'cancelled' ? 'ملغي' :
                           activity.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
