import React from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X, Search } from 'lucide-react';

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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('searchLawyers.filters')}
          </h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <X className="w-4 h-4" />
          {t('searchLawyers.resetFilters')}
        </button>
      </div>

      <div className="space-y-4">
        {/* Search Term */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('searchLawyers.searchByName')}
          </label>
          <div className="relative">
            <Search className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} w-5 h-5 text-gray-400`} />
            <input
              type="text"
              value={filters.searchTerm || ''}
              onChange={(e) => handleInputChange('searchTerm', e.target.value)}
              placeholder={t('searchLawyers.searchPlaceholder')}
              className={`w-full ${isRTL ? 'pr-10 text-right' : 'pl-10'} py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
            />
          </div>
        </div>

        {/* Specialization */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('searchLawyers.specialization')}
          </label>
          <select
            value={filters.specialization || 'all'}
            onChange={(e) => handleInputChange('specialization', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : ''}`}
          >
            <option value="all">{t('searchLawyers.allSpecializations')}</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('searchLawyers.city')}
          </label>
          <select
            value={filters.city || 'all'}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : ''}`}
          >
            <option value="all">{t('searchLawyers.allCities')}</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Years of Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('searchLawyers.yearsOfExperience')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                min="0"
                value={filters.minExperience || ''}
                onChange={(e) => handleInputChange('minExperience', e.target.value ? parseInt(e.target.value) : '')}
                placeholder={t('searchLawyers.min')}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : ''}`}
              />
            </div>
            <div>
              <input
                type="number"
                min="0"
                value={filters.maxExperience || ''}
                onChange={(e) => handleInputChange('maxExperience', e.target.value ? parseInt(e.target.value) : '')}
                placeholder={t('searchLawyers.max')}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('searchLawyers.priceRange')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                min="0"
                value={filters.minPrice || ''}
                onChange={(e) => handleInputChange('minPrice', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder={t('searchLawyers.minPrice')}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : ''}`}
              />
            </div>
            <div>
              <input
                type="number"
                min="0"
                value={filters.maxPrice || ''}
                onChange={(e) => handleInputChange('maxPrice', e.target.value ? parseFloat(e.target.value) : '')}
                placeholder={t('searchLawyers.maxPrice')}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('searchLawyers.sortBy')}
          </label>
          <select
            value={filters.sortBy || 'newest'}
            onChange={(e) => handleInputChange('sortBy', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : ''}`}
          >
            <option value="newest">{t('searchLawyers.newest')}</option>
            <option value="experience_desc">{t('searchLawyers.mostExperienced')}</option>
            <option value="experience_asc">{t('searchLawyers.leastExperienced')}</option>
            <option value="price_asc">{t('searchLawyers.lowestPrice')}</option>
            <option value="price_desc">{t('searchLawyers.highestPrice')}</option>
            <option value="name_asc">{t('searchLawyers.nameAZ')}</option>
            <option value="name_desc">{t('searchLawyers.nameZA')}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
