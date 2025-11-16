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
import { formatCurrency } from '../../services/invoiceService';

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

  // Filter invoices based on active tab
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(inv => inv.status === activeTab);
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
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">الفواتير</h1>
            <p className="text-gray-600 mt-2">عرض ودفع جميع الفواتير الخاصة بك</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <span className="text-sm text-gray-500">{stat.value} فاتورة</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className={`text-xl font-bold ${stat.textColor}`}>{stat.amount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
              placeholder="بحث برقم الفاتورة أو اسم المحامي..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date filters */}
          <div className="flex gap-2 items-center">
            <div>
              <label className="block text-xs text-gray-600 mb-1">من تاريخ</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="mr-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800">حدث خطأ أثناء تحميل الفواتير</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">لا توجد فواتير</h3>
            <p className="text-gray-600">لم تستلم أي فواتير بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <CreditCard className="w-4 h-4" />
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
