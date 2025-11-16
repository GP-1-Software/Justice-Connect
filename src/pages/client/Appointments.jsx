import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Video, 
  MapPin,
  FileText,
  AlertCircle,
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Ban,
  TrendingUp,
  CheckSquare,
  Clock3
} from 'lucide-react';
import { useClientAuth } from '../../hooks/useClientAuth';
import { getClientAppointments, cancelAppointment } from '../../services/appointmentApi';
import { getMeetingByAppointment } from '../../services/meetingApi';
import { formatSpecialization } from '../../utils/formatters';
import MeetingCard from '../../components/shared/MeetingCard';
import { supabase } from '../../supabaseClient';

const Appointments = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useClientAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [meetings, setMeetings] = useState({}); // Map of appointment_id -> meeting
  const [isFiltering, setIsFiltering] = useState(false);

  // Reset filters when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedStatus('all');
  };

  // Trigger filtering animation
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => setIsFiltering(false), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, selectedMethod, appointmentFilter, activeTab]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userProfile?.user_id) {
        setLoading(false);
        return;
      }

      try {
        const data = await getClientAppointments(userProfile.user_id);
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

    fetchAppointments();

    // Real-time subscription for appointments
    if (userProfile?.user_id) {
      const appointmentsChannel = supabase
        .channel('client-appointments-changes')
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'appointments',
            filter: `client_id=eq.${userProfile.user_id}`
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
            // Refresh appointments
            const data = await getClientAppointments(userProfile.user_id);
            setAppointments(data || []);
          }
        )
        .subscribe();

      // Real-time subscription for meetings
      const meetingsChannel = supabase
        .channel('client-meetings-changes')
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'meetings'
          },
          async (payload) => {
            if (payload.eventType === 'INSERT' && payload.new?.related_appointment_id) {
              // New meeting created - check if it belongs to this client
              try {
                const { data: appointment } = await supabase
                  .from('appointments')
                  .select('id, client_id')
                  .eq('id', payload.new.related_appointment_id)
                  .eq('client_id', userProfile.user_id)
                  .single();
                
                if (appointment) {
                  setMeetings(prev => ({ ...prev, [payload.new.related_appointment_id]: payload.new }));
                }
              } catch (error) {
                console.error('Error checking appointment:', error);
              }
            } else if (payload.eventType === 'UPDATE' && payload.new?.related_appointment_id) {
              // Meeting updated - check if it belongs to this client
              try {
                const { data: appointment } = await supabase
                  .from('appointments')
                  .select('id, client_id')
                  .eq('id', payload.new.related_appointment_id)
                  .eq('client_id', userProfile.user_id)
                  .single();
                
                if (appointment) {
                  setMeetings(prev => ({ ...prev, [payload.new.related_appointment_id]: payload.new }));
                }
              } catch (error) {
                console.error('Error checking appointment:', error);
              }
            } else if (payload.eventType === 'DELETE' && payload.old?.related_appointment_id) {
              // Meeting deleted - remove from state immediately
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
    }
  }, [userProfile]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'قيد التأكيد',
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

  // Smart filtering and sorting
  const filteredAndSortedAppointments = React.useMemo(() => {
    // Step 1: Filter appointments
    const filtered = appointments.filter(appointment => {
      const lawyerName = `${appointment.lawyers?.first_name || ''} ${appointment.lawyers?.last_name || ''}`.trim();
      const matchesSearch = lawyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.appointment_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // تحديد المواعيد النشطة: المواعيد بحالة pending أو confirmed
      const appointmentStatus = appointment.status?.toLowerCase();
      const isActiveAppointment = appointmentStatus === 'pending' || appointmentStatus === 'confirmed';
      
      // تحديد المواعيد المنتهية: المواعيد بحالة completed أو cancelled
      const isCompletedAppointment = appointmentStatus === 'completed' || 
                                     appointmentStatus === 'cancelled';
      
      // تحديد التاب المناسب بناءً على الحالة
      let matchesTab = false;
      if (activeTab === 'upcoming') {
        // المواعيد النشطة: pending و confirmed
        matchesTab = isActiveAppointment;
      } else {
        // السجل الكامل: completed و cancelled
        matchesTab = isCompletedAppointment;
      }
      
      // إذا لم يطابق التاب، لا نتابع
      if (!matchesTab) return false;
      
      const matchesAppointmentFilter = 
        appointmentFilter === 'all' ? true :
        appointmentFilter === 'with_case' ? appointment.case_id !== null :
        appointmentFilter === 'standalone' ? appointment.case_id === null : true;
      
      // فلتر الحالة
      const matchesStatus = selectedStatus === 'all' || appointmentStatus === selectedStatus.toLowerCase();
      
      const matchesMethod = selectedMethod === 'all' || appointment.meeting_method === selectedMethod;
      
      return matchesSearch && matchesAppointmentFilter && matchesStatus && matchesMethod;
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
      // Use updated_at if available, otherwise fall back to created_at or appointment date
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
  }, [appointments, activeTab, searchTerm, appointmentFilter, selectedStatus, selectedMethod]);

  // Dynamic stats with real-time updates
  const stats = React.useMemo(() => ({
    upcoming: appointments.filter(a => {
      // المواعيد النشطة: pending و confirmed
      const status = a.status?.toLowerCase();
      return status === 'pending' || status === 'confirmed';
    }).length,
    completed: appointments.filter(a => {
      const status = a.status?.toLowerCase();
      return status === 'completed';
    }).length,
    pending: appointments.filter(a => {
      const status = a.status?.toLowerCase();
      return status === 'pending';
    }).length,
    cancelled: appointments.filter(a => {
      const status = a.status?.toLowerCase();
      return status === 'cancelled';
    }).length
  }), [appointments]);

  const openCancelModal = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel) return;
    
    try {
      await cancelAppointment(appointmentToCancel.id);
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentToCancel.id));
      setCancelModalOpen(false);
      setAppointmentToCancel(null);
    } catch (error) {
      console.error('Cancel error:', error);
      alert('حدث خطأ في إلغاء الموعد');
    }
  };

  const handleViewCase = (caseId) => {
    navigate(`/client/cases/${caseId}`);
  };

  const handleJoinMeeting = (meeting) => {
    window.open(meeting.meeting_link, '_blank');
  };

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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            إدارة المواعيد مع المحامين
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
            راجع، انضم أو ألغِ مواعيدك القادمة بسهولة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">المواعيد القادمة</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.upcoming}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg sm:rounded-xl">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-r-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">المواعيد المكتملة</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg sm:rounded-xl">
                <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border-r-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">قيد التأكيد</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg sm:rounded-xl">
                <Clock3 className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start space-x-2 sm:space-x-3 space-x-reverse">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-semibold">📅 المواعيد النشطة:</span> تشمل المواعيد القادمة التي لم تنتهي بعد (قيد التأكيد، مؤكدة)
                </p>
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 mt-1">
                  <span className="font-semibold">📋 السجل الكامل:</span> يحتوي على المواعيد المنتهية (مكتملة، ملغاة، مرفوضة)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex space-x-1 sm:space-x-2 space-x-reverse bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded-xl p-1 overflow-x-auto">
              <button
                onClick={() => handleTabChange('upcoming')}
                className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📅 المواعيد النشطة
              </button>
              <button
                onClick={() => handleTabChange('past')}
                className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'past'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📋 السجل الكامل
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:space-x-3 sm:space-x-reverse">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث في المواعيد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 sm:pl-4 pr-9 sm:pr-10 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center space-x-2 space-x-reverse px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg sm:rounded-xl transition-all relative ${
                  showFilters
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
          {(searchTerm || selectedStatus !== 'all' || selectedMethod !== 'all' || appointmentFilter !== 'all') && (
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
              {(searchTerm || selectedStatus !== 'all' || selectedMethod !== 'all' || appointmentFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                    setSelectedMethod('all');
                    setAppointmentFilter('all');
                  }}
                  className="flex items-center space-x-1 space-x-reverse text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  <X className="h-3 w-3" />
                  <span>مسح الفلاتر</span>
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={appointmentFilter}
              onChange={(e) => setAppointmentFilter(e.target.value)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all ${
                appointmentFilter !== 'all' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800 font-semibold' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="all">جميع المواعيد</option>
              <option value="with_case">المرتبطة بقضية</option>
              <option value="standalone">الاستشارات المستقلة</option>
            </select>

            {showFilters && (
              <>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all ${
                    selectedStatus !== 'all' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="all">جميع الحالات</option>
                  {activeTab === 'upcoming' ? (
                    <>
                      <option value="pending">قيد التأكيد</option>
                      <option value="confirmed">مؤكد</option>
                    </>
                  ) : (
                    <>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغى</option>
                    </>
                  )}
                </select>

                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className={`px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all ${
                    selectedMethod !== 'all' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="all">جميع الأنواع</option>
                  <option value="video_call">مكالمة فيديو</option>
                  <option value="in_person">حضوري</option>
                  <option value="phone_call">مكالمة هاتفية</option>
                </select>
              </>
            )}
          </div>
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

        <div className={`space-y-4 transition-opacity duration-300 ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
          {filteredAndSortedAppointments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
              <Calendar className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد مواعيد
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {activeTab === 'upcoming' 
                  ? 'لا توجد مواعيد نشطة حالياً' 
                  : 'لا يوجد سجل لمواعيد سابقة'}
              </p>
              {activeTab === 'upcoming' && (
                <button 
                  onClick={() => navigate('/client/lawyers')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  احجز موعد جديد
                </button>
              )}
            </div>
          ) : (
            filteredAndSortedAppointments.map((appointment) => {
              const statusConfig = getStatusConfig(appointment.status);
              const methodConfig = getMethodConfig(appointment.meeting_method);
              const StatusIcon = statusConfig.icon;
              const MethodIcon = methodConfig.icon;
              
              // Fix: Compare dates without time component
              const appointmentDate = new Date(appointment.appointment_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Reset time to start of day
              appointmentDate.setHours(0, 0, 0, 0); // Reset time to start of day
              const isUpcoming = appointmentDate >= today;
              
              const lawyerName = `${appointment.lawyers?.first_name || ''} ${appointment.lawyers?.last_name || ''}`.trim();
              
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
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-r-4 ${statusConfig.borderColor} animate-fadeIn`}
                  style={{ animationDelay: `${filteredAndSortedAppointments.indexOf(appointment) * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4 space-x-reverse mb-4">
                        <div className="relative">
                          {appointment.lawyers?.profile_image_url ? (
                            <img
                              src={appointment.lawyers.profile_image_url}
                              alt={lawyerName}
                              className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-100 dark:ring-blue-900/20"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center ring-4 ring-blue-100 dark:ring-blue-900/20">
                              <User className="h-8 w-8 text-white" />
                            </div>
                          )}
                          {appointment.lawyers?.years_of_experience && (
                            <div className="absolute -bottom-1 -left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                              {appointment.lawyers.years_of_experience} سنة
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {lawyerName}
                              </h3>
                              {appointment.appointment_number && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                                  #{appointment.appointment_number}
                                </p>
                              )}
                            </div>
                            {timeSinceUpdate && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full whitespace-nowrap">
                                🕒 {timeSinceUpdate}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                            {formatSpecialization(appointment.lawyers?.specialization)}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                            <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">{appointment.appointment_date}</span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">{appointment.appointment_time}</span>
                            </div>
                            <div className={`flex items-center space-x-2 space-x-reverse ${methodConfig.color}`}>
                              <MethodIcon className="h-4 w-4" />
                              <span className="text-sm font-medium">{methodConfig.label}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-sm text-gray-600 dark:text-gray-400">نوع الموعد:</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {appointment.appointment_type}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-sm text-gray-600 dark:text-gray-400">الحالة:</span>
                              <span className={`flex items-center space-x-1 space-x-reverse px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                <span>{statusConfig.label}</span>
                              </span>
                            </div>
                          </div>

                          {appointment.case_id && appointment.cases ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    مرتبطة بالقضية رقم <span className="font-bold">#{appointment.cases.case_number}</span>
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleViewCase(appointment.case_id)}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                  عرض القضية
                                </button>
                              </div>
                              {appointment.cases.title && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mr-6">
                                  {appointment.cases.title}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                              استشارة أولية
                            </span>
                          )}

                          {appointment.status === 'cancelled' && appointment.rejection_reason && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-3">
                              <div className="flex items-start space-x-2 space-x-reverse">
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                                    تم رفض هذا الموعد
                                  </p>
                                  <p className="text-sm text-red-700 dark:text-red-400">
                                    السبب: {appointment.rejection_reason}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {appointment.notes && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">ملاحظات: </span>
                                {appointment.notes}
                              </p>
                            </div>
                          )}

                          {/* Meeting Card for Video Calls */}
                          {appointment.status === 'confirmed' && 
                           appointment.meeting_method === 'video_call' && 
                           meetings[appointment.id] && (
                            <div className="mt-4">
                              <MeetingCard
                                meeting={meetings[appointment.id]}
                                appointment={appointment}
                                userType="client"
                                onJoinMeeting={handleJoinMeeting}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-3">
                      <div className="text-left">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {appointment.price} ₪
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {appointment.duration_minutes} دقيقة
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 w-full">

                        {appointment.case_id && (
                          <button
                            onClick={() => handleViewCase(appointment.case_id)}
                            className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-sm font-medium">عرض القضية</span>
                          </button>
                        )}

                        {isUpcoming && appointment.status === 'pending' && (
                          <button
                            onClick={() => openCancelModal(appointment)}
                            className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
                          >
                            <X className="h-4 w-4" />
                            <span className="text-sm font-medium">إلغاء الموعد</span>
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

      {cancelModalOpen && appointmentToCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                تأكيد إلغاء الموعد
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              هل أنت متأكد من إلغاء هذا الموعد؟ لن يتمكن المحامي من تأكيده بعد الآن.
            </p>

            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={handleCancelConfirm}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium shadow-lg hover:shadow-xl"
              >
                نعم، إلغاء الموعد
              </button>
              <button
                onClick={() => {
                  setCancelModalOpen(false);
                  setAppointmentToCancel(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
