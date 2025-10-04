import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Calendar, MessageCircle, CheckCircle } from 'lucide-react';

const HowItWorks = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const steps = [
    {
      icon: <UserPlus className="h-8 w-8" />,
      title: 'إنشاء حساب',
      description: 'سجل حساباً مجانياً في دقائق معدودة',
      color: 'from-blue-500 to-blue-600',
      number: '01'
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: 'ابحث عن محامي',
      description: 'ابحث عن المحامي المناسب حسب التخصص والموقع',
      color: 'from-cyan-500 to-cyan-600',
      number: '02'
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: 'احجز موعد',
      description: 'اختر الوقت المناسب واحجز استشارتك',
      color: 'from-green-500 to-green-600',
      number: '03'
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: 'احصل على الاستشارة',
      description: 'تواصل مع محاميك وابدأ في حل مشكلتك',
      color: 'from-purple-500 to-purple-600',
      number: '04'
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'تابع قضيتك',
      description: 'راقب تطورات قضيتك خطوة بخطوة',
      color: 'from-pink-500 to-pink-600',
      number: '05'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            كيف تعمل المنصة؟
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            خطوات بسيطة للحصول على استشارة قانونية احترافية
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-cyan-200 to-pink-200 transform -translate-y-1/2" style={{ zIndex: 0 }}></div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 relative" style={{ zIndex: 1 }}>
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative group"
              >
                {/* Step Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition duration-300 hover:shadow-2xl">
                  {/* Number Badge */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} text-white flex items-center justify-center font-bold text-lg shadow-lg`}>
                      {step.number}
                    </div>
                  </div>

                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${step.color} text-white mb-4 mt-6 group-hover:scale-110 transition duration-300`}>
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">جاهز للبدء؟</p>
          <button 
            onClick={() => setShowModal(true)}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-2xl transition transform hover:scale-105 font-bold text-lg"
          >
            ابدأ رحلتك القانونية الآن
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 transform animate-slideUp">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">مرحباً بك</h3>
                <p className="text-gray-600 dark:text-gray-300">اختر كيف تريد المتابعة</p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate('/signup');
                  }}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-xl transition transform hover:scale-105 font-bold text-lg"
                >
                  إنشاء حساب جديد
                </button>
                
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate('/login');
                  }}
                  className="w-full px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition font-bold text-lg"
                >
                  أملك حساب بالفعل
                </button>
              </div>
              
              <button
                onClick={() => setShowModal(false)}
                className="mt-6 w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HowItWorks;
