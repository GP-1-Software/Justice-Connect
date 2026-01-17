import React from 'react';
import { Filter, ChevronDown } from 'lucide-react';

const CaseFilters = ({ statusFilter, onStatusChange }) => {
  const statuses = [
    { 
      value: 'all', 
      label: 'الكل', 
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
    //  icon: '📋'
    },
    { 
      value: 'pending', 
      label: 'قيد المراجعة', 
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    //  icon: '⏳'
    },
    { 
      value: 'active', 
      label: 'نشطة', 
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    //  icon: '✅'
    },
    { 
      value: 'in_progress', 
      label: 'قيد التنفيذ', 
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
     // icon: '⚡'
    },
    { 
      value: 'completed', 
      label: 'مكتملة', 
      color: 'text-gray-700 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
    //  icon: '✔️'
    },
    { 
      value: 'closed', 
      label: 'مغلقة', 
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    //  icon: '🔒'
    },
    { 
      value: 'rejected', 
      label: 'مرفوضة', 
      color: 'text-gray-600 dark:text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
  //    icon: '❌'
    }
  ];

  const currentStatus = statuses.find(s => s.value === statusFilter) || statuses[0];

  return (
    <div className="relative group">
      <div className={`flex items-center gap-3 px-5 py-3 ${currentStatus.bgColor} border-2 border-transparent hover:border-current/30 rounded-xl hover:shadow-lg transition-all duration-200 cursor-pointer`}>
        <span className="text-lg">{currentStatus.icon}</span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`appearance-none bg-transparent focus:outline-none font-bold cursor-pointer pr-6 ${currentStatus.color} text-sm`}
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value} className="bg-white dark:bg-gray-800">
              {status.icon} {status.label}
            </option>
          ))}
        </select>
        <ChevronDown className={`h-4 w-4 ${currentStatus.color} absolute left-3 pointer-events-none group-hover:translate-y-0.5 transition-transform`} />
      </div>
    </div>
  );
};

export default CaseFilters;
