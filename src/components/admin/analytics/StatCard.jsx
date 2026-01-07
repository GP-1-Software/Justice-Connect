// src/components/admin/analytics/StatCard.jsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  trendValue,
  subtitle,
  loading = false
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      border: 'border-purple-200 dark:border-purple-800',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      border: 'border-orange-200 dark:border-orange-800',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  if (loading) {
    return (
      <div className={`${colors.bg} border ${colors.border} rounded-2xl p-6 animate-pulse`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          </div>
          <div className={`p-3 ${colors.iconBg} rounded-xl`}>
            <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105`}>
      {/* Mobile: Vertical Layout, Desktop: Horizontal */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        {/* Icon - Top on mobile, Right on desktop */}
        <div className={`p-2 sm:p-3 ${colors.iconBg} rounded-lg sm:rounded-xl self-start sm:order-2 flex-shrink-0`}>
          <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${colors.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 sm:order-1">
          <p className="text-[10px] sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">
            {title}
          </p>
          <h3 className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            {value?.toLocaleString('ar-EG') || '0'}
          </h3>

          {subtitle && (
            <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}

          {trend && (
            <div className="flex items-center space-x-1 space-x-reverse mt-1 sm:mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-[10px] sm:text-xs font-semibold ${trend === 'up'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
                }`}>
                {trendValue}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                من الشهر الماضي
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
