import React, { useState, useEffect } from 'react';
import { FileText, Search, Calendar, ExternalLink, X, Eye } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LawyerNavbar from '../components/lawyer/LawyerNavbar';
import ClientNavbar from '../components/client/ClientNavbar';
import Footer from '../components/Footer';

function LegislationPage() {
  const location = useLocation();
  const [legislations, setLegislations] = useState([]);
  const [filteredLegislations, setFilteredLegislations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pdfModalOpen, setPdfModalOpen] = useState(() => {
    return sessionStorage.getItem('pdfModalOpen') === 'true';
  });
  const [currentPdfUrl, setCurrentPdfUrl] = useState(() => {
    return sessionStorage.getItem('currentPdfUrl') || '';
  });
  const [currentPdfTitle, setCurrentPdfTitle] = useState(() => {
    return sessionStorage.getItem('currentPdfTitle') || '';
  });
  const [isPdfExpanded, setIsPdfExpanded] = useState(false);
  
  // تحديد نوع Navbar بناءً على المصدر
  const referrer = location.state?.from || 'home';
  const isFromLawyer = referrer.includes('lawyer');
  const isFromClient = referrer.includes('client');
  
  // اختيار Navbar المناسب
  const NavbarComponent = isFromLawyer ? LawyerNavbar : isFromClient ? ClientNavbar : Navbar;

  useEffect(() => {
    // تحميل البيانات الوصفية
    fetch(`/legislation/metadata.json?t=${Date.now()}`)
      .then(response => response.json())
      .then(data => {
        setLegislations(data);
        setFilteredLegislations(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading legislations:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // تصفية حسب البحث والتصنيف
    let filtered = legislations;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(leg => leg.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(leg =>
        leg.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLegislations(filtered);
  }, [searchTerm, selectedCategory, legislations]);

  // استخراج التصنيفات الفريدة
  const categories = [...new Set(legislations.map(leg => leg.category))];

  const openPDF = (pdfUrl) => {
    window.open(pdfUrl, '_blank');
  };

  const viewPDFInModal = (pdfUrl, title) => {
    setCurrentPdfUrl(pdfUrl);
    setCurrentPdfTitle(title);
    setPdfModalOpen(true);
    setIsPdfExpanded(false);
    // حفظ في sessionStorage
    sessionStorage.setItem('pdfModalOpen', 'true');
    sessionStorage.setItem('currentPdfUrl', pdfUrl);
    sessionStorage.setItem('currentPdfTitle', title);
  };

  const closePDFModal = () => {
    setPdfModalOpen(false);
    setCurrentPdfUrl('');
    setCurrentPdfTitle('');
    setIsPdfExpanded(false);
    // مسح من sessionStorage
    sessionStorage.removeItem('pdfModalOpen');
    sessionStorage.removeItem('currentPdfUrl');
    sessionStorage.removeItem('currentPdfTitle');
  };

  const togglePdfSize = () => {
    setIsPdfExpanded(!isPdfExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <NavbarComponent />
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-24 pb-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-3 sm:mb-4">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 px-4">
            التشريعات الفلسطينية
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 px-4">
            مكتبة شاملة للقوانين والتشريعات الفلسطينية
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <input
              type="text"
              placeholder="ابحث عن تشريع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 sm:pr-12 pl-3 sm:pl-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mb-6 sm:mb-8 px-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            الكل ({legislations.length})
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category} ({legislations.filter(leg => leg.category === category).length})
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
          </div>
        )}

        {/* Legislations Grid */}
        {!loading && (
          <>
            <div className="mb-3 sm:mb-4 text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              عرض {filteredLegislations.length} من {legislations.length} تشريع
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredLegislations.map((legislation) => (
                <div
                  key={legislation.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-4 sm:p-6"
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-3 sm:mb-4">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-right">
                    {legislation.title}
                  </h3>

                  {/* Category */}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                      {legislation.category}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <Calendar className="h-4 w-4 ml-1" />
                    <span>{legislation.downloadDate}</span>
                  </div>

                  {/* PDF Buttons */}
                  {legislation.hasPdf && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => viewPDFInModal(legislation.pdfUrl, legislation.title)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">عرض PDF</span>
                        <span className="sm:hidden">عرض</span>
                      </button>
                      <button
                        onClick={() => openPDF(legislation.pdfUrl)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="hidden sm:inline">فتح في تبويب</span>
                        <span className="sm:hidden">فتح</span>
                      </button>
                    </div>
                  )}

                  {!legislation.hasPdf && (
                    <div className="w-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold py-2 px-3 sm:px-4 rounded-lg text-center text-sm sm:text-base">
                      PDF غير متوفر
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredLegislations.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  لم يتم العثور على تشريعات
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* PDF Side Panel */}
      {pdfModalOpen && (
        <>
          {/* Overlay - شفاف على الشاشات الكبيرة */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 lg:bg-opacity-10 z-[90]"
            onClick={closePDFModal}
          />
          
          {/* Side Panel */}
          <div 
            className={`fixed top-0 left-0 h-screen z-[100] bg-white dark:bg-gray-800 shadow-2xl transition-all duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700 ${
              isPdfExpanded 
                ? 'w-full sm:w-[95%] md:w-[80%] lg:w-[75%] xl:w-[70%]'
                : 'w-full sm:w-[90%] md:w-[55%] lg:w-[50%] xl:w-[45%] 2xl:w-[40%]'
            }`}
            style={{ animation: 'slideInFromLeft 0.3s ease-out' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={togglePdfSize}
                  className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label={isPdfExpanded ? 'تصغير' : 'توسيع'}
                  title={isPdfExpanded ? 'تصغير' : 'توسيع'}
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isPdfExpanded ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    )}
                  </svg>
                </button>
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white truncate text-right">
                  {currentPdfTitle}
                </h2>
              </div>
              <button
                onClick={closePDFModal}
                className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {/* PDF Viewer */}
            <div className="h-[calc(100vh-60px)] overflow-hidden bg-gray-50 dark:bg-gray-900">
              <iframe
                src={currentPdfUrl}
                className="w-full h-full border-0"
                title="PDF Viewer"
              />
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}

export default LegislationPage;
