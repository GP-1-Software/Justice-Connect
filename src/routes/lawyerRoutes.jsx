import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LawyerLayout from '../layouts/LawyerLayout';
import DashboardPage from '../pages/lawyer/Dashboard/Dashboard';
import CasesListPage from '../pages/lawyer/Cases/CasesList';
import CaseDetailPage from '../pages/lawyer/CaseDetail/CaseDetail';
import CalendarPage from '../pages/lawyer/Calendar/Calendar';
import AppointmentsPage from '../pages/lawyer/Appointments/Appointments';
import ProfilePage from '../pages/lawyer/Profile/Profile';
import SettingsPage from '../pages/lawyer/Settings';
import JusticeAIChat from '../pages/lawyer/JusticeAI/JusticeAIChat';
import LawyerInvoices from '../pages/lawyer/LawyerInvoices';
import CreateInvoice from '../pages/lawyer/CreateInvoice';
import InvoiceDetails from '../pages/lawyer/InvoiceDetails';
import SupportTickets from '../pages/SupportTickets';
import LawyerMessages from '../pages/lawyer/LawyerMessages';
import NotificationsPage from '../pages/NotificationsPage';
import FileCaseLawyer from '../pages/lawyer/FileCaseLawyer';

const LawyerRoutes = () => {
  return (
    <Routes>
      <Route path="/lawyer" element={<LawyerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="cases" element={<CasesListPage />} />
        <Route path="cases/:caseId" element={<CaseDetailPage />} />
        <Route path="file-case" element={<FileCaseLawyer />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="appointments/:appointmentId" element={<AppointmentsPage />} />
        <Route path="invoices" element={<LawyerInvoices />} />
        <Route path="invoices/create" element={<CreateInvoice />} />
        <Route path="invoices/:invoiceId" element={<InvoiceDetails />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="justice-ai" element={<JusticeAIChat />} />
        <Route path="support" element={<SupportTickets />} />
        <Route path="messages" element={<LawyerMessages />} />
      </Route>
    </Routes>
  );
};

export default LawyerRoutes;


