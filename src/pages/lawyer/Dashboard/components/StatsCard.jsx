import React from 'react';

const StatsCard = ({ icon: Icon, label, value, iconBgColor, iconColor, loading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {loading ? '...' : value}
          </p>
        </div>
        <div className={`${iconBgColor} p-4 rounded-xl`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
