import React, { useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import { Clock, User, MapPin, Video, Check, X, Calendar } from 'lucide-react';

const AppointmentsList = ({ appointments }) => {
  const [updating, setUpdating] = useState(null);

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'confirmed': { label: 'مؤكد', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      'completed': { label: 'مكتمل', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      'cancelled': { label: 'ملغي', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    };
    return statusMap[status] || statusMap['pending'];
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    setUpdating(appointmentId);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Update status error:', error.message);
      alert('حدث خطأ أثناء تحديث الموعد');
    } finally {
      setUpdating(null);
    }
  };

  if (appointments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow p-8 sm:p-12 text-center">
        <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
          لا توجد مواعيد
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          لا توجد مواعيد محجوزة حالياً
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {appointments.map((appointment) => {
        const statusInfo = getStatusBadge(appointment.status);
        const isUpdating = updating === appointment.id;

        return (
          <div
            key={appointment.id}
            className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Appointment Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    {appointment.title || 'استشارة قانونية'}
                  </h3>
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  {appointment.client_name && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-300">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <span>{appointment.client_name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-300">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    <span>{formatDateTime(appointment.starts_at)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-300">
                    {appointment.meeting_type === 'online' ? (
                      <>
                        <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                        <span>عبر الإنترنت</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                        <span>شخصي</span>
                      </>
                    )}
                  </div>

                  {appointment.duration && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-300">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <span>{appointment.duration} دقيقة</span>
                    </div>
                  )}
                </div>

                {appointment.notes && (
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {appointment.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              {appointment.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                    disabled={isUpdating}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-xs sm:text-sm touch-manipulation"
                  >
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    قبول
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                    disabled={isUpdating}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-xs sm:text-sm touch-manipulation"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    رفض
                  </button>
                </div>
              )}

              {appointment.status === 'confirmed' && (
                <button
                  onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                  disabled={isUpdating}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-xs sm:text-sm touch-manipulation"
                >
                  تحديد كمكتمل
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AppointmentsList;
