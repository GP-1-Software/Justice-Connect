import React from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X, Search, MapPin, Briefcase, Coins, SortAsc } from 'lucide-react';

const SearchFilters = ({
  filters,
  onFilterChange,
  specializations,
  cities,
  onReset
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const handleInputChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white">الفلاتر</h3>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
            مسح الكل
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Search Term */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Search className="w-4 h-4 text-blue-500" />
            البحث بالاسم
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.searchTerm || ''}
              onChange={(e) => handleInputChange('searchTerm', e.target.value)}
              placeholder="ابحث عن محامي..."
              className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all ${isRTL ? 'text-right' : ''}`}
            />
          </div>
        </div>

        {/* Specialization */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Briefcase className="w-4 h-4 text-green-500" />
            التخصص
          </label>
          <select
            value={filters.specialization || 'all'}
            onChange={(e) => handleInputChange('specialization', e.target.value)}
            className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none bg-white cursor-pointer transition-all ${isRTL ? 'text-right' : ''}`}
          >
            <option value="all">جميع التخصصات</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="w-4 h-4 text-red-500" />
            المدينة
          </label>
          <select
            value={filters.city || 'all'}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none bg-white cursor-pointer transition-all ${isRTL ? 'text-right' : ''}`}
          >
            <option value="all">جميع المدن</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Years of Experience */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Briefcase className="w-4 h-4 text-purple-500" />
            سنوات الخبرة
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              value={filters.minExperience || ''}
              onChange={(e) => handleInputChange('minExperience', e.target.value ? parseInt(e.target.value) : '')}
              placeholder="الحد الأدنى"
              className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all ${isRTL ? 'text-right' : ''}`}
            />
            <input
              type="number"
              min="0"
              value={filters.maxExperience || ''}
              onChange={(e) => handleInputChange('maxExperience', e.target.value ? parseInt(e.target.value) : '')}
              placeholder="الحد الأقصى"
              className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all ${isRTL ? 'text-right' : ''}`}
            />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            نطاق السعر
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              value={filters.minPrice || ''}
              onChange={(e) => handleInputChange('minPrice', e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="السعر الأدنى"
              className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all ${isRTL ? 'text-right' : ''}`}
            />
            <input
              type="number"
              min="0"
              value={filters.maxPrice || ''}
              onChange={(e) => handleInputChange('maxPrice', e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="السعر الأعلى"
              className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all ${isRTL ? 'text-right' : ''}`}
            />
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <SortAsc className="w-4 h-4 text-indigo-500" />
            الترتيب
          </label>
          <select
            value={filters.sortBy || 'newest'}
            onChange={(e) => handleInputChange('sortBy', e.target.value)}
            className={`w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none bg-white cursor-pointer transition-all ${isRTL ? 'text-right' : ''}`}
          >
            <option value="newest">الأحدث</option>
            <option value="experience_desc">الأكثر خبرة</option>
            <option value="experience_asc">الأقل خبرة</option>
            <option value="price_asc">السعر: من الأقل للأعلى</option>
            <option value="price_desc">السعر: من الأعلى للأقل</option>
            <option value="name_asc">الاسم: أ - ي</option>
            <option value="name_desc">الاسم: ي - أ</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
