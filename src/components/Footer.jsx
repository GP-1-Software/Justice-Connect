import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Send } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

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

  return (
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
            
            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-blue-200 mb-3">اشترك في النشرة الإخبارية</p>
              <form onSubmit={handleSubscribe} className="flex space-x-2 space-x-reverse">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:border-cyan-400 transition"
                  required
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:shadow-lg transition transform hover:scale-105"
                  aria-label="Subscribe"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
              {subscribed && (
                <p className="text-green-300 text-sm mt-2">✓ تم الاشتراك بنجاح!</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-blue-200 text-sm">
              © 2025 المنصة القانونية. جميع الحقوق محفوظة.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
              <button onClick={() => navigate('/privacy')} className="text-blue-200 hover:text-white transition">سياسة الخصوصية</button>
              <button onClick={() => navigate('/terms')} className="text-blue-200 hover:text-white transition">الشروط والأحكام</button>
              <button onClick={() => navigate('/support')} className="text-blue-200 hover:text-white transition">الدعم الفني</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
