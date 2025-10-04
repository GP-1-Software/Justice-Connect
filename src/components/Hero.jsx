import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Scale, ChevronLeft, ChevronRight, Search, Moon, Sun, ChevronDown } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();
  const [currentLawyer, setCurrentLawyer] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showJourneyDropdown, setShowJourneyDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Sample lawyers data - you can replace this with database data later
  const lawyers = [
    {
      name: 'المحامي أحمد محمود',
      specialty: 'متخصص في القضايا التجارية',
      rating: 5,
      reviews: 248,
      experience: '15+',
      successRate: '98%'
    },
    {
      name: 'المحامية سارة العلي',
      specialty: 'متخصصة في قضايا الأحوال الشخصية',
      rating: 5,
      reviews: 195,
      experience: '12+',
      successRate: '96%'
    },
    {
      name: 'المحامي خالد حسن',
      specialty: 'متخصص في القضايا الجنائية',
      rating: 5,
      reviews: 312,
      experience: '18+',
      successRate: '97%'
    },
    {
      name: 'المحامية ليلى محمد',
      specialty: 'متخصصة في القضايا العقارية',
      rating: 5,
      reviews: 167,
      experience: '10+',
      successRate: '95%'
    },
    {
      name: 'المحامي عمر يوسف',
      specialty: 'متخصص في قضايا العمل',
      rating: 5,
      reviews: 221,
      experience: '14+',
      successRate: '99%'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    let interval;
    if (autoPlay) {
      interval = setInterval(() => {
        setCurrentLawyer((prev) => (prev + 1) % lawyers.length);
      }, 6000); // Change every 6 seconds
    }
    return () => clearInterval(interval);
  }, [autoPlay, lawyers.length]);

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentLawyer((prev) => (prev + 1) % lawyers.length);
    // Resume auto-play after 12 seconds
    setTimeout(() => setAutoPlay(true), 12000);
  };

  const handlePrev = () => {
    setAutoPlay(false);
    setCurrentLawyer((prev) => (prev - 1 + lawyers.length) % lawyers.length);
    // Resume auto-play after 12 seconds
    setTimeout(() => setAutoPlay(true), 12000);
  };

  const currentLawyerData = lawyers[currentLawyer];

  return (
    <section id="home" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center md:text-right space-y-6">
            <div className="inline-flex items-center space-x-2 space-x-reverse bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              <span>مدعوم بالذكاء الاصطناعي</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              استشارات قانونية
              <span className="gradient-text block mt-2" style={{lineHeight: '1.5'}}>ذكية وسريعة</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed" style={{lineHeight: '1.8'}}>
              منصة شاملة تربطك بأفضل المحامين المتخصصين. احصل على استشارات قانونية فورية، 
              إدارة قضاياك، وتحليل مستنداتك باستخدام الذكاء الاصطناعي.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center md:justify-start">
              <button 
                onClick={() => setShowStartDropdown(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-xl transition transform hover:scale-105 font-bold text-lg"
              >
                ابدأ الآن مجاناً
              </button>
            </div>

            {/* Full Screen Modal */}
            {showStartDropdown && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 transform animate-slideUp">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مرحباً بك</h3>
                    <p className="text-gray-600 dark:text-gray-300">اختر كيف تريد المتابعة</p>
                  </div>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        setShowStartDropdown(false);
                        navigate('/signup');
                      }}
                      className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-xl transition transform hover:scale-105 font-bold text-lg"
                    >
                      إنشاء حساب جديد
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowStartDropdown(false);
                        navigate('/login');
                      }}
                      className="w-full px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition font-bold text-lg"
                    >
                      أملك حساب بالفعل
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowStartDropdown(false)}
                    className="mt-6 w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition font-semibold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            
          </div>

          {/* Lawyer Carousel */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-20 bg-white rounded-full p-3 shadow-xl hover:bg-blue-50 transition"
              aria-label="Previous lawyer"
            >
              <ChevronRight className="h-6 w-6 text-blue-600" />
            </button>

            <button
              onClick={handleNext}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-20 bg-white rounded-full p-3 shadow-xl hover:bg-blue-50 transition"
              aria-label="Next lawyer"
            >
              <ChevronLeft className="h-6 w-6 text-blue-600" />
            </button>

            {/* Lawyer Card */}
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-400 dark:from-blue-700 dark:to-cyan-600 rounded-3xl shadow-2xl p-8">
                <div 
                  key={currentLawyer}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 space-y-4 animate-fadeSlide"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{currentLawyerData.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{currentLawyerData.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="flex">
                      {[...Array(currentLawyerData.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-sm">({currentLawyerData.reviews} تقييم)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{currentLawyerData.experience}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">سنة خبرة</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{currentLawyerData.successRate}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">نسبة النجاح</p>
                    </div>
                  </div>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">
                    احجز استشارة الآن
                  </button>
                </div>
              </div>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center mt-6 space-x-2 space-x-reverse">
              {lawyers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentLawyer(index);
                    setAutoPlay(false);
                    setTimeout(() => setAutoPlay(true), 12000);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentLawyer ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
                  }`}
                  aria-label={`Go to lawyer ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
