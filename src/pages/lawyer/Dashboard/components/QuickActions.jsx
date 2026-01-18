import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Users,
  MessageSquare,
  Briefcase,
  Upload,
  UserPlus,
  Settings,
  BookOpen,
  Scale,
  Loader2,
  X,
  Newspaper
} from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();
  const [showNews, setShowNews] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newsUrl, setNewsUrl] = useState('https://maqam.najah.edu/legislation/'); // Default to Maqam Najah

  const fetchAllNews = async (customUrl = null) => {
    setLoading(true);
    setError('');
    try {
      const url = customUrl || newsUrl;
      const apiUrl = url ? `https://justice-connect-mobile.onrender.com/api/news?url=${encodeURIComponent(url)}` : 'https://justice-connect-mobile.onrender.com/api/news';
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.success && data.news && data.news.length > 0) {
        setNews(data.news.map(item => ({
          ...item,
          fetchedAt: new Date()
        })));
        setError('');
      } else if (data.message) {
        setError(data.message);
        setNews([]);
      } else {
        throw new Error(data.error || 'فشل جلب التشريعات');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء جلب التشريعات. تأكد من صحة رابط الموقع');
      console.error('Error fetching all news:', err);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsClick = () => {
    const newState = !showNews;
    setShowNews(newState);
    if (newState && news.length === 0) {
      // Auto-fetch all news on first open
      fetchAllNews();
    }
  };

  const removeNews = (index) => {
    setNews(prev => prev.filter((_, i) => i !== index));
  };

  const actions = [
    {
      icon: FileText,
      labelAr: 'إضافة قضية جديدة',
      labelEn: 'Add New Case',
      bgColor: 'from-purple-500 to-purple-600',
      onClick: () => navigate('/lawyer/cases?action=new')
    },
    {
      icon: Calendar,
      labelAr: 'البحث عن مواعيد',
      labelEn: 'Search Appointments',
      bgColor: 'from-green-500 to-green-600',
      onClick: () => navigate('/lawyer/calendar')
    },
    {
      icon: Briefcase,
      labelAr: 'إدارة الاستشارات',
      labelEn: 'Manage Consultations',
      bgColor: 'from-blue-500 to-cyan-500',
      onClick: () => navigate('/lawyer/cases')
    },

    {
      icon: UserPlus,
      labelAr: 'إضافة استشارات',
      labelEn: 'Add Consultations',
      bgColor: 'from-purple-500 to-pink-500',
      onClick: () => navigate('/lawyer/profile?tab=services')
    },
    {
      icon: MessageSquare,
      labelAr: 'الرسائل',
      labelEn: 'Messages',
      bgColor: 'from-orange-500 to-orange-600',
      onClick: () => navigate('/lawyer/messages')
    },
    {
      icon: BookOpen,
      labelAr: 'التشريعات',
      labelEn: 'Legislations',
      bgColor: 'from-green-500 to-emerald-600',
      onClick: () => navigate('/legislation', { state: { from: 'lawyer-dashboard' } })
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-1 sm:gap-2">
        <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
          الإجراءات السريعة
        </h3>
        <span className="text-xs text-gray-400">
          اختصارات للوصول السريع
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`bg-gradient-to-br ${action.bgColor} p-2 sm:p-4 rounded-lg sm:rounded-xl text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200 touch-manipulation ${showNews && action.labelAr === 'التشريعات' ? 'ring-2 ring-indigo-300' : ''}`}
          >
            <action.icon className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
            <p className="text-xs font-semibold text-center leading-tight">
              {action.labelAr}
            </p>
          </button>
        ))}
      </div>

      {/* News Section */}
      {showNews && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 gap-2">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                التشريعات ({news.length})
              </h4>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => fetchAllNews()}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="hidden sm:inline">جاري التحديث...</span>
                      <span className="sm:hidden">تحديث</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">تحديث القائمة</span>
                      <span className="sm:hidden">تحديث</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="mb-2 sm:mb-3">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                رابط موقع التشريعات:
              </label>
              <div className="flex gap-1.5 sm:gap-2">
                <input
                  type="text"
                  value={newsUrl}
                  onChange={(e) => setNewsUrl(e.target.value)}
                  placeholder="https://www.wafa.ps"
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => fetchAllNews(newsUrl)}
                  disabled={loading || !newsUrl.trim()}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium touch-manipulation"
                >
                  جلب
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                الرابط الافتراضي: maqam.najah.edu/legislation/
              </p>
            </div>
            {error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* News Results */}
          {news.length > 0 && (
            <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {news.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600 relative hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => removeNews(index)}
                    className="absolute top-2 left-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors touch-manipulation"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  
                  <div className="pr-5 sm:pr-6">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-32 sm:h-48 object-cover rounded-lg mb-2 sm:mb-3"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <h5 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                      {item.title || 'بدون عنوان'}
                    </h5>
                    {(item.number || item.year || item.date) && (
                      <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {item.number && (
                          <span>
                            <span className="font-semibold">رقم التشريع:</span> {item.number}
                          </span>
                        )}
                        {item.year && (
                          <span>
                            <span className="font-semibold">سنة التشريع:</span> {item.year}
                          </span>
                        )}
                        {item.date && (
                          <span>
                            <span className="font-semibold">التاريخ:</span> {item.date}
                          </span>
                        )}
                      </div>
                    )}
                    {item.excerpt && (
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 leading-relaxed line-clamp-2 sm:line-clamp-none">
                        {item.excerpt}
                      </p>
                    )}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        اقرأ المزيد →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {news.length === 0 && !loading && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-3 sm:py-4">
              لا توجد تشريعات. اضغط "تحديث القائمة" لجلب جميع التشريعات من موقع مقام
            </p>
          )}

          {loading && news.length === 0 && (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-indigo-600" />
              <span className="mr-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">جاري جلب التشريعات من موقع مقام...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickActions;
