import React, { useState } from 'react';
import { useClientAuth } from '../../hooks/useClientAuth';
import ClientNavbar from './ClientNavbar';
import ClientSidebar from './ClientSidebar';
import { useLocation } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';

const ClientLayout = ({ children }) => {
  const { userProfile, loading } = useClientAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <main className={`flex-1 transition-all duration-300 w-full
          ${shouldHideSidebar ? 'mr-0' : 'lg:mr-80'}
        `}>
          <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
