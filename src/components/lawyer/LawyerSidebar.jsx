import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  MessageSquare,
  User,
  Phone,
  Video,
  Bell,
  FileSearch,
  Bot,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Scale,
  CheckSquare,
  FileText
} from 'lucide-react';

const LawyerSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      title: 'العودة للصفحة الرئيسية',
      icon: Scale,
      path: '/',
      external: true,
      highlight: true
    },
    {
      title: 'لوحة التحكم',
      icon: LayoutDashboard,
      path: 'dashboard',
      exact: true
    },
    {
      title: 'الملف الشخصي',
      icon: User,
      path: 'profile'
    },
    {
      title: 'قضاياي',
      icon: Briefcase,
      path: 'cases'
    },
    {
      title: 'التقويم',
      icon: Calendar,
      path: 'calendar'
    },
    {
      title: 'إدارة المواعيد',
      icon: CheckSquare,
      path: 'appointments'
    },
    {
      title: 'الفواتير',
      icon: FileText,
      path: 'invoices'
    },
    {
      title: 'الرسائل',
      icon: MessageSquare,
      path: 'messages'
    },
    /*
    {
      title: 'المكالمات',
      icon: Phone,
      path: 'calls'
    },   */

    {
      title: 'الإشعارات',
      icon: Bell,
      path: 'notifications'
    },
    /*     {
         title: 'الاستشارات',
         icon: Video,
         path: 'consultations'
       },
      {
         title: 'تحليل المستندات',
         icon: FileSearch,
         path: 'document-analysis'
       },
       {
         title: 'المساعد الذكي',
         icon: Bot,
         path: 'ai-assistant'
       },    */
    {
      title: 'الذكاء القانوني',
      icon: Bot,
      path: 'justice-ai'
    },
    {
      title: 'الدعم الفني',
      icon: MessageSquare,
      path: 'support',
      external: false
    },
    {
      title: 'الإعدادات',
      icon: Settings,
      path: 'settings'
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const visibleItems = menuItems.filter(item => !item.hidden);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed right-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 transition-all duration-300 z-40
        ${collapsed ? 'w-16' : 'w-80'}
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Collapse Toggle - Hidden on mobile */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:block absolute -left-3 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-lg hover:shadow-xl transition-all"
        >
          {collapsed ? (
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* Sidebar Content */}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {!collapsed && (
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                قائمة المحامي
              </h2>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
              {visibleItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);

                // Handle external links
                if (item.external) {
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        window.location.href = item.path;
                        if (onClose) onClose();
                      }}
                      className={`flex items-center space-x-3 space-x-reverse px-3 py-3 rounded-lg transition-all duration-200 group w-full text-right ${item.highlight
                        ? 'bg-gradient-to-l from-green-600 to-green-500 text-white shadow-lg hover:from-green-700 hover:to-green-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      title={collapsed ? item.title : ''}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${item.highlight ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400'
                        }`} />

                      {!collapsed && (
                        <>
                          <span className={`font-medium ${item.highlight ? 'text-white' : ''}`}>
                            {item.title}
                          </span>

                          {item.highlight && (
                            <span className="ml-auto bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-semibold">
                              رئيسية
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                }

                return (
                  <Link
                    key={index}
                    to={`/lawyer/${item.path}`}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    className={`flex items-center space-x-3 space-x-reverse px-3 py-3 rounded-lg transition-all duration-200 group ${active
                      ? 'bg-gradient-to-l from-green-600 to-green-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${item.highlight ? 'ring-2 ring-green-200 dark:ring-green-800' : ''}`}
                    title={collapsed ? item.title : ''}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400'
                      }`} />

                    {!collapsed && (
                      <>
                        <span className={`font-medium ${active ? 'text-white' : ''}`}>
                          {item.title}
                        </span>

                        {item.highlight && (
                          <span className="ml-auto bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs px-2 py-1 rounded-full font-semibold">
                            جديد
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-green-50 to-cyan-50 dark:from-green-900/20 dark:to-cyan-900/20 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  تحتاج مساعدة؟
                </p>
                <button
                  onClick={() => window.open('/lawyer/ai-assistant', '_blank')}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold transition"
                >
                  تواصل مع المساعد الذكي
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default LawyerSidebar;
