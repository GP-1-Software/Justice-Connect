import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLawyerAuth } from '../hooks/useLawyerAuth';
import LawyerNavbar from '../components/lawyer/LawyerNavbar';
import LawyerSidebar from '../components/lawyer/LawyerSidebar';
import FloatingAIChat from '../components/common/FloatingAIChat';
import LoadingSpinner from '../components/shared/LoadingSpinner';


const LawyerLayout = () => {
  const { loading, lawyer } = useLawyerAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // ✅ Mobile App Detection - Check query parameters
  const searchParams = new URLSearchParams(location.search);
  const isMobileApp = searchParams.get('mobile') === 'true';
  const hideNav = searchParams.get('hideNav') === 'true';

  // Check if current page is messages
  const isMessagesPage = location.pathname.includes('/messages');

  // Check if current page is justice-ai and in mobile mode
  const isJusticeAIPage = location.pathname.includes('/justice-ai');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!lawyer) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Navigation Bar - إخفاء في mobile */}
      {!hideNav && <LawyerNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}

      <div className={`flex h-full ${!hideNav ? 'pt-16' : 'pt-0'} min-h-0`}>
        {/* Sidebar - إخفاء في mobile */}
        {!hideNav && (
          <LawyerSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 min-h-0 h-full transition-all duration-300 w-full overflow-x-hidden overflow-y-auto ${!hideNav ? 'lg:mr-80' : ''}`}>
          {isMessagesPage ? (
            <Outlet />
          ) : (
            <div className={isMobileApp ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}>
              <Outlet />
            </div>
          )}
        </main>
      </div>

      {/* Floating AI Chat Widget - Hide in mobile app */}
      {!isMobileApp && !(isJusticeAIPage && isMobile) && (
        <FloatingAIChat userProfile={lawyer} userType="lawyer" />
      )}
    </div>
  );
};

export default LawyerLayout;

