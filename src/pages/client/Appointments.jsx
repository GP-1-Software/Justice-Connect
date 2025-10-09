import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Video, 
  MessageSquare,
  Check,
  X,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useClientAuth } from '../../hooks/useClientAuth';
import { getClientAppointments, cancelAppointment, rescheduleAppointment } from '../../services/appointmentApi';

const Appointments = () => {
  const { t } = useTranslation();
  const { userProfile } = useClientAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch appointments from database
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userProfile?.user_id) {
        setLoading(false);
        return;
      }

      try {
        const data = await getClientAppointments(userProfile.user_id);
        
        // Transform data to match component expectations
        const transformedAppointments = data.map(appointment => ({
          id: appointment.id,
          lawyer: {
            name: `${appointment.lawyers?.first_name || ''} ${appointment.lawyers?.last_name || ''}`.trim(),
            specialization: appointment.lawyers?.specialization || '',
            avatar: appointment.lawyers?.profile_image || '/api/placeholder/50/50',
            hourly_rate: appointment.lawyers?.hourly_rate || 0
          },
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          duration: appointment.duration_minutes,
          type: appointment.appointment_type,
          method: appointment.meeting_method,
          status: appointment.status,
          price: appointment.price,
          notes: appointment.notes || ''
        }));
        
        setAppointments(transformedAppointments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userProfile]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'video_call':
        return Video;
      case 'in_person':
        return User;
      case 'phone_call':
        return Phone;
      default:
        return MessageSquare;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'consultation':
        return t('appointments.consultation');
      case 'case_review':
        return t('appointments.case_review');
      case 'document_review':
        return t('appointments.document_review');
      default:
        return type;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.lawyer.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isUpcoming = new Date(appointment.date) >= new Date();
    const matchesTab = activeTab === 'upcoming' ? isUpcoming : !isUpcoming;
    
    return matchesSearch && matchesTab;
  });

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) {
      try {
        await cancelAppointment(appointmentId);
        setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
        alert('تم إلغاء الموعد بنجاح');
      } catch (error) {
        console.error('Cancel error:', error);
        alert('حدث خطأ في إلغاء الموعد');
      }
    }
  };

  const handleRescheduleAppointment = (appointmentId) => {
    // Navigate to booking page with pre-filled data
    alert('سيتم إعادة توجيهك لصفحة إعادة الجدولة');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('appointments.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة مواعيدك مع المحامين
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4 sm:mb-0">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'upcoming'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('appointments.upcoming')}
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === 'past'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('appointments.past')}
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث في المواعيد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 space-x-reverse px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
              >
                <Filter className="h-4 w-4" />
                <span>فلتر</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm">
                  <option>جميع المحامين</option>
                  <option>أحمد المحامي</option>
                  <option>فاطمة المحامية</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm">
                  <option>جميع الأنواع</option>
                  <option>استشارة</option>
                  <option>مراجعة قضية</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm">
                  <option>جميع الحالات</option>
                  <option>مجدول</option>
                  <option>مؤكد</option>
                  <option>مكتمل</option>
                </select>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                لا توجد مواعيد
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {activeTab === 'upcoming' 
                  ? 'لا توجد مواعيد قادمة' 
                  : 'لا توجد مواعيد سابقة'}
              </p>
              {activeTab === 'upcoming' && (
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  احجز موعد جديد
                </button>
              )}
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const MethodIcon = getMethodIcon(appointment.method);
              const isUpcoming = new Date(appointment.date) >= new Date();
              
              return (
                <div
                  key={appointment.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Appointment Info */}
                    <div className="flex-1 mb-4 lg:mb-0">
                      <div className="flex items-start space-x-4 space-x-reverse">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 space-x-reverse mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {appointment.lawyer.name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {t(`appointments.status.${appointment.status}`)}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {appointment.lawyer.specialization}
                          </p>
                          <div className="flex items-center space-x-6 space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <Calendar className="h-4 w-4" />
                              <span>{appointment.date}</span>
                            </div>
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <MethodIcon className="h-4 w-4" />
                              <span>{t(`appointments.${appointment.method}`)}</span>
                            </div>
                          </div>
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {appointment.price} ريال
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {appointment.duration} دقيقة
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {isUpcoming && appointment.status !== 'completed' && (
                          <>
                            <button 
                              onClick={() => handleRescheduleAppointment(appointment.id)}
                              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
