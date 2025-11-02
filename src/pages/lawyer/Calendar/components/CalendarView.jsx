import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, XCircle, X, Clock, MapPin, Phone, Video, User as UserIcon } from 'lucide-react';

const CalendarView = ({ currentDate, appointments, cases, workingHours }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
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
      const aptDate = new Date(apt.appointment_date);
      return aptDate.getDate() === date.getDate() &&
             aptDate.getMonth() === date.getMonth() &&
             aptDate.getFullYear() === date.getFullYear();
    });
  };

  const getCourtDatesForDay = (date) => {
    if (!date || !cases) return [];
    return cases.filter(caseItem => {
      if (!caseItem.next_hearing_date) return false;
      const hearingDate = new Date(caseItem.next_hearing_date);
      return hearingDate.getDate() === date.getDate() &&
             hearingDate.getMonth() === date.getMonth() &&
             hearingDate.getFullYear() === date.getFullYear();
    });
  };

  const isDayOff = (date) => {
    if (!date || !workingHours) return false;
    
    // Get day name in English (Sunday = 0, Monday = 1, etc.)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    
    // Check if this day is marked as off in the schedule
    const daySchedule = workingHours[dayName];
    return !daySchedule || !daySchedule.enabled;
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
      'scheduled': 'bg-yellow-500',
      'confirmed': 'bg-blue-500',
      'completed': 'bg-gray-500',
      'cancelled': 'bg-red-500',
      'rescheduled': 'bg-orange-500'
    };
    return colors[status] || 'bg-green-500';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'scheduled': 'مجدول',
      'confirmed': 'مؤكد',
      'completed': 'مكتمل',
      'cancelled': 'ملغي',
      'rescheduled': 'أعيد جدولته'
    };
    return labels[status] || status;
  };

  const getAppointmentTypeLabel = (type) => {
    const labels = {
      'consultation': 'استشارة',
      'case_review': 'مراجعة قضية',
      'document_review': 'مراجعة مستندات'
    };
    return labels[type] || type;
  };

  const getMeetingMethodLabel = (method) => {
    const labels = {
      'in_person': 'شخصي',
      'video_call': 'مكالمة فيديو',
      'phone_call': 'مكالمة هاتفية'
    };
    return labels[method] || method;
  };

  const getMeetingMethodIcon = (method) => {
    const icons = {
      'in_person': MapPin,
      'video_call': Video,
      'phone_call': Phone
    };
    return icons[method] || MapPin;
  };

  const handleDayClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  const selectedDayAppointments = selectedDate ? getAppointmentsForDay(selectedDate) : [];
  const selectedDayCourtDates = selectedDate ? getCourtDatesForDay(selectedDate) : [];
  const isSelectedDayOff = selectedDate ? isDayOff(selectedDate) : false;

  return (
    <>
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
          const courtDates = getCourtDatesForDay(date);
          const isOff = isDayOff(date);
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              onClick={() => handleDayClick(date)}
              className={`min-h-32 p-2 rounded-lg border relative cursor-pointer transition-all hover:shadow-md ${
                date
                  ? isTodayDate
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                    : isOff
                    ? 'bg-gray-100 dark:bg-gray-700/30 border-gray-300 dark:border-gray-600'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  : 'bg-transparent border-transparent cursor-default'
              }`}
            >
              {date && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-sm font-semibold ${
                      isTodayDate ? 'text-blue-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      {date.getDate()}
                    </div>
                    {isOff && (
                      <XCircle className="h-3 w-3 text-gray-400" title="يوم إجازة" />
                    )}
                  </div>
                  <div className="space-y-1">
                    {/* Court Dates - Always show first */}
                    {courtDates.map((courtCase) => (
                      <div
                        key={`court-${courtCase.case_id}`}
                        className="text-xs px-2 py-1 rounded bg-red-600 text-white truncate flex items-center gap-1"
                        title={`جلسة محكمة: ${courtCase.title} - ${courtCase.court_name}`}
                      >
                        <Briefcase className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{courtCase.court_name || 'محكمة'}</span>
                      </div>
                    ))}
                    
                    {/* Appointments */}
                    {dayAppointments.slice(0, isOff ? 2 : 3).map((apt) => (
                      <div
                        key={apt.id}
                        className={`text-xs px-2 py-1 rounded ${getStatusColor(apt.status)} text-white truncate flex items-center gap-1`}
                        title={`${apt.appointment_type} - ${apt.appointment_time}`}
                      >
                        <Users className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{apt.appointment_time?.substring(0, 5)}</span>
                      </div>
                    ))}
                    
                    {/* Show count if more items exist */}
                    {(dayAppointments.length + courtDates.length) > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        +{(dayAppointments.length + courtDates.length) - 3} أخرى
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
          <div className="w-3 h-3 rounded-full bg-red-600 flex items-center justify-center">
            <Briefcase className="h-2 w-2 text-white" />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">جلسة محكمة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
            <Users className="h-2 w-2 text-white" />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">موعد خدمة</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400">يوم إجازة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">قيد الانتظار</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">مؤكد</span>
        </div>
      </div>
    </div>

    {/* Day Details Modal */}
    {showModal && selectedDate && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              {isSelectedDayOff && (
                <div className="flex items-center gap-2 mt-2">
                  <XCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">يوم إجازة</span>
                </div>
              )}
            </div>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Court Dates Section */}
            {selectedDayCourtDates.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-red-600" />
                  جلسات المحكمة ({selectedDayCourtDates.length})
                </h3>
                <div className="space-y-3">
                  {selectedDayCourtDates.map((courtCase) => (
                    <div 
                      key={`court-${courtCase.case_id}`} 
                      onClick={() => navigate(`/lawyer/cases/${courtCase.case_id}`)}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 hover:text-red-600 transition-colors">{courtCase.title}</h4>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{courtCase.court_name || 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-red-600 text-white rounded">قضية #{courtCase.case_id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appointments Section */}
            {selectedDayAppointments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  المواعيد ({selectedDayAppointments.length})
                </h3>
                <div className="space-y-3">
                  {selectedDayAppointments.map((apt) => {
                    const MeetingIcon = getMeetingMethodIcon(apt.meeting_method);
                    return (
                      <div key={apt.id} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(apt.status)} text-white`}>
                                {getStatusLabel(apt.status)}
                              </span>
                              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                                {getAppointmentTypeLabel(apt.appointment_type)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">{apt.appointment_time?.substring(0, 5)}</span>
                            <span className="text-gray-400">({apt.duration_minutes} دقيقة)</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MeetingIcon className="h-4 w-4 text-gray-400" />
                            <span>{getMeetingMethodLabel(apt.meeting_method)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span>معرف العميل: {apt.client_id}</span>
                          </div>

                          {apt.price && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <span className="font-semibold text-green-600 dark:text-green-400">{apt.price} ر.س</span>
                            </div>
                          )}

                          {apt.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <p className="text-xs text-gray-500 dark:text-gray-400">ملاحظات: {apt.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {selectedDayAppointments.length === 0 && selectedDayCourtDates.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Users className="h-16 w-16 mx-auto mb-2 opacity-50" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {isSelectedDayOff ? 'يوم إجازة - لا توجد مواعيد' : 'لا توجد مواعيد في هذا اليوم'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default CalendarView;
