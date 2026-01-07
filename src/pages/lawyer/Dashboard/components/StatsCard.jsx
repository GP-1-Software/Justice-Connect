import React from 'react';

const StatsCard = ({ icon: Icon, label, value, iconBgColor, iconColor, loading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow p-2.5 sm:p-5 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex-1 min-w-0 w-full">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">{label}</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {loading ? '...' : value}
          </p>
        </div>
        <div className={`${iconBgColor} p-2 sm:p-4 rounded-lg sm:rounded-xl self-end sm:self-auto`}>
          <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
