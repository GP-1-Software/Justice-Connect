import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Video,
  MapPin,
  FileText,
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Ban,
  TrendingUp,
  CheckSquare,
  Clock3,
  MessageSquare,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import { useLawyerAuth } from '../../../hooks/useLawyerAuth';
import { getLawyerAppointments, updateLawyerAppointmentStatus, getLawyerAppointmentStats } from '../../../services/lawyerAppointmentApi';
import { getMeetingByAppointment, updateMeetingStatus, isMeetingTimeReady } from '../../../services/meetingApi';
import MeetingCard from '../../../components/shared/MeetingCard';
import ClientInfoModal from './components/ClientInfoModal';
import { supabase } from '../../../supabaseClient';

const Appointments = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const { lawyer } = useLawyerAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, confirmed, all
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [meetings, setMeetings] = useState({});
  const [meetingsReady, setMeetingsReady] = useState({});
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0
  });
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [appointmentToReject, setAppointmentToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showEndMeetingModal, setShowEndMeetingModal] = useState(false);
  const [meetingToEnd, setMeetingToEnd] = useState(null);
  const [endingMeeting, setEndingMeeting] = useState(false);
  const [showClientInfoModal, setShowClientInfoModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Track if we've already handled the appointmentId to prevent loops
  const handledAppointmentId = useRef(null);

  // Handle appointmentId from URL - just navigate to appointments list
  useEffect(() => {
    if (appointmentId && handledAppointmentId.current !== appointmentId) {
      handledAppointmentId.current = appointmentId;
      // Simply navigate to appointments list page without opening modal
      navigate('/lawyer/appointments', { replace: true });
    }
  }, [appointmentId, navigate]);

  // Trigger filtering animation
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, selectedMethod, activeTab]);

  // Check meeting readiness periodically
  useEffect(() => {
    const checkMeetingsReadiness = () => {
      const readyState = {};
      Object.entries(meetings).forEach(([appointmentId, meeting]) => {
        if (meeting && meeting.meeting_status === 'confirmed') {
          readyState[appointmentId] = isMeetingTimeReady(meeting);
        }
      });
      setMeetingsReady(readyState);
    };

    // Check immediately
    checkMeetingsReadiness();

    // Check every 10 seconds
    const interval = setInterval(checkMeetingsReadiness, 10000);

    return () => clearInterval(interval);
  }, [meetings]);

  useEffect(() => {
    if (lawyer?.lawyer_id) {
      fetchAppointments();
      fetchStats();
    }
  }, [lawyer]);

  const fetchAppointments = async () => {
    if (!lawyer?.lawyer_id) {
      setLoading(false);
      return;
    }

    try {
      const data = await getLawyerAppointments(lawyer.lawyer_id);
      setAppointments(data || []);

      // Fetch meetings for confirmed appointments with video_call
      const confirmedVideoAppointments = (data || []).filter(
        apt => apt.status === 'confirmed' && apt.meeting_method === 'video_call'
      );

      const meetingsMap = {};
      for (const apt of confirmedVideoAppointments) {
        try {
          const meeting = await getMeetingByAppointment(apt.id);
          if (meeting) {
            meetingsMap[apt.id] = meeting;
          }
        } catch (error) {
          console.error(`Error fetching meeting for appointment ${apt.id}:`, error);
        }
      }
      setMeetings(meetingsMap);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!lawyer?.lawyer_id) return;
    try {
      const statsData = await getLawyerAppointmentStats(lawyer.lawyer_id);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!lawyer?.lawyer_id) return;

    // Real-time subscription for appointments
    const appointmentsChannel = supabase
      .channel('lawyer-appointments-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `lawyer_id=eq.${lawyer.lawyer_id}`
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new.status === 'confirmed' && payload.new.meeting_method === 'video_call') {
            // Fetch meeting if appointment is confirmed
            try {
              const meeting = await getMeetingByAppointment(payload.new.id);
              if (meeting) {
                setMeetings(prev => ({ ...prev, [payload.new.id]: meeting }));
              }
            } catch (error) {
              console.error('Error fetching meeting:', error);
            }
          }
          // Refresh appointments and stats
          await fetchAppointments();
          await fetchStats();
        }
      )
      .subscribe();

    // Real-time subscription for meetings
    const meetingsChannel = supabase
      .channel('lawyer-meetings-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new?.related_appointment_id) {
            // Check if it belongs to this lawyer
            try {
              const { data: appointment } = await supabase
                .from('appointments')
                .select('id, lawyer_id')
                .eq('id', payload.new.related_appointment_id)
                .eq('lawyer_id', lawyer.lawyer_id)
                .single();

              if (appointment) {
                setMeetings(prev => ({ ...prev, [payload.new.related_appointment_id]: payload.new }));
              }
            } catch (error) {
              console.error('Error checking appointment:', error);
            }
          } else if (payload.eventType === 'UPDATE' && payload.new?.related_appointment_id) {
            try {
              const { data: appointment } = await supabase
                .from('appointments')
                .select('id, lawyer_id')
                .eq('id', payload.new.related_appointment_id)
                .eq('lawyer_id', lawyer.lawyer_id)
                .single();

              if (appointment) {
                setMeetings(prev => ({ ...prev, [payload.new.related_appointment_id]: payload.new }));
              }
            } catch (error) {
              console.error('Error checking appointment:', error);
            }
          } else if (payload.eventType === 'DELETE' && payload.old?.related_appointment_id) {
            setMeetings(prev => {
              const newMeetings = { ...prev };
              delete newMeetings[payload.old.related_appointment_id];
              return newMeetings;
            });
          }
        }
      )
      .subscribe();

    return () => {
      appointmentsChannel.unsubscribe();
      meetingsChannel.unsubscribe();
    };
  }, [lawyer]);

  const handleAcceptAppointment = async (appointmentId) => {
    setProcessing(appointmentId);
    try {
      await updateLawyerAppointmentStatus(appointmentId, 'confirmed', lawyer.lawyer_id);
      await fetchAppointments();
      await fetchStats();
    } catch (error) {
      console.error('Error accepting appointment:', error);
      alert('حدث خطأ في قبول الموعد');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectAppointment = async () => {
    if (!appointmentToReject || !rejectionReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    setProcessing(appointmentToReject.id);
    try {
      await updateLawyerAppointmentStatus(
        appointmentToReject.id,
        'cancelled',
        lawyer.lawyer_id,
        rejectionReason
      );
      setRejectModalOpen(false);
      setAppointmentToReject(null);
      setRejectionReason('');
      await fetchAppointments();
      await fetchStats();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('حدث خطأ في رفض الموعد');
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    setProcessing(appointmentId);
    try {
      await updateLawyerAppointmentStatus(appointmentId, 'completed', lawyer.lawyer_id);
      await fetchAppointments();
      await fetchStats();
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert('حدث خطأ في تحديث الموعد');
    } finally {
      setProcessing(null);
    }
  };

  const handleViewCase = (caseId) => {
    navigate(`/lawyer/cases/${caseId}`);
  };

  const handleViewClientInfo = (client) => {
    setSelectedClient(client);
    setShowClientInfoModal(true);
  };

  const handleJoinMeeting = (meeting) => {
    window.open(meeting.meeting_link, '_blank');
  };

  const handleEndMeeting = async () => {
    if (!meetingToEnd) return;

    setEndingMeeting(true);
    try {
      // Update meeting status to completed
      await updateMeetingStatus(meetingToEnd.meeting_id, 'completed', {
        ended_at: new Date().toISOString()
      });

      // Remove meeting from state
      setMeetings(prev => {
        const newMeetings = { ...prev };
        delete newMeetings[meetingToEnd.related_appointment_id];
        return newMeetings;
      });

      setShowEndMeetingModal(false);
      setMeetingToEnd(null);

      // Optionally update appointment status to completed
      // await handleCompleteAppointment(meetingToEnd.related_appointment_id);
    } catch (error) {
      console.error('Error ending meeting:', error);
      alert('حدث خطأ في إنهاء الاجتماع');
    } finally {
      setEndingMeeting(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'قيد الانتظار',
        icon: AlertTriangle,
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
      },
      confirmed: {
        label: 'مؤكد',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        borderColor: 'border-green-200 dark:border-green-800'
      },
      rejected: {
        label: 'مرفوض',
        icon: XCircle,
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800'
      },
      cancelled_by_lawyer: {
        label: 'ملغى من المحامي',
        icon: XCircle,
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800'
      },
      completed: {
        label: 'مكتمل',
        icon: CheckCircle,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        borderColor: 'border-gray-200 dark:border-gray-700'
      },
      cancelled: {
        label: 'ملغى',
        icon: Ban,
        color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-500',
        borderColor: 'border-gray-200 dark:border-gray-700'
      }
    };
    return configs[status] || configs.pending;
  };

  const getMethodConfig = (method) => {
    const configs = {
      video_call: { label: 'مكالمة فيديو', icon: Video, color: 'text-blue-600 dark:text-blue-400' },
      in_person: { label: 'حضوري', icon: MapPin, color: 'text-green-600 dark:text-green-400' },
      phone_call: { label: 'مكالمة هاتفية', icon: Phone, color: 'text-purple-600 dark:text-purple-400' }
    };
    return configs[method] || configs.video_call;
  };

  // Smart filtering and sorting with useMemo for performance
  const filteredAndSortedAppointments = React.useMemo(() => {
    // Step 1: Filter appointments
    const filtered = appointments.filter(appointment => {
      const clientName = `${appointment.clients?.first_name || ''} ${appointment.clients?.last_name || ''}`.trim();
      const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.appointment_type?.toLowerCase().includes(searchTerm.toLowerCase());

      // Tab filter
      let matchesTab = false;
      if (activeTab === 'pending') {
        matchesTab = appointment.status === 'pending';
      } else if (activeTab === 'confirmed') {
        matchesTab = appointment.status === 'confirmed';
      } else {
        matchesTab = true; // all
      }

      if (!matchesTab) return false;

      // Status filter
      const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;

      // Method filter
      const matchesMethod = selectedMethod === 'all' || appointment.meeting_method === selectedMethod;

      return matchesSearch && matchesStatus && matchesMethod;
    });

    // Step 2: Smart sorting based on action/update time
    const sorted = [...filtered].sort((a, b) => {
      // Priority order for statuses
      const statusPriority = {
        'pending': 1,      // أعلى أولوية للمواعيد قيد التأكيد
        'confirmed': 2,    // ثم المؤكدة
        'completed': 3,    // ثم المكتملة
        'cancelled': 4     // أقل أولوية للملغاة
      };

      const statusA = a.status?.toLowerCase();
      const statusB = b.status?.toLowerCase();

      // Sort by status priority first
      const priorityDiff = (statusPriority[statusA] || 999) - (statusPriority[statusB] || 999);
      if (priorityDiff !== 0) return priorityDiff;

      // Within same status, sort by last update time (most recent action first)
      const getLastActionTime = (apt) => {
        if (apt.updated_at) return new Date(apt.updated_at);
        if (apt.created_at) return new Date(apt.created_at);
        return new Date(`${apt.appointment_date} ${apt.appointment_time}`);
      };

      const lastActionA = getLastActionTime(a);
      const lastActionB = getLastActionTime(b);

      // الأحدث في الـ action أولاً (descending)
      return lastActionB - lastActionA;
    });

    return sorted;
  }, [appointments, activeTab, searchTerm, selectedStatus, selectedMethod]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل المواعيد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            إدارة المواعيد
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
            قم بقبول أو رفض المواعيد وإدارة استشاراتك
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border-r-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">قيد الانتظار</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock3 className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border-r-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">مؤكدة</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.confirmed}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">مكتملة</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border-r-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">ملغاة</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.cancelled}</p>
              </div>
              <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Ban className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border-r-4 border-purple-500 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">مواعيد اليوم</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.today}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">

            {/* Tabs */}
            <div className="flex space-x-1 sm:space-x-2 space-x-reverse bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded-xl p-1 overflow-x-auto">

              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                📋 جميع المواعيد
              </button>

              <button
                onClick={() => setActiveTab('confirmed')}
                className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'confirmed'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                ✅ مؤكدة ({stats.confirmed})
              </button>

              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'pending'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                ⏳ قيد الانتظار ({stats.pending})
              </button>

            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث بالعميل أو النوع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 sm:pl-4 pr-9 sm:pr-10 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center space-x-2 space-x-reverse px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg sm:rounded-xl transition-all relative ${showFilters
                  ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:border-blue-500'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium">فلتر</span>
                {(selectedStatus !== 'all' || selectedMethod !== 'all') && (
                  <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                    {[selectedStatus !== 'all', selectedMethod !== 'all'].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Results count indicator */}
          {(searchTerm || selectedStatus !== 'all' || selectedMethod !== 'all') && (
            <div className="mb-3 flex items-center justify-between animate-slideDown">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {filteredAndSortedAppointments.length}
                  </span>
                  <span>نتيجة</span>
                </div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-500 dark:text-gray-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>مرتبة حسب: الحالة ثم آخر تحديث</span>
                </div>
              </div>
              {(searchTerm || selectedStatus !== 'all' || selectedMethod !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                    setSelectedMethod('all');
                  }}
                  className="flex items-center space-x-1 space-x-reverse text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  <X className="h-3 w-3" />
                  <span>مسح الفلاتر</span>
                </button>
              )}
            </div>
          )}

          {/* Additional Filters */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all ${selectedStatus !== 'all'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="confirmed">مؤكد</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغى</option>
              </select>

              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all ${selectedMethod !== 'all'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <option value="all">جميع الأنواع</option>
                <option value="video_call">مكالمة فيديو</option>
                <option value="in_person">حضوري</option>
                <option value="phone_call">مكالمة هاتفية</option>
              </select>
            </div>
          )}
        </div>

        {/* Filtering indicator */}
        {isFiltering && (
          <div className="flex items-center justify-center py-2 mb-4">
            <div className="flex items-center space-x-2 space-x-reverse text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm font-medium">جاري التحديث...</span>
            </div>
          </div>
        )}

        {/* Appointments List */}
        <div className={`space-y-4 transition-opacity duration-300 ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
          {filteredAndSortedAppointments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
              <Calendar className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد مواعيد
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'pending'
                  ? 'لا توجد مواعيد قيد الانتظار'
                  : activeTab === 'confirmed'
                    ? 'لا توجد مواعيد مؤكدة'
                    : 'لا توجد مواعيد'}
              </p>
            </div>
          ) : (
            filteredAndSortedAppointments.map((appointment) => {
              const statusConfig = getStatusConfig(appointment.status);
              const methodConfig = getMethodConfig(appointment.meeting_method);
              const StatusIcon = statusConfig.icon;
              const MethodIcon = methodConfig.icon;
              const clientName = `${appointment.clients?.first_name || ''} ${appointment.clients?.last_name || ''}`.trim();

              // Calculate time since last update
              const getTimeSinceUpdate = () => {
                const lastUpdate = appointment.updated_at
                  ? new Date(appointment.updated_at)
                  : appointment.created_at
                    ? new Date(appointment.created_at)
                    : null;

                if (!lastUpdate) return null;

                const now = new Date();
                const diffMs = now - lastUpdate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                if (diffMins < 1) return 'الآن';
                if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
                if (diffHours < 24) return `منذ ${diffHours} ساعة`;
                if (diffDays === 1) return 'منذ يوم';
                if (diffDays < 7) return `منذ ${diffDays} أيام`;
                return null;
              };

              const timeSinceUpdate = getTimeSinceUpdate();

              return (
                <div
                  key={appointment.id}
                  onClick={() => handleViewClientInfo(appointment.clients)}
                  className={`bg-white dark:bg-gray-800 rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-3 sm:p-6 border-r-4 ${statusConfig.borderColor} animate-fadeIn cursor-pointer hover:scale-[1.02]`}
                  style={{ animationDelay: `${filteredAndSortedAppointments.indexOf(appointment) * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-6">
                    {/* Client Info */}
                    <div className="flex-1">
                      <div className="flex items-start space-x-3 sm:space-x-4 space-x-reverse mb-3 sm:mb-4">
                        <div className="relative">
                          {appointment.clients?.profile_image_url ? (
                            <img
                              src={appointment.clients.profile_image_url}
                              alt={clientName}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-blue-100 dark:ring-blue-900/20"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center ring-4 ring-blue-100 dark:ring-blue-900/20">
                              <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1 sm:mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                                {clientName || 'عميل'}
                              </h3>
                              {appointment.appointment_number && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5 sm:mt-1">
                                  #{appointment.appointment_number}
                                </p>
                              )}
                            </div>
                            {timeSinceUpdate && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                🕒 {timeSinceUpdate}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                            <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="text-xs sm:text-sm truncate">{appointment.appointment_date}</span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">{appointment.appointment_time}</span>
                            </div>
                            <div className={`flex items-center space-x-2 space-x-reverse ${methodConfig.color}`}>
                              <MethodIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-medium">{methodConfig.label}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                            <div className="flex items-center space-x-1.5 sm:space-x-2 space-x-reverse">
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">نوع الموعد:</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                {appointment.appointment_type || 'استشارة'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 sm:space-x-2 space-x-reverse">
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الحالة:</span>
                              <span className={`flex items-center space-x-1 space-x-reverse px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                <StatusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span>{statusConfig.label}</span>
                              </span>
                            </div>
                          </div>

                          {appointment.case_id && appointment.cases && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1.5 sm:space-x-2 space-x-reverse">
                                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                    مرتبطة بالقضية رقم <span className="font-bold">#{appointment.cases.case_number}</span>
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleViewCase(appointment.case_id); }}
                                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                  عرض القضية
                                </button>
                              </div>
                              {appointment.cases.title && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mr-5 sm:mr-6">
                                  {appointment.cases.title}
                                </p>
                              )}
                            </div>
                          )}

                          {(appointment.status === 'rejected' || appointment.status === 'cancelled') && appointment.rejection_reason && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 sm:p-4 mt-2 sm:mt-3">
                              <div className="flex items-start space-x-1.5 sm:space-x-2 space-x-reverse">
                                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs sm:text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                                    سبب الرفض:
                                  </p>
                                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">
                                    {appointment.rejection_reason}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {appointment.notes && (
                            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">ملاحظات: </span>
                                {appointment.notes}
                              </p>
                            </div>
                          )}

                          {/* Meeting Card for Video Calls */}
                          {appointment.status === 'confirmed' &&
                            appointment.meeting_method === 'video_call' &&
                            meetings[appointment.id] && (
                              <div className="mt-2 sm:mt-4 space-y-2 sm:space-y-3">
                                <MeetingCard
                                  meeting={meetings[appointment.id]}
                                  appointment={appointment}
                                  userType="lawyer"
                                  onJoinMeeting={handleJoinMeeting}
                                />
                                {/* End Meeting Button - Only show when meeting time is ready */}
                                {meetings[appointment.id].meeting_status === 'confirmed' &&
                                  meetingsReady[appointment.id] && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMeetingToEnd(meetings[appointment.id]);
                                        setShowEndMeetingModal(true);
                                      }}
                                      disabled={endingMeeting}
                                      className="w-full flex items-center justify-center space-x-1.5 sm:space-x-2 space-x-reverse px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium animate-fadeIn"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      <span>إنهاء الاجتماع</span>
                                    </button>
                                  )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end space-y-1.5 sm:space-y-3 lg:min-w-[200px]">
                      <div className="text-left w-full">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {appointment.price} ₪
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {appointment.duration_minutes} دقيقة
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1.5 sm:space-y-2 w-full">
                        {appointment.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAcceptAppointment(appointment.id); }}
                              disabled={processing === appointment.id}
                              className="flex items-center justify-center space-x-1.5 sm:space-x-2 space-x-reverse px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
                            >
                              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="font-medium">قبول الموعد</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAppointmentToReject(appointment);
                                setRejectModalOpen(true);
                              }}
                              disabled={processing === appointment.id}
                              className="flex items-center justify-center space-x-1.5 sm:space-x-2 space-x-reverse px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
                            >
                              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="font-medium">رفض الموعد</span>
                            </button>
                          </>
                        )}

                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCompleteAppointment(appointment.id); }}
                            disabled={processing === appointment.id}
                            className="flex items-center justify-center space-x-1.5 sm:space-x-2 space-x-reverse px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">تحديد كمكتمل</span>
                          </button>
                        )}

                        {appointment.case_id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewCase(appointment.case_id); }}
                            className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">عرض القضية</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && appointmentToReject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                رفض الموعد
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              يرجى إدخال سبب رفض هذا الموعد:
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="أدخل سبب الرفض..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows="4"
            />

            <div className="flex items-center space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleRejectAppointment}
                disabled={processing === appointmentToReject.id || !rejectionReason.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === appointmentToReject.id ? 'جاري الرفض...' : 'رفض الموعد'}
              </button>
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setAppointmentToReject(null);
                  setRejectionReason('');
                }}
                disabled={processing === appointmentToReject.id}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Meeting Confirmation Modal */}
      {showEndMeetingModal && meetingToEnd && (
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
                disabled={endingMeeting}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {endingMeeting ? 'جاري الإنهاء...' : 'نعم، أنهِ الاجتماع'}
              </button>
              <button
                onClick={() => {
                  setShowEndMeetingModal(false);
                  setMeetingToEnd(null);
                }}
                disabled={endingMeeting}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Info Modal */}
      <ClientInfoModal
        isOpen={showClientInfoModal}
        onClose={() => {
          setShowClientInfoModal(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
      />
    </div>
  );
};

export default Appointments;

