import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ClientLayout from '../components/client/ClientLayout';
import { useClientAuth } from '../hooks/useClientAuth';

// Import client pages (will be created in subsequent steps)
import ClientDashboard from '../pages/client/Dashboard/Dashboard';
import BookAppointment from '../pages/client/BookAppointment';
import Appointments from '../pages/client/Appointments';
import Profile from '../pages/client/Profile';
import Settings from '../pages/client/Settings';
import SearchLawyers from '../pages/client/SearchLawyers';
import LawyerProfile from '../pages/client/LawyerProfile';
import CreateCase from '../pages/client/CreateCase';
import MyCases from '../pages/client/MyCases';
import CaseDetails from '../pages/client/CaseDetails';
// import MyAppointments from '../pages/client/MyAppointments/MyAppointments';
// import DocumentAnalyzer from '../pages/client/DocumentAnalyzer/DocumentAnalyzer';
// import AIChatbot from '../pages/client/AIChatbot/AIChatbot';
// import Messages from '../pages/client/Messages/Messages';
// import VideoCall from '../pages/client/VideoCall/VideoCall';
// import Payments from '../pages/client/Payments/Payments';
// import ProfileSettings from '../pages/client/ProfileSettings/ProfileSettings';
// import Notifications from '../pages/client/Notifications/Notifications';
// import ClientSettings from '../pages/client/Settings/Settings';

// Temporary placeholder components
const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        هذه الصفحة قيد التطوير...
      </p>
    </div>
  </div>
);

const ClientRoutes = () => {
  const { userProfile, loading } = useClientAuth();

  console.log('ClientRoutes - loading:', loading, 'userProfile:', userProfile);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated or not a client
  if (!userProfile || userProfile.user_type !== 'client') {
    console.log('Redirecting to login - userProfile:', userProfile);
    return <Navigate to="/login" replace />;
  }

  return (
    <ClientLayout>
      <Routes>
        {/* Dashboard */}
        <Route path="dashboard" element={<ClientDashboard />} />
        
        {/* Search and Discovery */}
        <Route path="search-lawyers" element={<SearchLawyers />} />
        <Route path="lawyer/:lawyerId" element={<LawyerProfile />} />
        
        {/* Appointments */}
        <Route path="book-appointment/:lawyerId" element={<BookAppointment />} />
        <Route path="appointments" element={<Appointments />} />
        
        {/* Cases */}
        <Route path="create-case" element={<CreateCase />} />
        <Route path="cases" element={<MyCases />} />
        <Route path="cases/:caseId" element={<CaseDetails />} />
        
        {/* Communication */}
        <Route path="messages" element={<PlaceholderPage title="الرسائل" />} />
        <Route path="video-call/:sessionId" element={<PlaceholderPage title="مكالمة فيديو" />} />
        
        {/* AI Features */}
        <Route path="document-analyzer" element={<PlaceholderPage title="تحليل المستندات" />} />
        <Route path="ai-chatbot" element={<PlaceholderPage title="المساعد الذكي" />} />
        
        {/* Payments and Profile */}
        <Route path="payments" element={<PlaceholderPage title="المدفوعات" />} />
        <Route path="profile-settings" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Redirect root client path to dashboard */}
        <Route path="" element={<Navigate to="dashboard" replace />} />
        
        {/* Catch all route - redirect to dashboard */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </ClientLayout>
  );
};

export default ClientRoutes;
