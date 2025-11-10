import React, { useState, useEffect } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { Video, Plus, Calendar, Clock, X, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { createMeeting, getMeetingByCase, deleteMeeting, updateMeetingStatus, isMeetingEnded } from '../../../../services/meetingApi';
import MeetingCard from '../../../../components/shared/MeetingCard';
import { createTimelineEvent } from '../../../../services/caseApi';

const MeetingManager = ({ caseId, caseData, onTimelineEventAdded }) => {
  const { lawyer } = useLawyerAuth();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (caseId) {
      loadMeeting();
    }
  }, [caseId]);

  const loadMeeting = async () => {
    try {
      const meetingData = await getMeetingByCase(caseId);
      if (meetingData) {
        // Check if meeting has ended before setting it to state
        if (isMeetingEnded(meetingData)) {
       //   console.log('🕐 Meeting loaded but already ended, not displaying');
          setMeeting(null);
        } else {
          setMeeting(meetingData);
        }
      } else {
        setMeeting(null);
      }
    } catch (error) {
      console.error('Error loading meeting:', error);
      setMeeting(null);
    }
  };

  const handleCreateMeeting = async () => {
    if (!lawyer || !caseId || !meetingDate || !meetingTime) {
      alert('يرجى إدخال تاريخ ووقت الاجتماع');
      return;
    }

    setLoading(true);
    try {
      const newMeeting = await createMeeting({
        meeting_type: 'case',
        related_case_id: parseInt(caseId),
        scheduled_date: meetingDate,
        scheduled_time: meetingTime,
        created_by_role: 'lawyer',
        created_by_id: lawyer.lawyer_id,
        meeting_status: 'confirmed'
      });

      setMeeting(newMeeting);
      setShowCreateForm(false);
      setMeetingDate('');
      setMeetingTime('');

      // Create timeline event
      try {
        const timelineEvent = await createTimelineEvent({
          case_id: parseInt(caseId),
          event_type: 'meeting_created',
          author_id: lawyer.lawyer_id,
          author_type: 'lawyer',
          title: 'تم إنشاء مكالمة فيديو',
          description: `تم إنشاء مكالمة فيديو بتاريخ ${meetingDate} في الساعة ${meetingTime}`,
          visibility: 'all'
        });

        if (onTimelineEventAdded && timelineEvent) {
          onTimelineEventAdded(timelineEvent);
        }
      } catch (timelineError) {
        console.error('Error creating timeline event:', timelineError);
        // Don't fail the meeting creation if timeline fails
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('حدث خطأ في إنشاء الاجتماع');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = (meeting) => {
    window.open(meeting.meeting_link, '_blank');
  };

  const handleDeleteMeeting = async () => {
    if (!meeting || !lawyer) return;

    setDeleting(true);
    try {
      await deleteMeeting(meeting.meeting_id);
      setMeeting(null);
      setShowDeleteConfirm(false);

      // Create timeline event
      try {
        const timelineEvent = await createTimelineEvent({
          case_id: parseInt(caseId),
          event_type: 'meeting_deleted',
          author_id: lawyer.lawyer_id,
          author_type: 'lawyer',
          title: 'تم حذف مكالمة فيديو',
          description: 'تم حذف مكالمة الفيديو من قبل المحامي',
          visibility: 'all'
        });

        if (onTimelineEventAdded && timelineEvent) {
          onTimelineEventAdded(timelineEvent);
        }
      } catch (timelineError) {
        console.error('Error creating timeline event:', timelineError);
        // Don't fail the meeting deletion if timeline fails
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      alert('حدث خطأ في حذف الاجتماع');
    } finally {
      setDeleting(false);
    }
  };

  const handleEndMeeting = async () => {
    if (!meeting || !lawyer) return;

    setEnding(true);
    try {
      // Update meeting status to completed
      await updateMeetingStatus(meeting.meeting_id, 'completed', {
        ended_at: new Date().toISOString()
      });

      // Clear the meeting from state to show create form again
      setMeeting(null);
      setShowEndConfirm(false);

      // Create timeline event
      try {
        const timelineEvent = await createTimelineEvent({
          case_id: parseInt(caseId),
          event_type: 'meeting_completed',
          author_id: lawyer.lawyer_id,
          author_type: 'lawyer',
          title: 'تم إنهاء مكالمة فيديو',
          description: 'تم إنهاء مكالمة الفيديو من قبل المحامي',
          visibility: 'all'
        });

        if (onTimelineEventAdded && timelineEvent) {
          onTimelineEventAdded(timelineEvent);
        }
      } catch (timelineError) {
        console.error('Error creating timeline event:', timelineError);
        // Don't fail the meeting completion if timeline fails
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
      alert('حدث خطأ في إنهاء الاجتماع');
    } finally {
      setEnding(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!caseId) return;

    const channel = supabase
      .channel(`lawyer-case-meetings-${caseId}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'meetings',
          filter: `related_case_id=eq.${caseId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            // Check if newly created meeting has already ended
            if (!isMeetingEnded(payload.new)) {
              setMeeting(payload.new);
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Check if updated meeting has ended or is completed/cancelled
            if (isMeetingEnded(payload.new)) {
              setMeeting(null);
            } else {
              setMeeting(payload.new);
            }
          } else if (payload.eventType === 'DELETE') {
            setMeeting(null);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [caseId]);

  // Check if meeting has ended based on time - auto cleanup
  useEffect(() => {
    if (!meeting) return;

    // Check if meeting has ended based on time
    const checkMeetingEnd = () => {
      if (isMeetingEnded(meeting)) {
        console.log('🕐 Meeting has ended automatically based on time');
        // Clear meeting from state to show create form again
        setMeeting(null);
      }
    };

    // Check immediately
    checkMeetingEnd();

    // Check every 30 seconds
    const interval = setInterval(checkMeetingEnd, 30000);

    return () => clearInterval(interval);
  }, [meeting]);

  if (!caseData || (caseData.status !== 'active' && caseData.status !== 'in_progress')) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            مكالمة فيديو
          </h3>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          {meeting && meeting.meeting_status === 'confirmed' && (
            <>
              <button
                onClick={() => setShowEndConfirm(true)}
                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                title="إنهاء الاجتماع"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                title="حذف الاجتماع"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          {!meeting && !showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>إنشاء اجتماع</span>
            </button>
          )}
        </div>
      </div>

      {showCreateForm && !meeting && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تاريخ الاجتماع
            </label>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              وقت الاجتماع
            </label>
            <div className="relative">
              <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={handleCreateMeeting}
              disabled={loading || !meetingDate || !meetingTime}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء الاجتماع'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setMeetingDate('');
                setMeetingTime('');
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {meeting && (
        <MeetingCard
          meeting={meeting}
          caseData={caseData}
          userType="lawyer"
          onJoinMeeting={handleJoinMeeting}
        />
      )}

      {/* End Meeting Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                تأكيد إنهاء الاجتماع
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              هل أنت متأكد من إنهاء هذا الاجتماع؟ سيتم تحديث حالته إلى "مكتمل" وسيختفي من صفحة العميل.
            </p>

            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={handleEndMeeting}
                disabled={ending}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ending ? 'جاري الإنهاء...' : 'نعم، أنهِ الاجتماع'}
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                disabled={ending}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                تأكيد حذف الاجتماع
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              هل أنت متأكد من حذف هذا الاجتماع؟ سيتم إخفاؤه من صفحة العميل أيضاً ولن يتمكن من الانضمام إليه.
            </p>

            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={handleDeleteMeeting}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'جاري الحذف...' : 'نعم، احذف الاجتماع'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {!meeting && !showCreateForm && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">لا يوجد اجتماع حالياً</p>
          <p className="text-xs mt-1">انقر على "إنشاء اجتماع" لبدء مكالمة فيديو</p>
        </div>
      )}
    </div>
  );
};

export default MeetingManager;

