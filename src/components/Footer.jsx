import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Send, X } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  const handleScroll = (targetId) => {
    if (window.location.pathname !== '/') {
      navigate(`/#${targetId}`);
      return;
    }
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Privacy Policy Content
  const PrivacyModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">سياسة الخصوصية</h2>
          <button
            onClick={() => setShowPrivacyModal(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh] text-gray-700 dark:text-gray-300 space-y-4 text-right" dir="rtl">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">مقدمة</h3>
          <p>نحن في المنصة القانونية نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك.</p>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">المعلومات التي نجمعها</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>معلومات التسجيل: الاسم، البريد الإلكتروني، رقم الهاتف، رقم الهوية</li>
            <li>معلومات القضايا القانونية التي تشاركها معنا</li>
            <li>سجل المحادثات مع المحامين وخدمة الذكاء الاصطناعي</li>
            <li>بيانات الاستخدام والتصفح</li>
          </ul>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">كيف نستخدم معلوماتك</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>تقديم الخدمات القانونية المطلوبة</li>
            <li>ربطك بالمحامين المناسبين</li>
            <li>تحسين تجربة المستخدم وخدماتنا</li>
            <li>إرسال إشعارات مهمة حول قضاياك ومواعيدك</li>
          </ul>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">حماية البيانات</h3>
          <p>نستخدم تقنيات تشفير متقدمة لحماية بياناتك. لا نشارك معلوماتك الشخصية مع أطراف ثالثة دون موافقتك.</p>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">حقوقك</h3>
          <p>يحق لك طلب الوصول إلى بياناتك، تصحيحها، أو حذفها في أي وقت عبر التواصل مع فريق الدعم.</p>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">التواصل</h3>
          <p>لأي استفسارات حول سياسة الخصوصية، تواصل معنا على: ali.odeh.pss@gmail.com</p>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowPrivacyModal(false)}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            فهمت
          </button>
        </div>
      </div>
    </div>
  );

  // Terms and Conditions Content
  const TermsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الشروط والأحكام</h2>
          <button
            onClick={() => setShowTermsModal(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh] text-gray-700 dark:text-gray-300 space-y-4 text-right" dir="rtl">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">قبول الشروط</h3>
          <p>باستخدامك للمنصة القانونية، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا لم توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.</p>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">طبيعة الخدمة</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>المنصة توفر وسيطاً بين العملاء والمحامين المرخصين</li>
            <li>الاستشارات المقدمة عبر الذكاء الاصطناعي هي إرشادية وليست بديلاً عن المشورة القانونية المتخصصة</li>
            <li>المحامون المسجلون هم المسؤولون عن جودة خدماتهم</li>
          </ul>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">مسؤوليات المستخدم</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
            <li>الحفاظ على سرية بيانات الدخول</li>
            <li>عدم إساءة استخدام المنصة أو خدماتها</li>
            <li>احترام حقوق الملكية الفكرية</li>
          </ul>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">المدفوعات والرسوم</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>الرسوم المتفق عليها بين العميل والمحامي ملزمة للطرفين</li>
            <li>سياسة الاسترداد تخضع لشروط كل محامٍ على حدة</li>
            <li>المنصة قد تفرض رسوم خدمة على بعض المعاملات</li>
          </ul>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">إخلاء المسؤولية</h3>
          <p>المنصة غير مسؤولة عن أي أضرار ناتجة عن استخدام الخدمات أو الاعتماد على المعلومات المقدمة. نوصي دائماً بالتحقق من أي معلومات قانونية مع محامٍ مرخص.</p>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">تعديل الشروط</h3>
          <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطار المستخدمين بأي تغييرات جوهرية.</p>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">القانون الواجب التطبيق</h3>
          <p>تخضع هذه الشروط للقوانين المعمول بها في فلسطين.</p>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowTermsModal(false)}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            فهمت
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <footer id="contact" className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* About Section */}
            <div>
              <div className="flex items-center space-x-3 space-x-reverse mb-6">
                <Scale className="h-8 w-8 text-cyan-400" />
                <span className="text-2xl font-bold">المنصة القانونية</span>
              </div>
              <p className="text-blue-200 leading-relaxed mb-6">
                منصة شاملة تربط المحامين مع العملاء لتقديم استشارات قانونية ذكية مدعومة بالذكاء الاصطناعي.
              </p>
              <div className="flex space-x-4 space-x-reverse">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500 rounded-lg flex items-center justify-center transition" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500 rounded-lg flex items-center justify-center transition" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500 rounded-lg flex items-center justify-center transition" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500 rounded-lg flex items-center justify-center transition" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-6">روابط سريعة</h3>
              <ul className="space-y-3">
                <li><button onClick={() => handleScroll('home')} className="text-blue-200 hover:text-white transition cursor-pointer">الرئيسية</button></li>
                <li><button onClick={() => handleScroll('features')} className="text-blue-200 hover:text-white transition cursor-pointer">المزايا</button></li>
                <li><button onClick={() => handleScroll('how-it-works')} className="text-blue-200 hover:text-white transition cursor-pointer">كيف يعمل</button></li>
                <li><button onClick={() => navigate('/signup')} className="text-blue-200 hover:text-white transition cursor-pointer">إنشاء حساب</button></li>
                <li><button onClick={() => navigate('/login')} className="text-blue-200 hover:text-white transition cursor-pointer">تسجيل الدخول</button></li>
                <li><button onClick={() => handleScroll('contact')} className="text-blue-200 hover:text-white transition cursor-pointer">تواصل معنا</button></li>
              </ul>
            </div>

            {/* For Lawyers */}
            <div>
              <h3 className="text-xl font-bold mb-6">للمحامين</h3>
              <ul className="space-y-3">
                <li><button onClick={() => navigate('/signup')} className="text-blue-200 hover:text-white transition cursor-pointer">انضم كمحامي</button></li>
                <li><button onClick={() => navigate('/lawyer/cases')} className="text-blue-200 hover:text-white transition cursor-pointer">إدارة القضايا</button></li>
                <li><button onClick={() => navigate('/lawyer/calendar')} className="text-blue-200 hover:text-white transition cursor-pointer">التقويم والمواعيد</button></li>
                <li><button onClick={() => navigate('/lawyer/dashboard')} className="text-blue-200 hover:text-white transition cursor-pointer">لوحة التحكم</button></li>
                <li><button onClick={() => navigate('/support')} className="text-blue-200 hover:text-white transition cursor-pointer">الدعم الفني</button></li>
                <li><button onClick={() => handleScroll('features')} className="text-blue-200 hover:text-white transition cursor-pointer">مزايا المنصة</button></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-bold mb-6">تواصل معنا</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3 space-x-reverse">
                  <MapPin className="h-5 w-5 text-cyan-400 mt-1 flex-shrink-0" />
                  <span className="text-blue-200">منصة إلكترونية للخدمات القانونية</span>
                </li>
                <li className="flex items-center space-x-3 space-x-reverse">
                  <Phone className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                  <button onClick={() => navigate('/support')} className="text-blue-200 hover:text-white transition">تواصل مع الدعم الفني</button>
                </li>
                <li className="flex items-center space-x-3 space-x-reverse">
                  <Mail className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                  <a href="mailto:ali.odeh.pss@gmail.com" className="text-blue-200 hover:text-white transition">ali.odeh.pss@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>

          
          {/* About Us Section */}
          <div className="border-t border-white/10 pt-8 mb-8">
            <h3 className="text-xl font-bold mb-6 text-center">من نحن</h3>
            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-blue-200 text-center leading-relaxed mb-6">
                نحن طلاب من <span className="text-cyan-400 font-semibold">جامعة النجاح الوطنية</span> قمنا بتطوير هذا الموقع كمشروع تخرج أول (Software) في هندسة الحاسوب (Computer Engineering).
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Developer 1 */}
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <h4 className="text-lg font-bold text-cyan-400 mb-3">Ali Odeh - علي عودة</h4>
                  <div className="space-y-2 text-blue-200 text-sm">
                    <p className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4 text-cyan-400" />
                      <span dir="ltr">+972 59-289-1676</span>
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4 text-cyan-400" />
                      <a href="mailto:ali.odeh.pss@example.com" className="hover:text-white transition">ali.odeh.pss@gmail.com</a>
                    </p>
                  </div>
                </div>
                {/* Developer 2 */}
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <h4 className="text-lg font-bold text-cyan-400 mb-3">Adam - ادم عباهره</h4>
                  <div className="space-y-2 text-blue-200 text-sm">
                    <p className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4 text-cyan-400" />
                      <span dir="ltr">+970-XXX-XXX-XXX</span>
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4 text-cyan-400" />
                      <a href="mailto:second.developer@example.com" className="hover:text-white transition">second.developer@example.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-blue-200 text-sm">
                © 2026 المنصة القانونية. جميع الحقوق محفوظة.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                <button onClick={() => setShowPrivacyModal(true)} className="text-blue-200 hover:text-white transition">سياسة الخصوصية</button>
                <button onClick={() => setShowTermsModal(true)} className="text-blue-200 hover:text-white transition">الشروط والأحكام</button>
                <button onClick={() => navigate('/support')} className="text-blue-200 hover:text-white transition">الدعم الفني</button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showPrivacyModal && <PrivacyModal />}
      {showTermsModal && <TermsModal />}
    </>
  );
};

export default Footer;
