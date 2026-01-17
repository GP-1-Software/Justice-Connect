import { Plus, FileText, MessageSquare, Calendar, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CaseQuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'قضية جديدة',
      description: 'إنشاء طلب قضية جديدة',
      icon: Plus,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700',
      onClick: () => {
        toast.success('يرجى اختيار محامي والحجز من خلاله لإنشاء قضية جديدة', {
          duration: 4000,
          position: 'top-center',
          icon: '⚖️',
        });
        navigate('/client/search-lawyers');
      }
    },
    {
      title: 'المستندات',
      description: 'عرض جميع المستندات',
      icon: FileText,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:from-purple-600 dark:to-purple-700',
      onClick: () => navigate('/client/documents')
    },
    {
      title: 'الرسائل',
      description: 'تواصل مع محاميك',
      icon: MessageSquare,
      color: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700',
      onClick: () => navigate('/client/messages')
    },
    {
      title: 'المواعيد',
      description: 'إدارة المواعيد والجلسات',
      icon: Calendar,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-700',
      onClick: () => navigate('/client/appointments')
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={index}
            onClick={action.onClick}
            className={`${action.color} text-white rounded-lg sm:rounded-xl lg:rounded-2xl p-2.5 sm:p-3 lg:p-4 xl:p-5 text-right transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 shadow-md sm:shadow-lg hover:shadow-xl`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold mb-0.5 sm:mb-1 truncate">{action.title}</h3>
                <p className="text-[10px] sm:text-xs lg:text-sm text-white/90 line-clamp-1 sm:line-clamp-2">{action.description}</p>
              </div>
              <div className="bg-white/20 p-1 sm:p-1.5 lg:p-2 rounded-md sm:rounded-lg backdrop-blur-sm flex-shrink-0 ml-1 sm:ml-2">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CaseQuickActions;
