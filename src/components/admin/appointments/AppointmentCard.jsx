import React from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Briefcase, 
  MapPin,
  Video,
  Phone,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  DollarSign
} from 'lucide-react';

const AppointmentCard = ({ appointment, onClick }) => {
  // Status colors and icons
  const statusConfig = {
    pending: {
      color: 'yellow',
      icon: AlertCircle,
      label: 'معلق',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
    },
    confirmed: {
      color: 'blue',
      icon: CheckCircle,
      label: 'مؤكد',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
    },
    completed: {
      color: 'green',
      icon: CheckCircle,
      label: 'مكتمل',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    },
    cancelled: {
      color: 'red',
      icon: XCircle,
      label: 'ملغي',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    },
    rescheduled: {
      color: 'purple',
      icon: RefreshCw,
      label: 'معاد جدولته',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-400',
      badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
    }
  };

  // Meeting method icons
  const meetingMethodIcons = {
    'video_call': Video,
    'phone_call': Phone,
    'in_person': Building
  };

  const status = statusConfig[appointment.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const MeetingIcon = meetingMethodIcons[appointment.meeting_method] || Building;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'مساءً' : 'صباحاً';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Check if appointment is today
  const isToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointment.appointment_date === today;
  };

  // Check if appointment is upcoming (within 24 hours)
  const isUpcoming = () => {
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const now = new Date();
    const diff = appointmentDateTime - now;
    const hours = diff / (1000 * 60 * 60);
    return hours > 0 && hours <= 24;
  };

  return (
    <div
      onClick={onClick}
      className={`${status.bg} border ${status.border} rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] relative overflow-hidden`}
    >
      {/* Today/Upcoming Badge */}
      {isToday() && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
          اليوم
        </div>
      )}
      {!isToday() && isUpcoming() && (
        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          قريباً
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 space-x-reverse flex-1 min-w-0">
          <div className={`p-2 sm:p-3 ${status.badge} rounded-lg flex-shrink-0`}>
            <Calendar className={`h-5 w-5 sm:h-6 sm:w-6 ${status.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">
              {appointment.appointment_type || 'استشارة قانونية'}
            </h3>
            {appointment.appointment_number && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                رقم الموعد: {appointment.appointment_number}
              </p>
            )}
          </div>
        </div>
        
        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${status.badge} flex items-center space-x-1 space-x-reverse flex-shrink-0 mr-2`}>
          <StatusIcon className="h-3 w-3" />
          <span>{status.label}</span>
        </span>
      </div>

      {/* Date and Time */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center space-x-2 space-x-reverse text-sm">
          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {formatDate(appointment.appointment_date)}
          </span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse text-sm">
          <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {formatTime(appointment.appointment_time)}
            {appointment.duration_minutes && ` (${appointment.duration_minutes} دقيقة)`}
          </span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse text-sm">
          <MeetingIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300">
            {appointment.meeting_method === 'video_call' ? 'مكالمة فيديو' :
             appointment.meeting_method === 'phone_call' ? 'مكالمة هاتفية' :
             'لقاء شخصي'}
          </span>
        </div>
      </div>

      {/* Client and Lawyer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Client */}
        {appointment.client && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">العميل</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {appointment.client.first_name} {appointment.client.last_name}
              </p>
            </div>
          </div>
        )}

        {/* Lawyer */}
        {appointment.lawyer && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
              <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">المحامي</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {appointment.lawyer.first_name} {appointment.lawyer.last_name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Case Info */}
      {appointment.case && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">القضية المرتبطة</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {appointment.case.title}
          </p>
          {appointment.case.case_number && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {appointment.case.case_number}
            </p>
          )}
        </div>
      )}

      {/* Footer - Price */}
      {appointment.price && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 space-x-reverse text-sm">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-gray-600 dark:text-gray-400">السعر:</span>
          </div>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {appointment.price} ₪
          </span>
        </div>
      )}

      {/* Notes Preview */}
      {appointment.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {appointment.notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
