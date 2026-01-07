import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Grid, List, Loader, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchLawyers, getSpecializations, getCities } from '../../services/lawyerApi';
import SearchFilters from '../../components/client/SearchFilters';
import LawyerCard from '../../components/client/LawyerCard';

const SearchLawyers = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // State
  const [lawyers, setLawyers] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Show filters by default on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowFilters(true);
        setShowMobileFilters(false);
      } else {
        setShowFilters(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter options
  const [specializations, setSpecializations] = useState([]);
  const [cities, setCities] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    searchTerm: '',
    specialization: 'all',
    city: 'all',
    minExperience: '',
    maxExperience: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Search when filters change
  useEffect(() => {
    if (!loading) {
      performSearch();
    }
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load specializations and cities
      const [specsData, citiesData] = await Promise.all([
        getSpecializations(),
        getCities()
      ]);

      setSpecializations(specsData);
      setCities(citiesData);

      // Initial search with no filters
      await performSearch();
    } catch (err) {
      console.error('Error loading data:', err);
      setError(t('searchLawyers.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setError(null);
      const results = await searchLawyers(filters);
      setLawyers(results);
      setFilteredLawyers(results);
      setCurrentPage(1); // Reset to first page
    } catch (err) {
      console.error('Error searching lawyers:', err);
      setError(t('searchLawyers.errorSearching'));
      setLawyers([]);
      setFilteredLawyers([]);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      specialization: 'all',
      city: 'all',
      minExperience: '',
      maxExperience: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest'
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredLawyers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLawyers = filteredLawyers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {t('searchLawyers.title')}
                </h1>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 line-clamp-1">
                  {t('searchLawyers.subtitle')}
                </p>
              </div>

              {/* Desktop View Toggle */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${showFilters
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 shadow-sm'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  title="Toggle filters"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 shadow-sm'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  title="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 shadow-sm'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  title="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Controls Row */}
            <div className="flex sm:hidden items-center justify-between gap-2">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm shadow-sm active:scale-[0.98] transition-transform"
              >
                <Filter className="w-4 h-4" />
                <span>الفلاتر</span>
              </button>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Popup */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          {/* Popup Modal */}
          <div className="relative w-full max-w-md max-h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-popup-in">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">الفلاتر</h2>
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-56px)]">
              <SearchFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                specializations={specializations}
                cities={cities}
                onReset={handleResetFilters}
                isMobile={true}
                onClose={() => setShowMobileFilters(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
        {/* Results Count - Above both columns */}
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                {t('searchLawyers.searching')}
              </span>
            ) : (
              <>
                {t('searchLawyers.found')} <span className="font-semibold text-gray-900 dark:text-white">{filteredLawyers.length}</span> {t('searchLawyers.lawyers')}
              </>
            )}
          </p>
          {/* Active filters count on mobile */}
          {!loading && Object.values(filters).some(v => v && v !== 'all' && v !== 'newest') && (
            <button
              onClick={handleResetFilters}
              className="sm:hidden text-xs text-blue-600 dark:text-blue-400 font-medium"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
          {/* Filters Sidebar - Desktop only */}
          {showFilters && (
            <div className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <SearchFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  specializations={specializations}
                  cities={cities}
                  onReset={handleResetFilters}
                />
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredLawyers.length === 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('searchLawyers.noResults')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                  {t('searchLawyers.noResultsDesc')}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base active:scale-[0.98]"
                >
                  {t('searchLawyers.resetFilters')}
                </button>
              </div>
            )}

            {/* Lawyers Grid/List */}
            {!loading && !error && currentLawyers.length > 0 && (
              <>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6'
                    : 'space-y-3'
                }>
                  {currentLawyers.map((lawyer) => (
                    <LawyerCard key={lawyer.lawyer_id} lawyer={lawyer} viewMode={viewMode} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 sm:mt-8">
                    {/* Mobile Pagination */}
                    <div className="flex sm:hidden items-center justify-between gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center justify-center gap-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-sm"
                      >
                        {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        <span className="text-sm font-medium">السابق</span>
                      </button>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span>
                        <span>/</span>
                        <span>{totalPages}</span>
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center justify-center gap-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-sm"
                      >
                        <span className="text-sm font-medium">التالي</span>
                        {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Desktop Pagination */}
                    <div className="hidden sm:flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('searchLawyers.previous')}
                      </button>

                      <div className="flex gap-1">
                        {/* Show first page */}
                        {currentPage > 3 && (
                          <>
                            <button
                              onClick={() => handlePageChange(1)}
                              className="w-10 h-10 text-sm rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              1
                            </button>
                            {currentPage > 4 && <span className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>}
                          </>
                        )}
                        
                        {/* Show pages around current */}
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1;
                          if (page >= currentPage - 2 && page <= currentPage + 2) {
                            return (
                              <button
                                key={index}
                                onClick={() => handlePageChange(page)}
                                className={`w-10 h-10 text-sm rounded-xl transition-colors ${currentPage === page
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                              >
                                {page}
                              </button>
                            );
                          }
                          return null;
                        })}

                        {/* Show last page */}
                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && <span className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>}
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className="w-10 h-10 text-sm rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('searchLawyers.next')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchLawyers;
