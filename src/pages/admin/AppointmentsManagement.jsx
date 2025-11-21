import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Loader,
  CalendarCheck
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import AppointmentCard from '../../components/admin/appointments/AppointmentCard';
import AppointmentFilters from '../../components/admin/appointments/AppointmentFilters';
import AppointmentDetailsModal from '../../components/admin/appointments/AppointmentDetailsModal';
import {
  getAllAppointments,
  getAppointmentsStatistics,
  getAppointmentById,
  updateAppointmentStatus
} from '../../services/appointmentsApi';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';

const AppointmentsManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [lawyersList, setLawyersList] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedLawyer, setSelectedLawyer] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Check admin authentication
  useEffect(() => {
    checkAdminAuth();
  }, [navigate]);

  const checkAdminAuth = () => {
    const user = localStorage.getItem('user');
    if (!user) {
      toast.error('يجب تسجيل الدخول كمسؤول');
      navigate('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (!userData.role || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      toast.error('غير مصرح لك بالوصول لهذه الصفحة');
      navigate('/');
      return;
    }

    fetchData();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsData, statsData, lawyersData] = await Promise.all([
        getAllAppointments(),
        getAppointmentsStatistics(),
        supabase.from('lawyers').select('lawyer_id, first_name, last_name').eq('account_status', 'approved')
      ]);
      
      setAppointments(appointmentsData);
      setFilteredAppointments(appointmentsData);
      setStatistics(statsData);
      if (lawyersData.data) {
        setLawyersList(lawyersData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('تم تحديث البيانات');
  };

  // Apply filters
  useEffect(() => {
    let result = [...appointments];

    // Search filter
    if (searchTerm) {
      result = result.filter((appointment) =>
        appointment.appointment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.client?.id_number?.includes(searchTerm) ||
        appointment.lawyer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.lawyer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.appointment_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((a) => a.status === selectedStatus);
    }

    // Type filter
    if (selectedType !== 'all') {
      result = result.filter((a) => a.appointment_type === selectedType);
    }

    // Method filter
    if (selectedMethod !== 'all') {
      result = result.filter((a) => a.meeting_method === selectedMethod);
    }

    // Lawyer filter
    if (selectedLawyer !== 'all') {
      result = result.filter((a) => a.lawyer_id === parseInt(selectedLawyer));
    }

    // Date range filter
    if (selectedDateRange !== 'all') {
      if (selectedDateRange === 'custom') {
        // Custom date range
        if (customDateFrom && customDateTo) {
          const fromDate = new Date(customDateFrom);
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999);
          
          result = result.filter((a) => {
            const appointmentDate = new Date(a.appointment_date);
            return appointmentDate >= fromDate && appointmentDate <= toDate;
          });
        } else if (customDateFrom) {
          const fromDate = new Date(customDateFrom);
          result = result.filter((a) => new Date(a.appointment_date) >= fromDate);
        } else if (customDateTo) {
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999);
          result = result.filter((a) => new Date(a.appointment_date) <= toDate);
        }
      } else {
        // Predefined date ranges
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        switch (selectedDateRange) {
          case 'today':
            result = result.filter((a) => {
              const appointmentDate = new Date(a.appointment_date);
              return appointmentDate.toDateString() === today.toDateString();
            });
            break;
          case 'tomorrow':
            result = result.filter((a) => {
              const appointmentDate = new Date(a.appointment_date);
              return appointmentDate.toDateString() === tomorrow.toDateString();
            });
            break;
          case 'week':
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            result = result.filter((a) => {
              const appointmentDate = new Date(a.appointment_date);
              return appointmentDate >= today && appointmentDate <= weekEnd;
            });
            break;
          case 'month':
            const monthEnd = new Date(today);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            result = result.filter((a) => {
              const appointmentDate = new Date(a.appointment_date);
              return appointmentDate >= today && appointmentDate <= monthEnd;
            });
            break;
          case 'past':
            result = result.filter((a) => {
              const appointmentDate = new Date(a.appointment_date);
              return appointmentDate < today;
            });
            break;
          case 'upcoming':
            result = result.filter((a) => {
              const appointmentDate = new Date(a.appointment_date);
              return appointmentDate >= today;
            });
            break;
          default:
            break;
        }
      }
    }

    setFilteredAppointments(result);
  }, [searchTerm, selectedStatus, selectedType, selectedMethod, selectedLawyer, selectedDateRange, customDateFrom, customDateTo, appointments]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedType('all');
    setSelectedMethod('all');
    setSelectedLawyer('all');
    setSelectedDateRange('all');
    setCustomDateFrom('');
    setCustomDateTo('');
  };

  const handleAppointmentClick = async (appointmentData) => {
    try {
      const fullAppointmentData = await getAppointmentById(appointmentData.id);
      setSelectedAppointment(fullAppointmentData);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      toast.error('حدث خطأ في تحميل تفاصيل الموعد');
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus, rejectionReason = null) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus, rejectionReason);
      toast.success('تم تحديث حالة الموعد بنجاح');
      await fetchData();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('حدث خطأ في تحديث حالة الموعد');
      throw error;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">جاري التحميل...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-16 sm:pt-20 px-3 sm:px-4 lg:px-6 py-6 sm:py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse mb-2">
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center space-x-1 sm:space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">رجوع</span>
                  </Link>
                  <span className="text-gray-400 dark:text-gray-600">|</span>
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                    إدارة المواعيد
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mr-8 sm:mr-0">
                  عرض ومتابعة جميع المواعيد في المنصة
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الإجمالي</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.totalAppointments}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">معلق</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                  {statistics.statusCounts.pending}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">مؤكد</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {statistics.statusCounts.confirmed}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">مكتمل</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">
                  {statistics.statusCounts.completed}
                </p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <CalendarCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">اليوم</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {statistics.todayAppointments}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">قادمة</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {statistics.upcomingAppointments}
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <AppointmentFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
            selectedLawyer={selectedLawyer}
            setSelectedLawyer={setSelectedLawyer}
            selectedDateRange={selectedDateRange}
            setSelectedDateRange={setSelectedDateRange}
            customDateFrom={customDateFrom}
            setCustomDateFrom={setCustomDateFrom}
            customDateTo={customDateTo}
            setCustomDateTo={setCustomDateTo}
            lawyersList={lawyersList}
            onClearFilters={handleClearFilters}
          />

          {/* Appointments Grid */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد مواعيد
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedStatus !== 'all' || selectedType !== 'all' || selectedMethod !== 'all' || selectedLawyer !== 'all' || selectedDateRange !== 'all'
                  ? 'لا توجد نتائج تطابق الفلاتر المحددة'
                  : 'لا توجد مواعيد مسجلة في النظام'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                عرض {filteredAppointments.length} من أصل {appointments.length} موعد
              </div>
              <div className="max-h-[calc(100vh-500px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-4">
                  {filteredAppointments.map((appointmentData) => (
                    <AppointmentCard
                      key={appointmentData.id}
                      appointment={appointmentData}
                      onClick={() => handleAppointmentClick(appointmentData)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </>
  );
};

export default AppointmentsManagement;
