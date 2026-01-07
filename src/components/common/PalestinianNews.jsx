import React, { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, Calendar, Tag, RefreshCw } from 'lucide-react';
import axios from 'axios';

const PalestinianNews = ({ limit = 6, showAll = false }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNews();
    
    // Auto-refresh every 30 minutes
    const interval = setInterval(() => {
      fetchNews();
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(interval);
  }, [limit]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${API_URL}/api/news?limit=${limit}`);
      
      if (response.data.success) {
        setNews(response.data.news || response.data.data || []);
      } else {
        setError('فشل في تحميل الأخبار');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('حدث خطأ في تحميل الأخبار');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              أخبار القضاء الفلسطيني
            </h2>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 py-8">
          <RefreshCw className="w-5 sm:w-6 h-5 sm:h-6 animate-spin text-blue-600" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">جاري تحميل الأخبار...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            أخبار القضاء الفلسطيني
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            أخبار القضاء الفلسطيني
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50"
        >
          <span>تحديث الأخبار</span>
          <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">{news.map((article) => {
          const isExpanded = expandedId === article.id;
          return (
          <div
            key={article.id}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 flex flex-col min-h-[160px] sm:min-h-[180px] border-2 border-gray-200 dark:border-gray-700"
          >
            {/* Category Badge */}
            {article.category && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                  <Tag className="w-3 h-3" />
                  {article.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 leading-snug">
              {article.title}
            </h3>

            {/* Date and Source - Always visible */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 flex-wrap">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="whitespace-nowrap">{formatDate(article.date)}</span>
              <span className="mx-0.5 sm:mx-1">•</span>
              <span className="truncate">{article.source}</span>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                {/* Full Content */}
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {article.fullContent}
                </p>
              </div>
            )}

            {/* Spacer to push buttons to bottom */}
            <div className="flex-grow"></div>

            {/* Buttons at the bottom */}
            <div className="flex justify-center gap-2 mt-auto">
              {/* Read More Button */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : article.id)}
                className="w-28 sm:w-32 px-2 py-2 sm:py-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
              >
                {isExpanded ? 'إخفاء' : 'اقرأ المزيد'}
              </button>
              
              {/* External Link */}
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-28 sm:w-32 flex items-center justify-center gap-1 px-2 py-2 sm:py-2.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  <span>المصدر</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )})}
      </div>

      {news.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          لا توجد أخبار متاحة حالياً
        </div>
      )}
    </div>
  );
};

export default PalestinianNews;
