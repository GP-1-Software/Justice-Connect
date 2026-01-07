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
  const [cases, setCases] = useState([]);
  const [workingHours, setWorkingHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    async function loadCalendarData() {
      if (!lawyer) return;
      setLoading(true);
      try {
        // Load appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('lawyer_id', lawyer.lawyer_id)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (appointmentsError) throw appointmentsError;
        if (mounted) setAppointments(appointmentsData || []);

        // Load cases with next hearing dates
        const { data: casesData, error: casesError } = await supabase
          .from('cases')
          .select('case_id, title, next_hearing_date, court_name, status')
          .eq('assigned_lawyer_id', lawyer.lawyer_id)
          .not('next_hearing_date', 'is', null)
          .in('status', ['active', 'in_progress']);

        if (casesError) throw casesError;
        if (mounted) setCases(casesData || []);

        // Load working hours
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('lawyer_availability')
          .select('schedule')
          .eq('lawyer_id', lawyer.lawyer_id)
          .single();

        if (!availabilityError && availabilityData) {
          if (mounted) setWorkingHours(availabilityData.schedule);
        }
      } catch (error) {
        console.warn('Calendar data load error:', error.message);
        if (mounted) {
          setAppointments([]);
          setCases([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCalendarData();

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
    <div className="space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              التقويم والمواعيد
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              إدارة مواعيدك واستشاراتك
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition text-xs sm:text-sm touch-manipulation"
          >
            اليوم
          </button>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm transition touch-manipulation ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm transition touch-manipulation ${
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
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition touch-manipulation"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition touch-manipulation"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <AppointmentFilters statusFilter={statusFilter} onStatusChange={setStatusFilter} />

      {/* Calendar or List View */}
      {loading ? (
        <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm">جاري التحميل...</p>
        </div>
      ) : viewMode === 'month' ? (
        <CalendarView 
          currentDate={currentDate} 
          appointments={filteredAppointments}
          cases={cases}
          workingHours={workingHours}
        />
      ) : (
        <AppointmentsList appointments={filteredAppointments} />
      )}
    </div>
  );
};

export default Calendar;
