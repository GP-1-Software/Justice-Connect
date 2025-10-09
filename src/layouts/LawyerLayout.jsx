import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLawyerAuth } from '../hooks/useLawyerAuth';
import { Briefcase, Calendar as CalendarIcon, User as UserIcon, LayoutDashboard, Scale } from 'lucide-react';

const LawyerLayout = () => {
  const { t, i18n } = useTranslation();
  const { loading, lawyer } = useLawyerAuth();

  const toggleLang = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        ...
      </div>
    );
  }

  if (!lawyer) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 space-x-reverse hover:opacity-80 transition">
            <Scale className="h-6 w-6 text-blue-600" />
            <span className="font-bold gradient-text">المنصة القانونية</span>
          </Link>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button onClick={toggleLang} className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
              {i18n.language === 'ar' ? 'EN' : 'AR'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <nav className="rounded-2xl shadow p-4 space-y-2 bg-gradient-to-br from-blue-600 to-cyan-500">
            <Link to="/lawyer/dashboard" className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg text-white hover:bg-white/10">
              <LayoutDashboard className="h-5 w-5" />
              <span>{t('lawyer.dashboard')}</span>
            </Link>
            <Link to="/lawyer/cases" className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg text-white hover:bg-white/10">
              <Briefcase className="h-5 w-5" />
              <span>{t('lawyer.cases')}</span>
            </Link>
            <Link to="/lawyer/calendar" className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg text-white hover:bg-white/10">
              <CalendarIcon className="h-5 w-5" />
              <span>{t('lawyer.calendar')}</span>
            </Link>
            <Link to="/lawyer/profile" className="flex items-center space-x-2 space-x-reverse p-3 rounded-lg text-white hover:bg-white/10">
              <UserIcon className="h-5 w-5" />
              <span>{t('lawyer.profile')}</span>
            </Link>
          </nav>
        </aside>
        <main className="lg:col-span-9">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LawyerLayout;


