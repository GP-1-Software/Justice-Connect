import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';

const CaseFilters = ({ onFilterChange, onSearchChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    caseType: 'all',
    priority: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'pending', label: 'قيد المراجعة' },
    { value: 'active', label: 'نشطة' },
    { value: 'closed', label: 'مغلقة' },
    { value: 'rejected', label: 'مرفوضة' }
  ];

  const caseTypeOptions = [
    { value: 'all', label: 'جميع الأنواع' },
    { value: 'criminal', label: 'جنائي' },
    { value: 'civil', label: 'مدني' },
    { value: 'commercial', label: 'تجاري' },
    { value: 'family', label: 'أحوال شخصية' },
    { value: 'labor', label: 'عمالي' },
    { value: 'administrative', label: 'إداري' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'جميع الأولويات' },
    { value: 'low', label: 'عادية' },
    { value: 'medium', label: 'متوسطة' },
    { value: 'high', label: 'عاجلة' },
    { value: 'urgent', label: 'حرجة' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange(value);
  };

  const clearFilters = () => {
    const defaultFilters = {
      status: 'all',
      caseType: 'all',
      priority: 'all'
    };
    setFilters(defaultFilters);
    setSearchQuery('');
    onFilterChange(defaultFilters);
    onSearchChange('');
  };

  const hasActiveFilters = filters.status !== 'all' || filters.caseType !== 'all' || filters.priority !== 'all' || searchQuery;

  return (
    <>
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6 border border-gray-100 dark:border-gray-700">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="ابحث برقم القضية أو العنوان..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pr-8 sm:pr-10 pl-3 sm:pl-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base rounded-lg border transition-all transform hover:scale-[1.02] sm:hover:scale-105 whitespace-nowrap ${
              showFilters
                ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-lg'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">فلترة</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all transform hover:scale-[1.02] sm:hover:scale-105 whitespace-nowrap"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">مسح</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Options - Desktop */}
      {showFilters && (
        <div className="mt-4 sm:mt-5 lg:mt-6 pt-4 sm:pt-5 lg:pt-6 border-t border-gray-100 dark:border-gray-700 hidden sm:grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              الحالة
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Case Type Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              نوع القضية
            </label>
            <select
              value={filters.caseType}
              onChange={(e) => handleFilterChange('caseType', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              {caseTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              الأولوية
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>

    {/* Bottom Sheet for Mobile Filters */}
    {showFilters && (
      <div className="fixed inset-0 z-50 sm:hidden">
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowFilters(false)}
        />
        
        {/* Bottom Sheet */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              خيارات الفلترة
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Filters */}
          <div className="p-4 space-y-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                الحالة
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Case Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                نوع القضية
              </label>
              <select
                value={filters.caseType}
                onChange={(e) => handleFilterChange('caseType', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500"
              >
                {caseTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                الأولوية
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Actions */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              مسح الكل
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
              تطبيق
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('style[data-filters]')) {
  style.setAttribute('data-filters', 'true');
  document.head.appendChild(style);
}

export default CaseFilters;
