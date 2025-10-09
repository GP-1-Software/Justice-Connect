import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LawyerLayout from '../layouts/LawyerLayout';
import DashboardPage from '../pages/lawyer/Dashboard/Dashboard';
const CasesListPage = () => <div>...</div>;
const CaseDetailPage = () => <div>...</div>;
const CalendarPage = () => <div>...</div>;
const ProfilePage = () => <div>...</div>;

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


