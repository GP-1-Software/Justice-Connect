import React from 'react';
import { Search, Calendar, MessageSquare, CreditCard, FileText, Shield, Brain, FileSearch, Bot, BarChart3, Sparkles, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: 'بحث ذكي عن المحامين',
      description: 'ابحث عن المحامي المناسب حسب التخصص، الموقع، سنوات الخبرة والتقييمات',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: 'حجز المواعيد',
      description: 'احجز موعد استشارة حضورية أو أونلاين بكل سهولة',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'تواصل آمن',
      description: 'محادثات مشفرة، مكالمات صوتية وفيديو، ومشاركة ملفات آمنة مع محاميك',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'إدارة القضايا',
      description: 'تابع قضاياك بشكل كامل مع جدول زمني للأحداث والمستندات',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: 'دفع إلكتروني آمن',
      description: 'ادفع للاستشارات والخدمات بأمان مع متابعة الفواتير',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'محامون موثوقون',
      description: 'جميع المحامين معتمدون ومصادق على رخصهم المهنية',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const aiFeatures = [
    {
      icon: <FileSearch className="h-10 w-10" />,
      title: 'تحليل المستندات القانونية',
      description: 'ارفع أي عقد أو مستند قانوني واحصل على تحليل فوري يشمل ملخص بلغة بسيطة، البنود الخطرة، والمخاطر المحتملة',
      features: ['تحليل العقود', 'كشف البنود الخطرة', 'ملخص تلقائي'],
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: <Bot className="h-10 w-10" />,
      title: 'مساعد قانوني ذكي',
      description: 'اسأل أي سؤال قانوني واحصل على إجابات فورية من مساعدنا الذكي المدرب على القوانين المحلية',
      features: ['إجابات فورية', 'متاح 24/7', 'توجيه للتخصص المناسب'],
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: <BarChart3 className="h-10 w-10" />,
      title: 'توقع نتائج القضايا',
      description: 'احصل على تقدير ذكي لنسبة نجاح قضيتك والمدة المتوقعة بناءً على بيانات آلاف القضايا المشابهة',
      features: ['نسبة النجاح المتوقعة', 'المدة الزمنية', 'تحليل مقارن'],
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: <Sparkles className="h-10 w-10" />,
      title: 'توصية المحامي المثالي',
      description: 'نظام توصية ذكي يقترح أفضل محامي لقضيتك بناءً على التخصص، الخبرة، والتقييمات',
      features: ['مطابقة ذكية', 'تحليل الخبرات', 'أفضل التقييمات'],
      color: 'from-pink-500 to-rose-600'
    }
  ];

  const handleSearchClick = () => {
    // Trigger navbar search by scrolling to top and opening search
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const searchButton = document.querySelector('[aria-label="Open search"]');
      if (searchButton) searchButton.click();
    }, 500);
  };

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            المزايا الأساسية
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            منصة شاملة توفر لك كل ما تحتاجه للحصول على استشارات قانونية احترافية
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={index === 0 ? handleSearchClick : undefined}
              className={`group bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-600 ${
                index === 0 ? 'cursor-pointer' : ''
              }`}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* AI Features Section */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white rounded-3xl p-12 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>

          <div className="relative z-10">
            {/* AI Section Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 space-x-reverse bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 px-6 py-3 rounded-full text-sm font-semibold mb-6">
                <Brain className="h-5 w-5" />
                <span>مدعوم بالذكاء الاصطناعي والتعلم الآلي</span>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                تقنيات ذكية لخدمات قانونية متطورة
              </h3>
              <p className="text-lg text-blue-200 max-w-3xl mx-auto">
                نستخدم أحدث تقنيات الذكاء الاصطناعي لتقديم تحليلات دقيقة وتوصيات ذكية
              </p>
            </div>

            {/* AI Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {aiFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/15 transition duration-300 border border-white/20 hover:border-white/40"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-4 group-hover:scale-110 transition duration-300`}>
                    {feature.icon}
                  </div>
                  
                  <h4 className="text-xl font-bold mb-3">
                    {feature.title}
                  </h4>
                  
                  <p className="text-blue-200 leading-relaxed mb-4 text-sm">
                    {feature.description}
                  </p>

                  <div className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2 space-x-reverse">
                        <Zap className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                        <span className="text-sm text-blue-100">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
