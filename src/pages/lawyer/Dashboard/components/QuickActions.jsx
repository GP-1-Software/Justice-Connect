import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Users,
  MessageSquare,
  Briefcase,
  Upload,
  UserPlus,
  Settings,
  BookOpen
} from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: FileText,
      labelAr: 'إضافة قضية جديدة',
      labelEn: 'Add New Case',
      bgColor: 'from-purple-500 to-purple-600',
      onClick: () => navigate('/lawyer/cases?action=new')
    },
    {
      icon: Calendar,
      labelAr: 'البحث عن مواعيد',
      labelEn: 'Search Appointments',
      bgColor: 'from-green-500 to-green-600',
      onClick: () => navigate('/lawyer/calendar')
    },
    {
      icon: Briefcase,
      labelAr: 'إدارة الاستشارات',
      labelEn: 'Manage Consultations',
      bgColor: 'from-blue-500 to-cyan-500',
      onClick: () => navigate('/lawyer/cases')
    },

    {
      icon: UserPlus,
      labelAr: 'إضافة استشارات',
      labelEn: 'Add Consultations',
      bgColor: 'from-purple-500 to-pink-500',
      onClick: () => navigate('/lawyer/profile?tab=services')
    },
    {
      icon: MessageSquare,
      labelAr: 'الرسائل',
      labelEn: 'Messages',
      bgColor: 'from-orange-500 to-orange-600',
      onClick: () => navigate('/lawyer/messages')
    },
    {
      icon: BookOpen,
      labelAr: 'التشريعات',
      labelEn: 'Legislations',
      bgColor: 'from-green-500 to-emerald-600',
      onClick: () => navigate('/legislation', { state: { from: 'lawyer-dashboard' } })
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          الإجراءات السريعة
        </h3>
        <span className="text-xs text-gray-400">
          اختصارات للوصول السريع
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`bg-gradient-to-br ${action.bgColor} p-3 sm:p-4 rounded-lg sm:rounded-xl text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
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
