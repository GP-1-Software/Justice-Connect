import React, { useState, useEffect } from 'react';
import { FileText, Search, Calendar, ExternalLink } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <NavbarComponent />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            التشريعات الفلسطينية
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            مكتبة شاملة للقوانين والتشريعات الفلسطينية
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="ابحث عن تشريع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
            <div className="mb-4 text-center text-gray-600 dark:text-gray-400">
              عرض {filteredLegislations.length} من {legislations.length} تشريع
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLegislations.map((legislation) => (
                <div
                  key={legislation.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-right">
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

                  {/* PDF Button */}
                  {legislation.hasPdf && (
                    <button
                      onClick={() => openPDF(legislation.pdfUrl)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      فتح PDF
                    </button>
                  )}

                  {!legislation.hasPdf && (
                    <div className="w-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold py-2 px-4 rounded-lg text-center">
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

      <Footer />
    </div>
  );
}

export default LegislationPage;
