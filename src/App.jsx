import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import Signup from './pages/Signup';
import Login from './pages/Login';
import AdminVerification from './pages/AdminVerification';
import PendingVerification from './pages/PendingVerification';
import AdminDashboard from './pages/AdminDashboard';
import AdminCasesManagement from './pages/AdminCasesManagement';
import DeletionRequests from './pages/admin/DeletionRequests';
import SystemAI from './pages/admin/SystemAI';
import Analytics from './pages/admin/Analytics';
import CasesManagement from './pages/admin/CasesManagement';
import AppointmentsManagement from './pages/admin/AppointmentsManagement';
import PaymentsManagement from './pages/admin/PaymentsManagement';
import SupportTickets from './pages/SupportTickets';
import LegislationPage from './pages/LegislationPage';
import LawyerRoutes from './routes/lawyerRoutes';
import ClientRoutes from './routes/clientRoutes';
import CourtClerkRoutes from './routes/courtClerkRoutes';
import { LawyerAuthProvider } from './hooks/useLawyerAuth.jsx';
import { ClientAuthProvider } from './hooks/useClientAuth.jsx';
import BanListener from './components/BanListener';


// Import ThemeProvider
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Provide both auth contexts so nested routes can consume without error */}
      <ClientAuthProvider>
        <LawyerAuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/verification" element={<AdminVerification />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/cases-management" element={<AdminCasesManagement />} />
            <Route path="/admin/cases" element={<CasesManagement />} />
            <Route path="/admin/deletion-requests" element={<DeletionRequests />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/appointments" element={<AppointmentsManagement />} />
            <Route path="/admin/payments" element={<PaymentsManagement />} />
            <Route path="/admin/system-ai" element={<SystemAI />} />
            <Route path="/pending-verification" element={<PendingVerification />} />
            <Route path="/support" element={<SupportTickets />} />
            <Route path="/legislation" element={<LegislationPage />} />
            {/* Court Clerk protected area */}
            <Route path="/court-clerk/*" element={<CourtClerkRoutes />} />
            {/* Client protected area */}
            <Route path="/client/*" element={<ClientRoutes />} />
            {/* Lawyer protected area */}
            <Route path="/*" element={<LawyerRoutes />} />
          </Routes>
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              // Define default options
              className: '',
              duration: 4000,
              style: {
                background: '#06B6D4',
                color: '#FFFFFF',
                fontFamily: 'Cairo, sans-serif',
                direction: 'rtl',
              },
              // Default options for specific types
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
            }}
          />
          {/* Real-time Ban Listener */}
          <BanListener />
        </LawyerAuthProvider>
      </ClientAuthProvider>
    </ThemeProvider>
  );
}

export default App;
