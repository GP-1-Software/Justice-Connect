import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Video,
  Building,
  FileText,
  DollarSign,
  AlertCircle
} from 'lucide-react';

const AppointmentDetailsModal = ({ appointment, onClose, onUpdateStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState(appointment.status);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!appointment) return null;

  const statuses = [
    { value: 'pending', label: 'معلق' },
    { value: 'confirmed', label: 'مؤكد' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' },
    { value: 'rescheduled', label: 'معاد جدولته' }
  ];

  const handleUpdateStatus = async () => {
    if (selectedStatus === appointment.status) return;
    
    setIsUpdating(true);
    try {
      await onUpdateStatus(
        appointment.id, 
        selectedStatus,
        selectedStatus === 'cancelled' ? rejectionReason : null
      );
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

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

  // Meeting method icon
  const getMeetingMethodIcon = () => {
    switch (appointment.meeting_method) {
      case 'video_call':
        return <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'phone_call':
        return <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'in_person':
        return <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getMeetingMethodLabel = () => {
    switch (appointment.meeting_method) {
      case 'video_call':
        return 'مكالمة فيديو';
      case 'phone_call':
        return 'مكالمة هاتفية';
      case 'in_person':
        return 'لقاء شخصي';
      default:
        return appointment.meeting_method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 sm:p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {appointment.appointment_type || 'موعد'}
              </h2>
              {appointment.appointment_number && (
                <p className="text-sm text-blue-100">رقم الموعد: {appointment.appointment_number}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition flex-shrink-0"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Update Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              تحديث حالة الموعد
            </h3>
            <div className="space-y-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              
              {selectedStatus === 'cancelled' && (
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="سبب الإلغاء (اختياري)"
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}
              
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating || selectedStatus === appointment.status}
                className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isUpdating ? 'جاري التحديث...' : 'تحديث الحالة'}
              </button>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              تفاصيل الموعد
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">التاريخ</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatDate(appointment.appointment_date)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الوقت</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatTime(appointment.appointment_time)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المدة</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {appointment.duration_minutes || 60} دقيقة
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">طريقة اللقاء</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {getMeetingMethodIcon()}
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {getMeetingMethodLabel()}
                  </p>
                </div>
              </div>
              {appointment.price && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">السعر</p>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {appointment.price} ₪
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Client and Lawyer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Information */}
            {appointment.client && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    معلومات العميل
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">الاسم: </span>
                    <span className="text-gray-900 dark:text-white">
                      {appointment.client.first_name} {appointment.client.last_name}
                    </span>
                  </p>
                  {appointment.client.id_number && (
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">رقم الهوية: </span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {appointment.client.id_number}
                      </span>
                    </p>
                  )}
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{appointment.client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{appointment.client.phone}</span>
                  </div>
                  {appointment.client.city && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white">{appointment.client.city}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lawyer Information */}
            {appointment.lawyer && (
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    معلومات المحامي
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">الاسم: </span>
                    <span className="text-gray-900 dark:text-white">
                      {appointment.lawyer.first_name} {appointment.lawyer.last_name}
                    </span>
                  </p>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{appointment.lawyer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{appointment.lawyer.phone}</span>
                  </div>
                  {appointment.lawyer.specialization && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {appointment.lawyer.specialization.map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Case Information */}
          {appointment.case && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  القضية المرتبطة
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {appointment.case.title}
                </p>
                {appointment.case.case_number && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    رقم القضية: {appointment.case.case_number}
                  </p>
                )}
                {appointment.case.case_type && (
                  <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-xs font-medium">
                    {appointment.case.case_type}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                ملاحظات
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Rejection Reason */}
          {appointment.rejection_reason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  سبب الإلغاء
                </h3>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {appointment.rejection_reason}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;
