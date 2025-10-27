import React from 'react';
import { Filter } from 'lucide-react';

const CaseFilters = ({ statusFilter, onStatusChange }) => {
  const statuses = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'active', label: 'نشط' },
    { value: 'in_progress', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'closed', label: 'مغلق' }
  ];

  return (
    <div className="flex items-center gap-2">
      <Filter className="h-5 w-5 text-gray-400" />
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        {statuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CaseFilters;
