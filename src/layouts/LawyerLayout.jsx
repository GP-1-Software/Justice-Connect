import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLawyerAuth } from '../hooks/useLawyerAuth';
import LawyerNavbar from '../components/lawyer/LawyerNavbar';
import LawyerSidebar from '../components/lawyer/LawyerSidebar';
import LoadingSpinner from '../components/shared/LoadingSpinner';


const LawyerLayout = () => {
  const { loading, lawyer } = useLawyerAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <main className="flex-1 transition-all duration-300 w-full lg:mr-80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LawyerLayout;

