import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Signup from './pages/Signup';
import Login from './pages/Login';
import QuickConsultation from './pages/QuickConsultation';
import AdminVerification from './pages/AdminVerification';
import PendingVerification from './pages/PendingVerification';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/quick-consultation" element={<QuickConsultation />} />
        <Route path="/admin/verification" element={<AdminVerification />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/pending-verification" element={<PendingVerification />} />
      </Routes>
    </div>
  );
}

export default App;
