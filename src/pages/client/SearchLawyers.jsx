import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Grid, List, Loader, AlertCircle } from 'lucide-react';
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
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
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
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('searchLawyers.title')}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('searchLawyers.subtitle')}
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:w-80 flex-shrink-0">
              <div className="sticky top-6">
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
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                {loading ? (
                  t('searchLawyers.searching')
                ) : (
                  <>
                    {t('searchLawyers.found')} <span className="font-semibold text-gray-900 dark:text-white">{filteredLawyers.length}</span> {t('searchLawyers.lawyers')}
                  </>
                )}
              </p>
            </div>

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
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('searchLawyers.noResults')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('searchLawyers.noResultsDesc')}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {currentLawyers.map((lawyer) => (
                    <LawyerCard key={lawyer.lawyer_id} lawyer={lawyer} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t('searchLawyers.previous')}
                    </button>
                    
                    <div className="flex gap-2">
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handlePageChange(index + 1)}
                          className={`w-10 h-10 rounded-lg transition-colors ${
                            currentPage === index + 1
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t('searchLawyers.next')}
                    </button>
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
