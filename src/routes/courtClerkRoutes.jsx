// ============================================
// Court Clerk Routes Configuration
// ============================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CourtClerkDashboard from '../pages/court_clerk/Dashboard';
import CourtClerkInbox from '../pages/court_clerk/Inbox';
import FilingReview from '../pages/court_clerk/FilingReview';
import CaseRegistration from '../pages/court_clerk/CaseRegistration';
import HearingsManagement from '../pages/court_clerk/HearingsManagement';
import DecisionsManagement from '../pages/court_clerk/DecisionsManagement';
import ServicesManagement from '../pages/court_clerk/ServicesManagement';
import CasesManagement from '../pages/court_clerk/CasesManagement';

const CourtClerkRoutes = () => {
    // Check if user is court_clerk
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user || user.user_type !== 'court_clerk') {
        return <Navigate to="/login" replace />;
    }

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/court-clerk/dashboard" replace />} />
            <Route path="/dashboard" element={<CourtClerkDashboard />} />
            <Route path="/inbox" element={<CourtClerkInbox />} />
            <Route path="/filings/:filing_id" element={<FilingReview />} />
            <Route path="/registration" element={<CaseRegistration />} />
            <Route path="/hearings" element={<HearingsManagement />} />
            <Route path="/decisions" element={<DecisionsManagement />} />
            <Route path="/services" element={<ServicesManagement />} />
            <Route path="/cases" element={<CasesManagement />} />
        </Routes>
    );
};

export default CourtClerkRoutes;
