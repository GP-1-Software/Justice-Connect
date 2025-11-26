import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLawyerAuth } from '../hooks/useLawyerAuth';
import LawyerNavbar from '../components/lawyer/LawyerNavbar';
import LawyerSidebar from '../components/lawyer/LawyerSidebar';
import LoadingSpinner from '../components/shared/LoadingSpinner';


const LawyerLayout = () => {
  const { loading, lawyer } = useLawyerAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Check if current page is messages
  const isMessagesPage = location.pathname.includes('/messages');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Navigation Bar */}
      <LawyerNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex pt-16">
        {/* Sidebar */}
        <LawyerSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Main Content */}
        <main className="flex-1 transition-all duration-300 w-full overflow-x-hidden lg:mr-80">
          {isMessagesPage ? (
            <Outlet />
          ) : (
            <div className="p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LawyerLayout;

