import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  FileText, Search, User, Briefcase, Ban, PlayCircle,
  Calendar, ArrowRight, CheckCircle, Clock, XCircle, AlertCircle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';

const AdminCasesManagement = () => {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [disableReason, setDisableReason] = useState('');
  const [disableNotes, setDisableNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (!userData.role || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      toast.error('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      navigate('/');
      return;
    }

    setCurrentAdmin(userData);
    fetchCases();
  }, [navigate]);

  useEffect(() => {
    filterCases();
  }, [cases, searchTerm, statusFilter]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select(`
          *,
          client:users!cases_client_id_fkey(user_id, first_name, last_name, email, phone),
          lawyer:lawyers!cases_assigned_lawyer_id_fkey(lawyer_id, first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (casesError) {
        console.error('Supabase error details:', casesError);
        throw casesError;
      }

      console.log('Cases fetched successfully:', casesData?.length || 0, 'cases');
      setCases(casesData || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error(`حدث خطأ في تحميل القضايا: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  const filterCases = () => {
    let filtered = [...cases];

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lawyer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lawyer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredCases(filtered);
  };

  const handleToggleCase = async (caseItem, action) => {
    if (action === 'disable') {
      setSelectedCase(caseItem);
      setShowDisableModal(true);
    } else {
      // Enable case directly
      await executeToggle(caseItem, 'enable');
    }
  };

  const executeToggle = async (caseItem, action) => {
    setActionLoading(true);
    try {
      const updateData = {
        is_disabled: action === 'disable',
        disabled_at: action === 'disable' ? new Date().toISOString() : null,
        disabled_by: action === 'disable' ? currentAdmin.admin_id : null,
        disabled_reason: action === 'disable' ? disableReason : null,
        disabled_admin_notes: action === 'disable' ? disableNotes : null
      };

      const { error } = await supabase
        .from('cases')
        .update(updateData)
        .eq('case_id', caseItem.case_id);

      if (error) throw error;

      toast.success(action === 'disable' ? 'تم تعطيل القضية بنجاح' : 'تم تفعيل القضية بنجاح');

      // Refresh cases
      await fetchCases();

      // Close modal and reset
      setShowDisableModal(false);
      setSelectedCase(null);
      setDisableReason('');
      setDisableNotes('');
    } catch (error) {
      console.error('Error toggling case:', error);
      toast.error('حدث خطأ في تحديث حالة القضية');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDisable = async () => {
    if (!disableReason.trim()) {
      toast.error('يرجى إدخال سبب التعطيل');
      return;
    }
    await executeToggle(selectedCase, 'disable');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      active: { label: 'نشط', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      completed: { label: 'مكتمل', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      closed: { label: 'مغلق', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
      rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const CaseCard = ({ caseItem }) => {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border ${caseItem.is_disabled
          ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
          : 'border-gray-200 dark:border-gray-700'
        } p-4 sm:p-6 hover:shadow-xl transition`}>
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse mb-2">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                {caseItem.title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(caseItem.status)}
              {caseItem.case_number && (
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  #{caseItem.case_number}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
            <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">
              {caseItem.client ? `${caseItem.client.first_name} ${caseItem.client.last_name}` : 'غير محدد'}
            </span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">
              {caseItem.lawyer ? `${caseItem.lawyer.first_name} ${caseItem.lawyer.last_name}` : 'غير مخصص'}
            </span>
          </div>
        </div>

        {caseItem.created_at && (
          <div className="flex items-center space-x-2 space-x-reverse text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-3">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{new Date(caseItem.created_at).toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        {caseItem.description && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 line-clamp-2">
            {caseItem.description}
          </p>
        )}

        {/* Disable/Enable Actions */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          {caseItem.is_disabled ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-semibold text-sm sm:text-base">القضية معطلة</span>
              </div>
              {caseItem.disabled_reason && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 p-2 sm:p-3 rounded-lg">
                  <strong>السبب:</strong> {caseItem.disabled_reason}
                </p>
              )}
              <button
                onClick={() => handleToggleCase(caseItem, 'enable')}
                disabled={actionLoading}
                className="w-full flex items-center justify-center space-x-2 space-x-reverse px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm sm:text-base"
              >
                <PlayCircle className="h-4 w-4" />
                <span>تفعيل القضية</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleToggleCase(caseItem, 'disable')}
              disabled={actionLoading}
              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm sm:text-base"
            >
              <Ban className="h-4 w-4" />
              <span>تعطيل القضية</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="h-[calc(100vh-4rem)] mt-16 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-3 sm:px-4 lg:px-6 py-6 sm:py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse mb-2">
                  <Ban className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                    تعطيل القضايا
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  التحكم الكامل بتعطيل وتفعيل القضايا في النظام
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/cases')}
                className="flex items-center justify-center space-x-2 space-x-reverse px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition font-semibold text-sm sm:text-base w-full sm:w-auto"
              >
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>رجوع لإدارة القضايا</span>
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الإجمالي</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {cases.length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 sm:p-4 shadow-md border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">مفعلة</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400">
                {cases.filter(c => !c.is_disabled).length}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 sm:p-4 shadow-md border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Ban className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">معطلة</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-400">
                {cases.filter(c => c.is_disabled).length}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 sm:p-4 shadow-md border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">النتائج</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-400">
                {filteredCases.length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث في القضايا..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-9 sm:pr-10 pl-3 sm:pl-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">معلق</option>
                <option value="active">نشط</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتمل</option>
                <option value="closed">مغلق</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>
          </div>

          {/* Cases Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-300">جاري التحميل...</p>
            </div>
          ) : filteredCases.length > 0 ? (
            <>
              <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                عرض {filteredCases.length} من أصل {cases.length} قضية
              </div>
              <div className="max-h-[calc(100vh-450px)] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {filteredCases.map((caseItem) => (
                  <CaseCard key={caseItem.case_id} caseItem={caseItem} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">لا توجد قضايا</p>
            </div>
          )}
        </div>
      </div>

      {/* Disable Modal */}
      {showDisableModal && selectedCase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Ban className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                تعطيل القضية
              </h3>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                  القضية: <strong className="text-gray-900 dark:text-white">{selectedCase.title}</strong>
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  رقم القضية: <strong className="text-gray-900 dark:text-white">#{selectedCase.case_number}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  سبب التعطيل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  placeholder="أدخل سبب تعطيل القضية"
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ملاحظات إدارية (اختياري)
                </label>
                <textarea
                  value={disableNotes}
                  onChange={(e) => setDisableNotes(e.target.value)}
                  placeholder="ملاحظات إضافية للإدارة"
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white resize-none text-sm sm:text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse pt-2 sm:pt-4">
                <button
                  onClick={confirmDisable}
                  disabled={actionLoading || !disableReason.trim()}
                  className="flex-1 px-4 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-semibold text-sm sm:text-base"
                >
                  {actionLoading ? 'جاري التعطيل...' : 'تأكيد التعطيل'}
                </button>
                <button
                  onClick={() => {
                    setShowDisableModal(false);
                    setSelectedCase(null);
                    setDisableReason('');
                    setDisableNotes('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 sm:py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 font-semibold text-sm sm:text-base"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCasesManagement;
