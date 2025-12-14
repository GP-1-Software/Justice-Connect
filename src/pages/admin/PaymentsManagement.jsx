import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  FileText,
  CreditCard
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import InvoiceCard from '../../components/admin/payments/InvoiceCard';
import PaymentCard from '../../components/admin/payments/PaymentCard';
import PaymentFilters from '../../components/admin/payments/PaymentFilters';
import InvoiceDetailsModal from '../../components/admin/payments/InvoiceDetailsModal';
import PaymentDetailsModal from '../../components/admin/payments/PaymentDetailsModal';
import {
  getAllInvoices,
  getAllPayments,
  getFinancialStatistics,
  getInvoiceById,
  getPaymentById,
  updateInvoiceStatus,
  updatePaymentStatus
} from '../../services/paymentsApi';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';

const PaymentsManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('invoices');
  
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lawyersList, setLawyersList] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [selectedLawyer, setSelectedLawyer] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

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
      const [invoicesData, paymentsData, statsData, lawyersData] = await Promise.all([
        getAllInvoices(),
        getAllPayments(),
        getFinancialStatistics(),
        supabase.from('lawyers').select('lawyer_id, first_name, last_name').eq('account_status', 'approved')
      ]);
      
      setInvoices(invoicesData);
      setFilteredInvoices(invoicesData);
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
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

  useEffect(() => {
    let result = [...invoices];

    if (searchTerm) {
      result = result.filter((inv) =>
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client?.id_number?.includes(searchTerm)
      );
    }

    if (selectedStatus !== 'all') {
      result = result.filter((inv) => inv.status === selectedStatus);
    }

    if (selectedLawyer !== 'all') {
      result = result.filter((inv) => inv.lawyer_id === parseInt(selectedLawyer));
    }

    if (selectedDateRange !== 'all') {
      if (selectedDateRange === 'custom') {
        if (customDateFrom && customDateTo) {
          const fromDate = new Date(customDateFrom);
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999);
          
          result = result.filter((inv) => {
            const invoiceDate = new Date(inv.issue_date);
            return invoiceDate >= fromDate && invoiceDate <= toDate;
          });
        } else if (customDateFrom) {
          const fromDate = new Date(customDateFrom);
          result = result.filter((inv) => new Date(inv.issue_date) >= fromDate);
        } else if (customDateTo) {
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999);
          result = result.filter((inv) => new Date(inv.issue_date) <= toDate);
        }
      } else {
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
        
        result = result.filter((inv) => new Date(inv.issue_date) >= filterDate);
      }
    }

    setFilteredInvoices(result);
  }, [searchTerm, selectedStatus, selectedLawyer, selectedDateRange, customDateFrom, customDateTo, invoices]);

  useEffect(() => {
    let result = [...payments];

    if (searchTerm) {
      result = result.filter((pay) =>
        pay.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pay.client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pay.client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pay.client?.id_number?.includes(searchTerm)
      );
    }

    if (selectedStatus !== 'all') {
      result = result.filter((pay) => pay.status === selectedStatus);
    }

    if (selectedPaymentMethod !== 'all') {
      result = result.filter((pay) => pay.payment_method === selectedPaymentMethod);
    }

    if (selectedLawyer !== 'all') {
      result = result.filter((pay) => pay.lawyer_id === parseInt(selectedLawyer));
    }

    if (selectedDateRange !== 'all') {
      if (selectedDateRange === 'custom') {
        if (customDateFrom && customDateTo) {
          const fromDate = new Date(customDateFrom);
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999);
          
          result = result.filter((pay) => {
            const paymentDate = new Date(pay.payment_date || pay.created_at);
            return paymentDate >= fromDate && paymentDate <= toDate;
          });
        } else if (customDateFrom) {
          const fromDate = new Date(customDateFrom);
          result = result.filter((pay) => new Date(pay.payment_date || pay.created_at) >= fromDate);
        } else if (customDateTo) {
          const toDate = new Date(customDateTo);
          toDate.setHours(23, 59, 59, 999);
          result = result.filter((pay) => new Date(pay.payment_date || pay.created_at) <= toDate);
        }
      } else {
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
        
        result = result.filter((pay) => new Date(pay.payment_date || pay.created_at) >= filterDate);
      }
    }

    setFilteredPayments(result);
  }, [searchTerm, selectedStatus, selectedPaymentMethod, selectedLawyer, selectedDateRange, customDateFrom, customDateTo, payments]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedPaymentMethod('all');
    setSelectedLawyer('all');
    setSelectedDateRange('all');
    setCustomDateFrom('');
    setCustomDateTo('');
  };

  const handleInvoiceClick = async (invoiceData) => {
    try {
      const fullInvoiceData = await getInvoiceById(invoiceData.invoice_id);
      setSelectedInvoice(fullInvoiceData);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('حدث خطأ في تحميل تفاصيل الفاتورة');
    }
  };

  const handlePaymentClick = async (paymentData) => {
    try {
      const fullPaymentData = await getPaymentById(paymentData.payment_id);
      setSelectedPayment(fullPaymentData);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('حدث خطأ في تحميل تفاصيل الدفعة');
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      await updateInvoiceStatus(invoiceId, newStatus);
      toast.success('تم تحديث حالة الفاتورة بنجاح');
      await fetchData();
      setShowInvoiceModal(false);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('حدث خطأ في تحديث حالة الفاتورة');
      throw error;
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    try {
      await updatePaymentStatus(paymentId, newStatus);
      toast.success('تم تحديث حالة الدفعة بنجاح');
      await fetchData();
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('حدث خطأ في تحديث حالة الدفعة');
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

  const currentData = viewMode === 'invoices' ? filteredInvoices : filteredPayments;
  const totalData = viewMode === 'invoices' ? invoices : payments;

  return (
    <>
      <Navbar />
      <div className="h-[calc(100vh-4rem)] mt-16 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-3 sm:px-4 lg:px-6 py-6 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse mb-2">
                  <Link to="/admin/dashboard" className="flex items-center space-x-1 sm:space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">رجوع</span>
                  </Link>
                  <span className="text-gray-400 dark:text-gray-600">|</span>
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                    إدارة المدفوعات
                  </h1>
                </div>
              </div>
              <button onClick={handleRefresh} disabled={refreshing} className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>
          </div>

          <div className="mb-6 flex space-x-2 space-x-reverse bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg">
            <button onClick={() => setViewMode('invoices')} className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-lg font-semibold transition ${viewMode === 'invoices' ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <FileText className="h-5 w-5" />
              <span>الفواتير</span>
            </button>
            <button onClick={() => setViewMode('payments')} className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-lg font-semibold transition ${viewMode === 'payments' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <CreditCard className="h-5 w-5" />
              <span>المدفوعات</span>
            </button>
          </div>

          {statistics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {viewMode === 'invoices' ? (
                <>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الإجمالي</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalInvoices}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">معلقة</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-yellow-400">{statistics.invoiceStatusCounts.pending}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">مدفوعة</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">{statistics.invoiceStatusCounts.paid}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">متأخرة</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-400">{statistics.invoiceStatusCounts.overdue}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الإجمالي</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalPayments}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">معلقة</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-yellow-400">{statistics.paymentStatusCounts.pending}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">مكتملة</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">{statistics.paymentStatusCounts.completed}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 hover:shadow-lg transition">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">فاشلة</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-400">{statistics.paymentStatusCounts.failed}</p>
                  </div>
                </>
              )}
            </div>
          )}

          <PaymentFilters
            viewMode={viewMode}
            setViewMode={setViewMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
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

          {currentData.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              {viewMode === 'invoices' ? <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" /> : <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                لا توجد {viewMode === 'invoices' ? 'فواتير' : 'مدفوعات'}
              </h3>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                عرض {currentData.length} من أصل {totalData.length}
              </div>
              <div className="max-h-[calc(100vh-500px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pb-4">
                  {viewMode === 'invoices' ? (
                    filteredInvoices.map((invoice) => (
                      <InvoiceCard key={invoice.invoice_id} invoice={invoice} onClick={() => handleInvoiceClick(invoice)} />
                    ))
                  ) : (
                    filteredPayments.map((payment) => (
                      <PaymentCard key={payment.payment_id} payment={payment} onClick={() => handlePaymentClick(payment)} />
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showInvoiceModal && selectedInvoice && (
        <InvoiceDetailsModal invoice={selectedInvoice} onClose={() => { setShowInvoiceModal(false); setSelectedInvoice(null); }} onUpdateStatus={handleUpdateInvoiceStatus} />
      )}

      {showPaymentModal && selectedPayment && (
        <PaymentDetailsModal payment={selectedPayment} onClose={() => { setShowPaymentModal(false); setSelectedPayment(null); }} onUpdateStatus={handleUpdatePaymentStatus} />
      )}
    </>
  );
};

export default PaymentsManagement;
