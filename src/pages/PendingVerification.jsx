import React from 'react';
import { Scale, Clock, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const PendingVerification = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12 transition-colors duration-300">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 space-x-reverse mb-6 hover:opacity-80 transition">
            <Scale className="h-10 w-10 text-blue-600 dark:text-white" />
            <span className="text-3xl font-bold gradient-text">المنصة القانونية</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-6">
                <Clock className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            حسابك قيد المراجعة
          </h1>

          {/* Description */}
          <p className="text-center text-gray-600 dark:text-gray-300 text-lg mb-8">
            شكراً لتسجيلك في منصتنا! تم استلام طلبك بنجاح.
          </p>

          {/* Status Steps */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-4 space-x-reverse">
              <div className="flex-shrink-0">
                <div className="bg-green-100 dark:bg-green-900 rounded-full p-2">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">تم إرسال الطلب</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">تم استلام معلوماتك وصورة بطاقة الهوية بنجاح</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 space-x-reverse">
              <div className="flex-shrink-0">
                <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-2 animate-pulse">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">قيد المراجعة</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">فريقنا يقوم بمراجعة معلوماتك والتحقق من هويتك</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 space-x-reverse opacity-50">
              <div className="flex-shrink-0">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2">
                  <Mail className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">إشعار بالنتيجة</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">سيتم إرسال بريد إلكتروني بنتيجة المراجعة</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3 space-x-reverse">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">معلومات مهمة:</h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  <li className="flex items-start space-x-2 space-x-reverse">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>عملية المراجعة تستغرق عادةً من 24 إلى 48 ساعة</span>
                  </li>
                  <li className="flex items-start space-x-2 space-x-reverse">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>سيتم إرسال إشعار على بريدك الإلكتروني فور اكتمال المراجعة</span>
                  </li>
                  <li className="flex items-start space-x-2 space-x-reverse">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>تأكد من التحقق من صندوق البريد الوارد والرسائل غير المرغوب فيها</span>
                  </li>
                  <li className="flex items-start space-x-2 space-x-reverse">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>في حال الرفض، سيتم إرسال سبب الرفض وإمكانية إعادة التقديم</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/"
              className="block w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105 text-center"
            >
              العودة للصفحة الرئيسية
            </Link>
            
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              هل تحتاج مساعدة؟{' '}
              <a href="mailto:support@legal-platform.ps" className="text-blue-600 hover:underline font-semibold">
                تواصل معنا
              </a>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          نقوم بالتحقق من جميع الحسابات لضمان أمان وموثوقية المنصة
        </p>
      </div>
    </div>
  );
};

export default PendingVerification;
