import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  MessageSquare,
  FileText,
  Bot,
  BookOpen
} from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Search,
      labelAr: 'البحث عن محامين',
      labelEn: 'Search Lawyers',
      bgColor: 'from-green-500 to-green-600',
      onClick: () => navigate('/client/search-lawyers')
    },
    {
      icon: Calendar,
      labelAr: 'مواعيدي',
      labelEn: 'My Appointments',
      bgColor: 'from-purple-500 to-purple-600',
      onClick: () => navigate('/client/appointments')
    },
    {
      icon: FileText,
      labelAr: 'قضاياي',
      labelEn: 'My Cases',
      bgColor: 'from-indigo-500 to-indigo-600',
      onClick: () => navigate('/client/cases')
    },
    {
      icon: MessageSquare,
      labelAr: 'الرسائل',
      labelEn: 'Messages',
      bgColor: 'from-orange-500 to-orange-600',
      onClick: () => navigate('/client/messages')
    },
    {
      icon: Bot,
      labelAr: 'المساعد الذكي',
      labelEn: 'AI Assistant',
      bgColor: 'from-cyan-500 to-cyan-600',
      onClick: () => navigate('/client/justice-ai')
    },
    {
      icon: BookOpen,
      labelAr: 'التشريعات',
      labelEn: 'Legislations',
      bgColor: 'from-green-500 to-emerald-600',
      onClick: () => navigate('/legislation', { state: { from: 'client-dashboard' } })
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6">
      <div className="mb-3 sm:mb-6">
        <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
          الإجراءات السريعة
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          الوصول السريع إلى الخدمات الأكثر استخداماً
        </p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const colorClasses = getColorClasses(action.color);
          
          return (
            <button
              key={index}
              onClick={() => navigate(action.path, action.path === '/legislation' ? { state: { from: 'client-dashboard' } } : {})}
              className={`group relative p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r ${colorClasses} text-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-right touch-manipulation ${action.highlight ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
            >
              {/* Badge */}
              {action.badge && (
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-400 text-yellow-900 text-[8px] sm:text-xs font-bold px-1 sm:px-2 py-0.5 rounded-full">
                  {action.badge}
                </div>
              )}
              
              <div className="flex items-start justify-between mb-1.5 sm:mb-3">
                <div className="p-1 sm:p-2 bg-white/20 rounded-lg">
                  <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                
                {action.highlight && (
                  <div className="text-[8px] sm:text-xs bg-white/20 px-1 sm:px-2 py-0.5 rounded-full hidden sm:block">
                    مميز
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-xs sm:text-base font-semibold mb-0.5 sm:mb-1 group-hover:text-white transition leading-tight">
                  {action.title}
                </h3>
                <p className="text-[10px] sm:text-sm text-white/80 group-hover:text-white transition hidden sm:block">
                  {action.description}
                </p>
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          );
        })}
      </div>
      
      {/* Additional Info */}
      <div className="mt-3 sm:mt-6 p-2.5 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
              تحتاج مساعدة قانونية فورية؟
            </p>
            <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 hidden sm:block">
              استخدم مساعد Justice AI للحصول على إجابات فورية
            </p>
          </div>
          <button
            onClick={() => navigate('/client/justice-ai')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition touch-manipulation"
          >
            <action.icon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-center">
              {action.labelAr}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;




