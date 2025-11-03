import React from 'react';

const StatsCard = ({ icon: Icon, label, value, iconBgColor, iconColor, loading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow p-4 sm:p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {loading ? '...' : value}
          </p>
        </div>
        <div className={`${iconBgColor} p-3 sm:p-4 rounded-lg sm:rounded-xl`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
