import React from 'react';
import CalendarPreview from './components/CalendarPreview';
import TodayAppointmentsList from './components/TodayAppointmentsList';
import CasesAssigned from './components/CasesAssigned';
import QuickRevenue from './components/QuickRevenue';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CalendarPreview />
        </div>
        <div>
          <QuickRevenue />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <TodayAppointmentsList />
        <CasesAssigned />
      </div>
    </div>
  );
};

export default Dashboard;


