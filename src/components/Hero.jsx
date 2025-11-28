import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shield, Brain, Zap, CheckCircle, ArrowLeft } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  // Platform features - real benefits
  const platformFeatures = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: 'ذكاء اصطناعي متقدم',
      description: 'تحليل المستندات القانونية والحصول على استشارات فورية',
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'أمان وخصوصية',
      description: 'تشفير كامل لبياناتك ومحادثاتك مع المحامين',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'سرعة وكفاءة',
      description: 'احصل على استشارة قانونية في دقائق معدودة',
      color: 'from-green-500 to-emerald-600'
    }
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % platformFeatures.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [platformFeatures.length]);

  return (
    <section id="home" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center md:text-right space-y-8">
            <div className="inline-flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 text-blue-700 dark:text-blue-300 px-5 py-3 rounded-full text-sm font-bold shadow-lg">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span>منصة قانونية متكاملة مدعومة بالذكاء الاصطناعي</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-tight">
              استشارات قانونية
              <span className="gradient-text block mt-3" style={{lineHeight: '1.2'}}>احترافية وموثوقة</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed" style={{lineHeight: '1.9'}}>
              منصة شاملة تربطك بمحامين متخصصين معتمدين. احصل على استشارات قانونية، 
              إدارة قضاياك، وتحليل مستنداتك بتقنية الذكاء الاصطناعي المتقدمة.
            </p>

            {/* Key Benefits */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 space-x-reverse text-gray-700 dark:text-gray-300">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                <span className="text-lg">محامون معتمدون ومصادق على رخصهم</span>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse text-gray-700 dark:text-gray-300">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                <span className="text-lg">تشفير كامل لحماية خصوصيتك</span>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse text-gray-700 dark:text-gray-300">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                <span className="text-lg">دعم فني متاح على مدار الساعة</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={() => setShowStartDropdown(true)}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-2xl transition transform hover:scale-105 font-bold text-lg flex items-center justify-center space-x-2 space-x-reverse"
              >
                <span>ابدأ الآن مجاناً</span>
                <ArrowLeft className="h-5 w-5 group-hover:translate-x-1 transition" />
              </button>
              <button 
                onClick={() => {
                  const element = document.getElementById('features');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-8 py-4 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700 transition font-bold text-lg"
              >
                اكتشف المزايا
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

          {/* Platform Features Showcase */}
          <div className="relative max-w-md mx-auto">
            <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 dark:from-blue-700 dark:via-cyan-700 dark:to-blue-800 rounded-2xl shadow-xl p-1 overflow-hidden">
              {/* Animated gradient border effect */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-full">
                {/* Features Carousel */}
                <div className="space-y-4 min-h-[280px] flex flex-col justify-center">
                  {platformFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className={`transition-all duration-500 ${
                        index === currentFeature
                          ? 'opacity-100 transform translate-y-0'
                          : 'opacity-0 absolute transform -translate-y-4 pointer-events-none'
                      }`}
                    >
                      <div className="text-center space-y-4">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} text-white shadow-lg`}>
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed px-2">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature Indicators */}
                <div className="flex justify-center mt-6 space-x-2 space-x-reverse">
                  {platformFeatures.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentFeature
                          ? 'w-8 bg-gradient-to-r from-blue-600 to-cyan-500'
                          : 'w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                      }`}
                      aria-label={`Feature ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Trust Badges */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">آمن ومشفر</p>
                    </div>
                    <div>
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">محامون معتمدون</p>
                    </div>
                    <div>
                      <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">استجابة فورية</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
