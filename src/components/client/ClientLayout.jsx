import React, { useState, useEffect } from 'react';
import { useClientAuth } from '../../hooks/useClientAuth';
import ClientNavbar from './ClientNavbar';
import ClientSidebar from './ClientSidebar';
import { useLocation } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

const ClientLayout = ({ children }) => {
  const { userProfile, loading } = useClientAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Redirect to login if not authenticated or not a client
  if (!loading && (!userProfile || userProfile.user_type !== 'client')) {
    window.location.href = '/login';
    return null;
  }

  // Check if current route should hide sidebar (e.g., full-screen pages)
  const hideSidebarRoutes = ['/client/video-call', '/client/ai-chatbot'];
  const shouldHideSidebar = hideSidebarRoutes.some(route => location.pathname.includes(route));
  
  // Check if current page is messages
  const isMessagesPage = location.pathname.includes('/messages');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Navigation Bar */}
      <ClientNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex pt-16">
        {/* Sidebar - Hidden on full-screen pages */}
        {!shouldHideSidebar && (
          <ClientSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
        )}
        
        {/* Main Content */}
        <main className="flex-1 transition-all duration-300 w-full overflow-x-hidden lg:mr-80">
          {isMessagesPage ? (
            children
          ) : (
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
