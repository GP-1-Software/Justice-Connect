import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LawyerLayout from '../layouts/LawyerLayout';
import DashboardPage from '../pages/lawyer/Dashboard/Dashboard';
import CasesListPage from '../pages/lawyer/Cases/CasesList';
import CaseDetailPage from '../pages/lawyer/CaseDetail/CaseDetail';
import CalendarPage from '../pages/lawyer/Calendar/Calendar';
import ProfilePage from '../pages/lawyer/Profile/Profile';

const LawyerRoutes = () => {
  return (
    <Routes>
      <Route path="/lawyer" element={<LawyerLayout />}> 
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="cases" element={<CasesListPage />} />
        <Route path="cases/:caseId" element={<CaseDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
};

export default LawyerRoutes;


