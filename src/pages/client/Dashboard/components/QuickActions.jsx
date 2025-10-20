import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  FileText,
  Calendar,
  Bot,
  FileCheck,
  CreditCard
} from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'إنشاء قضية جديدة',
      description: 'ابدأ قضية جديدة مع محاميك',
      icon: Plus,
      color: 'blue',
      path: '/client/create-case',
      highlight: true
    },
    {
      title: 'البحث عن محامين',
      description: 'ابحث عن محامي متخصص',
      icon: Search,
      color: 'green',
      path: '/client/search-lawyers'
    },
    {
      title: 'حجز موعد',
      description: 'احجز استشارة مع محامي',
      icon: Calendar,
      color: 'purple',
      path: '/client/search-lawyers',
      badge: 'سريع'
    },
    {
      title: 'الرسائل',
      description: 'تواصل مع محاميك',
      icon: MessageSquare,
      color: 'orange',
      path: '/client/messages'
    },
    {
      title: 'المساعد الذكي',
      description: 'احصل على استشارة فورية',
      icon: Bot,
      color: 'cyan',
      path: '/client/ai-chatbot',
      badge: 'جديد'
    },
    {
      title: 'تحليل المستندات',
      description: 'حلل عقودك ومستنداتك',
      icon: FileCheck,
      color: 'indigo',
      path: '/client/document-analyzer'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      cyan: 'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          الإجراءات السريعة
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          الوصول السريع إلى الخدمات الأكثر استخداماً
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const colorClasses = getColorClasses(action.color);
          
          return (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className={`group relative p-4 rounded-xl bg-gradient-to-r ${colorClasses} text-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-right ${
                action.highlight ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
              }`}
            >
              {/* Badge */}
              {action.badge && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  {action.badge}
                </div>
              )}
              
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Icon className="h-6 w-6" />
                </div>
                
                {action.highlight && (
                  <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    مميز
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold mb-1 group-hover:text-white transition">
                  {action.title}
                </h3>
                <p className="text-sm text-white/80 group-hover:text-white transition">
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
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
        <div className="flex items-center space-x-3 space-x-reverse">
          <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              تحتاج مساعدة سريعة؟
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              استخدم المساعد الذكي للحصول على إجابات فورية
            </p>
          </div>
          <button
            onClick={() => navigate('/client/ai-chatbot')}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-full transition"
          >
            ابدأ الآن
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;




