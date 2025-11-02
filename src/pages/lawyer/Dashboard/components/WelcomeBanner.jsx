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
    <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl shadow-lg p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-2xl font-bold">{getGreeting()}, {lawyerName}</h2>
          </div>
          <p className="text-blue-100">
            مرحباً بك في لوحة المحامي. إليك نظرة عامة على أنشطتك اليوم.
          </p>
        </div>
        <div className="hidden md:block">
          <div className="text-right">
            <p className="text-sm text-blue-100">اليوم</p>
            <p className="text-lg font-semibold">
              {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
