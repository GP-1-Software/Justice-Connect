import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../hooks/useLawyerAuth';
import { supabase } from '../../../supabaseClient';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import CalendarView from './components/CalendarView';
import AppointmentsList from './components/AppointmentsList';
import AppointmentFilters from './components/AppointmentFilters';

const Calendar = () => {
  const { lawyer } = useLawyerAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    async function loadAppointments() {
      if (!lawyer) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('lawyer_id', lawyer.lawyer_id)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (error) throw error;
        if (mounted) setAppointments(data || []);
      } catch (error) {
        console.warn('Appointments load error:', error.message);
        if (mounted) setAppointments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAppointments();

    // Realtime subscription
    const channel = supabase
      .channel('appointments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `lawyer_id=eq.${lawyer?.lawyer_id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAppointments(prev => [...prev, payload.new].sort((a, b) => {
              const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
              const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
              return dateA - dateB;
            }));
          } else if (payload.eventType === 'UPDATE') {
            setAppointments(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
          } else if (payload.eventType === 'DELETE') {
            setAppointments(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [lawyer]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const filteredAppointments = statusFilter === 'all' 
    ? appointments 
    : appointments.filter(a => a.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              التقويم والمواعيد
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              إدارة مواعيدك واستشاراتك
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm"
          >
            اليوم
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
              }`}
            >
              قائمة
            </button>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <AppointmentFilters statusFilter={statusFilter} onStatusChange={setStatusFilter} />

      {/* Calendar or List View */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">جاري التحميل...</p>
        </div>
      ) : viewMode === 'month' ? (
        <CalendarView 
          currentDate={currentDate} 
          appointments={filteredAppointments} 
        />
      ) : (
        <AppointmentsList appointments={filteredAppointments} />
      )}
    </div>
  );
};

export default Calendar;
