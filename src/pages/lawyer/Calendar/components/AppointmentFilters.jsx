import React from 'react';
import { Filter } from 'lucide-react';

const AppointmentFilters = ({ statusFilter, onStatusChange }) => {
  const statuses = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'confirmed', label: 'مؤكد' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
            تصفية:
          </span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-base"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AppointmentFilters;
