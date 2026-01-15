import React, { useState, useEffect } from 'react';
import { useClientAuth } from '../../hooks/useClientAuth';
import ClientNavbar from './ClientNavbar';
import ClientSidebar from './ClientSidebar';
import FloatingAIChat from '../common/FloatingAIChat';
import { useLocation } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const ClientLayout = ({ children }) => {
  const { userProfile, loading } = useClientAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // ✅ Mobile App Detection - Check query parameters
  const searchParams = new URLSearchParams(location.search);
  const isMobileApp = searchParams.get('mobile') === 'true';
  const hideNav = searchParams.get('hideNav') === 'true';

  useEffect(() => {
    if (loading) return;

    const toastPayload = sessionStorage.getItem('clientLoginToast');
    if (toastPayload) {
      try {
        const { type, message } = JSON.parse(toastPayload);
        if (type === 'success' && message) {
          toast.success(message);
        }
      } catch (error) {
        console.warn('Failed to parse client login toast payload:', error);
      } finally {
        sessionStorage.removeItem('clientLoginToast');
      }
    }
  }, [loading]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // ✅ في mobile mode، لا تحول على login حتى لو loading
  if (!userProfile) {
    if (isMobileApp) {
      // في mobile mode، عرض loading بدلاً من redirect
      console.warn('⚠️ [ClientLayout] No user profile in mobile mode');
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      );
    }
    window.location.href = '/login';
    return null;
  }

  // Redirect to login if not authenticated or not a client
  if (userProfile.user_type !== 'client' && !isMobileApp) {
    window.location.href = '/login';
    return null;
  }

  // Check if current route should hide sidebar (e.g., full-screen pages)
  const hideSidebarRoutes = ['/client/video-call', '/client/ai-chatbot'];
  const shouldHideSidebar = hideSidebarRoutes.some(route => location.pathname.includes(route));

  // Check if current page is messages
  const isMessagesPage = location.pathname.includes('/messages');

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Navigation Bar - إخفاء في mobile */}
      {!hideNav && <ClientNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}

      <div className={`flex h-full ${!hideNav ? 'pt-16' : 'pt-0'} min-h-0`}>
        {/* Sidebar - Hidden on full-screen pages and mobile */}
        {!hideNav && !shouldHideSidebar && (
          <ClientSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 min-h-0 h-full transition-all duration-300 w-full overflow-x-hidden overflow-y-auto ${!hideNav ? 'lg:mr-80' : ''}`}>
          {isMessagesPage ? (
            children
          ) : (
            <div className={isMobileApp ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}>
              {children}
            </div>
          )}
        </main>
      </div>

      {/* Floating AI Chat Widget - Hide in mobile app */}
      {!isMobileApp && <FloatingAIChat userProfile={userProfile} />}
    </div>
  );
};

export default ClientLayout;
