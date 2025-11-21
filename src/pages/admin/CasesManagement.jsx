import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Loader
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import CaseCard from '../../components/admin/cases/CaseCard';
import CaseFilters from '../../components/admin/cases/CaseFilters';
import CaseDetailsModal from '../../components/admin/cases/CaseDetailsModal';
import {
  getAllCases,
  getCasesStatistics,
  getCaseById,
  updateCaseStatus,
  searchCases
} from '../../services/casesApi';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';

const CasesManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [lawyersList, setLawyersList] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
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
      const [casesData, statsData, lawyersData] = await Promise.all([
        getAllCases(),
        getCasesStatistics(),
        supabase.from('lawyers').select('lawyer_id, first_name, last_name').eq('account_status', 'approved')
      ]);
      
      setCases(casesData);
      setFilteredCases(casesData);
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
    let result = [...cases];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((c) => c.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      result = result.filter((c) => c.priority === selectedPriority);
    }

    // Type filter
    if (selectedType !== 'all') {
      result = result.filter((c) => c.case_type === selectedType);
    }

    // Lawyer filter
    if (selectedLawyer !== 'all') {
      if (selectedLawyer === 'unassigned') {
        result = result.filter((c) => !c.assigned_lawyer_id);
      } else {
        result = result.filter((c) => c.assigned_lawyer_id === selectedLawyer);
      }
    }

    // Date range filter
    if (selectedDateRange !== 'all') {
      if (selectedDateRange === 'custom') {
        // Custom date range
        if (customDateFrom && customDateTo) {
          const fromDate = new Date(customDateFrom);
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999); // Include the entire end date
          
          result = result.filter((c) => {
            const caseDate = new Date(c.created_at);
            return caseDate >= fromDate && caseDate <= toDate;
          });
        } else if (customDateFrom) {
          const fromDate = new Date(customDateFrom);
          result = result.filter((c) => new Date(c.created_at) >= fromDate);
        } else if (customDateTo) {
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999);
          result = result.filter((c) => new Date(c.created_at) <= toDate);
        }
      } else {
        // Predefined date ranges
        const now = new Date();
        const filterDate = new Date();
        
        switch (selectedDateRange) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            filterDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
          case '3months':
            filterDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            filterDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            break;
        }
        
        result = result.filter((c) => new Date(c.created_at) >= filterDate);
      }
    }

    setFilteredCases(result);
  }, [searchTerm, selectedStatus, selectedPriority, selectedType, selectedLawyer, selectedDateRange, customDateFrom, customDateTo, cases]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedType('all');
    setSelectedLawyer('all');
    setSelectedDateRange('all');
    setCustomDateFrom('');
    setCustomDateTo('');
  };

  const handleCaseClick = async (caseData) => {
    try {
      const fullCaseData = await getCaseById(caseData.case_id);
      setSelectedCase(fullCaseData);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching case details:', error);
      toast.error('حدث خطأ في تحميل تفاصيل القضية');
    }
  };

  const handleUpdateStatus = async (caseId, newStatus) => {
    try {
      await updateCaseStatus(caseId, newStatus);
      toast.success('تم تحديث حالة القضية بنجاح');
      await fetchData();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error updating case status:', error);
      toast.error('حدث خطأ في تحديث حالة القضية');
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
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                    إدارة القضايا
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mr-8 sm:mr-0">
                  عرض ومتابعة جميع القضايا في المنصة
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
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الإجمالي</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.totalCases}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">معلقة</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                  {statistics.statusCounts.pending}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">نشطة</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {statistics.statusCounts.active}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">قيد المعالجة</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {statistics.statusCounts.in_progress}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">مكتملة</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">
                  {statistics.statusCounts.completed}
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">مرفوضة</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-400">
                  {statistics.statusCounts.rejected}
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <CaseFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedPriority={selectedPriority}
            setSelectedPriority={setSelectedPriority}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
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

          {/* Cases Grid */}
          {filteredCases.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد قضايا
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedType !== 'all' || selectedLawyer !== 'all' || selectedDateRange !== 'all'
                  ? 'لا توجد نتائج تطابق الفلاتر المحددة'
                  : 'لا توجد قضايا مسجلة في النظام'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                عرض {filteredCases.length} من أصل {cases.length} قضية
              </div>
              <div className="max-h-[calc(100vh-500px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-4">
                  {filteredCases.map((caseData) => (
                    <CaseCard
                      key={caseData.case_id}
                      caseData={caseData}
                      onClick={() => handleCaseClick(caseData)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Case Details Modal */}
      {showDetailsModal && selectedCase && (
        <CaseDetailsModal
          caseData={selectedCase}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCase(null);
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </>
  );
};

export default CasesManagement;
