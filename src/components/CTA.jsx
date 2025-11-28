import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

const CTA = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-3xl shadow-2xl overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>

          <div className="relative z-10 py-16 px-8 md:px-16 text-center">
            <div className="inline-flex items-center space-x-2 space-x-reverse bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              <span>انضم إلى منصتنا الآن</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ابدأ رحلتك القانونية اليوم
            </h2>
            
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed">
              ابدأ رحلتك القانونية مع منصة متكاملة تجمع بين التقنية والخبرة القانونية
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => setShowModal(true)}
                className="px-10 py-4 bg-white text-blue-600 rounded-xl hover:shadow-2xl transition transform hover:scale-105 font-bold text-lg flex items-center space-x-3 space-x-reverse"
              >
                <span>ابدأ الآن مجاناً</span>
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => {
                  const element = document.getElementById('features');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-10 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 transition font-bold text-lg"
              >
                استكشف المزيد
              </button>
            </div>

            <div className="mt-10 flex items-center justify-center space-x-8 space-x-reverse text-white">
              <div className="flex items-center space-x-2 space-x-reverse">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>بدون بطاقة ائتمان</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>إلغاء في أي وقت</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>دعم 24/7</span>
              </div>
            </div>
          </div>
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

export default CTA;
