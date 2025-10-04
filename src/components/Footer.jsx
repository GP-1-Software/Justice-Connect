import React from 'react';
import { Scale, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
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
              <a href="#" className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500 rounded-lg flex items-center justify-center transition">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500 rounded-lg flex items-center justify-center transition">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500 rounded-lg flex items-center justify-center transition">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-blue-500/20 hover:bg-blue-500 rounded-lg flex items-center justify-center transition">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6">روابط سريعة</h3>
            <ul className="space-y-3">
              <li><a href="#home" className="text-blue-200 hover:text-white transition">الرئيسية</a></li>
              <li><a href="#features" className="text-blue-200 hover:text-white transition">المزايا</a></li>
              <li><a href="#ai-features" className="text-blue-200 hover:text-white transition">الذكاء الاصطناعي</a></li>
              <li><a href="#how-it-works" className="text-blue-200 hover:text-white transition">كيف يعمل</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition">الأسعار</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition">المدونة</a></li>
            </ul>
          </div>

          {/* For Lawyers */}
          <div>
            <h3 className="text-xl font-bold mb-6">للمحامين</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-blue-200 hover:text-white transition">انضم كمحامي</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition">إدارة القضايا</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition">التقويم والمواعيد</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition">الإحصائيات</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition">الدعم الفني</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition">الأسئلة الشائعة</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6">تواصل معنا</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 space-x-reverse">
                <MapPin className="h-5 w-5 text-cyan-400 mt-1 flex-shrink-0" />
                <span className="text-blue-200">شارع الملك عبدالله، الرياض، المملكة العربية السعودية</span>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse">
                <Phone className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                <a href="tel:+966123456789" className="text-blue-200 hover:text-white transition">+966 12 345 6789</a>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse">
                <Mail className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                <a href="mailto:info@legalplatform.com" className="text-blue-200 hover:text-white transition">info@legalplatform.com</a>
              </li>
            </ul>
            
            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-blue-200 mb-3">اشترك في النشرة الإخبارية</p>
              <div className="flex space-x-2 space-x-reverse">
                <input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:border-cyan-400"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:shadow-lg transition">
                  <Mail className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-blue-200 text-sm">
              © 2025 المنصة القانونية. جميع الحقوق محفوظة.
            </p>
            <div className="flex space-x-6 space-x-reverse text-sm">
              <a href="#" className="text-blue-200 hover:text-white transition">سياسة الخصوصية</a>
              <a href="#" className="text-blue-200 hover:text-white transition">الشروط والأحكام</a>
              <a href="#" className="text-blue-200 hover:text-white transition">سياسة الاسترجاع</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
