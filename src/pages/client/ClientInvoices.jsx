import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices, useInvoiceStats } from '../../hooks/useInvoices';
import InvoiceCard from '../../components/invoices/InvoiceCard';
import { useClientAuth } from '../../hooks/useClientAuth';
import {
  Search,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  CreditCard
} from 'lucide-react';
import { formatCurrency, isInvoiceOverdue } from '../../services/invoiceService';

/**
 * Client Invoices Page
 * Displays all invoices received by the client
 */
const ClientInvoices = () => {
  const navigate = useNavigate();
  const { userProfile } = useClientAuth();

  // Get client ID from auth context
  const clientId = userProfile?.user_id;

  console.log('🔍 ClientInvoices - client data:', { userProfile, clientId });

  const [filters, setFilters] = useState({
    search: '',
    fromDate: '',
    toDate: ''
  });

  const [activeTab, setActiveTab] = useState('all');

  // Fetch invoices with real-time updates (only if clientId exists)
  const { invoices, loading, error, refetch } = useInvoices(clientId, 'client', filters);

  // Fetch statistics
  const { stats, loading: statsLoading } = useInvoiceStats(clientId, 'client');

  // Debug logging
  console.log('📊 ClientInvoices state:', {
    invoices: invoices?.length,
    loading,
    error,
    clientId,
    filters
  });

  // Helper function to get effective status (considers overdue)
  const getEffectiveStatus = (inv) => {
    if (inv.status === 'pending' && isInvoiceOverdue(inv)) {
      return 'overdue';
    }
    return inv.status;
  };

  // Filter invoices based on active tab
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Filter by tab - use effective status to handle overdue
    if (activeTab !== 'all') {
      filtered = filtered.filter(inv => getEffectiveStatus(inv) === activeTab);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchLower) ||
        inv.lawyer?.first_name?.toLowerCase().includes(searchLower) ||
        inv.lawyer?.last_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (filters.fromDate) {
      filtered = filtered.filter(inv => {
        const issueDate = new Date(inv.issue_date).setHours(0, 0, 0, 0);
        const fromDate = new Date(filters.fromDate).setHours(0, 0, 0, 0);
        return issueDate >= fromDate;
      });
    }

    if (filters.toDate) {
      filtered = filtered.filter(inv => {
        const issueDate = new Date(inv.issue_date).setHours(0, 0, 0, 0);
        const toDate = new Date(filters.toDate).setHours(0, 0, 0, 0);
        return issueDate <= toDate;
      });
    }

    return filtered;
  }, [invoices, activeTab, filters.search, filters.fromDate, filters.toDate]);

  // Handle pay invoice
  const handlePay = (invoice) => {
    navigate(`/client/invoices/${invoice.invoice_id}/pay`);
  };

  // Statistics cards
  const statsCards = [
    {
      title: 'إجمالي الفواتير',
      value: stats?.total || 0,
      amount: formatCurrency(stats?.totalAmount || 0, 'ILS'),
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'الفواتير المدفوعة',
      value: stats?.paid || 0,
      amount: formatCurrency(stats?.paidAmount || 0, 'ILS'),
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'الفواتير المعلقة',
      value: stats?.pending || 0,
      amount: formatCurrency(stats?.pendingAmount || 0, 'ILS'),
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'الفواتير المتأخرة',
      value: stats?.overdue || 0,
      amount: formatCurrency(stats?.pendingAmount || 0, 'ILS'),
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

  const tabs = [
    { id: 'all', label: 'الكل', count: invoices.length },
    { id: 'pending', label: 'معلق', count: stats?.pending || 0 },
    { id: 'paid', label: 'مدفوع', count: stats?.paid || 0 },
    { id: 'overdue', label: 'متأخر', count: stats?.overdue || 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">الفواتير</h1>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">عرض ودفع جميع الفواتير الخاصة بك</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 mb-4 sm:mb-8">
            {statsCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 sm:w-6 sm:h-6 ${stat.textColor}`} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{stat.value}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1 truncate">{stat.title}</h3>
                <p className={`text-sm sm:text-xl font-bold ${stat.textColor}`}>{stat.amount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="بحث برقم الفاتورة أو اسم المحامي..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pr-9 sm:pr-10 pl-3 sm:pl-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Date filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 sm:gap-2 mt-3 sm:mt-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-px -mx-3 px-3 sm:mx-0 sm:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 touch-manipulation ${activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="mr-1 sm:mr-2 px-1.5 sm:px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List */}
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 sm:p-6 text-center">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 dark:text-red-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-red-800 dark:text-red-300">حدث خطأ أثناء تحميل الفواتير</p>
            <button
              onClick={refetch}
              className="mt-3 sm:mt-4 px-4 py-2 text-sm bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 touch-manipulation"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 sm:p-12 text-center">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">لا توجد فواتير</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">لم تستلم أي فواتير بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.invoice_id}
                invoice={invoice}
                userType="client"
                onDownload={(inv) => {
                  // TODO: Implement PDF download
                  alert('سيتم تنفيذ تحميل PDF قريباً');
                }}
                // Pass pay button as additional action
                additionalActions={
                  (invoice.status === 'pending' || invoice.status === 'overdue') ? (
                    <button
                      onClick={() => handlePay(invoice)}
                      className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors font-medium touch-manipulation"
                    >
                      <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>ادفع الآن</span>
                    </button>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientInvoices;
