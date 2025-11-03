import React from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { Sparkles } from 'lucide-react';

const WelcomeBanner = () => {
  const { lawyer } = useLawyerAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  const lawyerName = lawyer?.first_name 
    ? `${lawyer.first_name} ${lawyer.last_name || ''}`.trim() 
    : lawyer?.email || 'محامي';

  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">{getGreeting()}, {lawyerName}</h2>
          </div>
          <p className="text-sm sm:text-base text-blue-100">
            مرحباً بك في لوحة المحامي. إليك نظرة عامة على أنشطتك اليوم.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <div className="text-right">
            <p className="text-xs sm:text-sm text-blue-100">اليوم</p>
            <p className="text-sm sm:text-base lg:text-lg font-semibold">
              {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
