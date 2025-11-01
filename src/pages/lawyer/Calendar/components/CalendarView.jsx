import React from 'react';

const CalendarView = ({ currentDate, appointments }) => {
  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

  const getAppointmentsForDay = (date) => {
    if (!date) return [];
    return appointments.filter(apt => {
      const aptDate = new Date(apt.starts_at);
      return aptDate.getDate() === date.getDate() &&
             aptDate.getMonth() === date.getMonth() &&
             aptDate.getFullYear() === date.getFullYear();
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-500',
      'confirmed': 'bg-green-500',
      'completed': 'bg-gray-500',
      'cancelled': 'bg-red-500'
    };
    return colors[status] || 'bg-blue-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day, index) => (
          <div key={index} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const dayAppointments = getAppointmentsForDay(date);
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              className={`min-h-24 p-2 rounded-lg border ${
                date
                  ? isTodayDate
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  : 'bg-transparent border-transparent'
              }`}
            >
              {date && (
                <>
                  <div className={`text-sm font-semibold mb-1 ${
                    isTodayDate ? 'text-blue-600' : 'text-gray-900 dark:text-white'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        className={`text-xs px-2 py-1 rounded ${getStatusColor(apt.status)} text-white truncate`}
                        title={apt.client_name || apt.title}
                      >
                        {new Date(apt.starts_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        +{dayAppointments.length - 3} أخرى
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">قيد الانتظار</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">مؤكد</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">مكتمل</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">ملغي</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
