import React, { useState, useEffect } from 'react';
import { Video, Clock, Copy, Check, ExternalLink, Calendar, User } from 'lucide-react';
import { isMeetingTimeReady, isMeetingEnded } from '../../services/meetingApi';

const MeetingCard = ({ meeting, appointment, caseData, userType, onJoinMeeting }) => {
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    if (!meeting) {
      setIsReady(false);
      setHasEnded(false);
      return;
    }

    // Check if meeting time is ready and if it has ended
    const checkTime = () => {
      setIsReady(isMeetingTimeReady(meeting));
      setHasEnded(isMeetingEnded(meeting, appointment));
    };
    
    // Check immediately
    checkTime();
    
    // Check every 5 seconds for more responsive updates
    const interval = setInterval(checkTime, 5000);
    
    return () => clearInterval(interval);
  }, [meeting, appointment]);

  // Don't render if meeting has ended (time-based) or is completed/cancelled
  if (hasEnded || meeting.meeting_status === 'completed' || meeting.meeting_status === 'cancelled') {
    return null;
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meeting.meeting_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('فشل نسخ الرابط');
    }
  };

  const handleJoinMeeting = () => {
    if (onJoinMeeting) {
      onJoinMeeting(meeting);
    } else {
      window.open(meeting.meeting_link, '_blank');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'قيد الانتظار',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
      },
      confirmed: {
        label: 'مؤكد',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        borderColor: 'border-green-200 dark:border-green-800'
      },
      completed: {
        label: 'مكتمل',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        borderColor: 'border-gray-200 dark:border-gray-700'
      },
      cancelled: {
        label: 'ملغى',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800'
      }
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(meeting.meeting_status);

  // Get meeting date and time
  const meetingDate = meeting.scheduled_date || (appointment?.appointment_date) || null;
  const meetingTime = meeting.scheduled_time || (appointment?.appointment_time) || null;

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 border-r-4 ${statusConfig.borderColor}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              مكالمة فيديو
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {meeting.meeting_type === 'appointment' ? 'موعد استشارة' : 'مكالمة قضية'}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Meeting Details */}
      <div className="space-y-3 mb-4">
        {meetingDate && (
          <div className="flex items-center space-x-2 space-x-reverse text-gray-700 dark:text-gray-300">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">
              {new Date(meetingDate).toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                calendar: 'gregory'
              })}
            </span>
          </div>
        )}

        {meetingTime && (
          <div className="flex items-center space-x-2 space-x-reverse text-gray-700 dark:text-gray-300">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">{meetingTime}</span>
          </div>
        )}

        {appointment?.lawyers && (
          <div className="flex items-center space-x-2 space-x-reverse text-gray-700 dark:text-gray-300">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm">
              {appointment.lawyers.first_name} {appointment.lawyers.last_name}
            </span>
          </div>
        )}

        {caseData && (
          <div className="flex items-center space-x-2 space-x-reverse text-gray-700 dark:text-gray-300">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm">قضية: {caseData.title || caseData.case_number}</span>
          </div>
        )}
      </div>

      {/* Meeting Link */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">رابط الاجتماع:</p>
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1 space-x-reverse text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span className="text-xs">تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="text-xs">نسخ الرابط</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-800 dark:text-gray-200 font-mono break-all">
          {meeting.meeting_link}
        </p>
      </div>

      {/* Join Button */}
      {meeting.meeting_status === 'confirmed' && (
        <div className="space-y-2">
          {!isReady && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-300 text-center">
              ⏰ سيتم تفعيل الزر عند اقتراب وقت الاجتماع (5 دقائق قبل الموعد)
            </p>
          </div>
          )}
          
          <button
            onClick={handleJoinMeeting}
            disabled={!isReady}
            className={`w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 rounded-lg font-medium transition-all ${
              isReady
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <Video className="h-5 w-5" />
            <span>انضم إلى المكالمة</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      )}

      {meeting.meeting_status === 'completed' && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            تمت المكالمة بنجاح
          </p>
        </div>
      )}

      {meeting.meeting_status === 'cancelled' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            تم إلغاء المكالمة
          </p>
        </div>
      )}
    </div>
  );
};

export default MeetingCard;

