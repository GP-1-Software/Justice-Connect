import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices, useInvoiceStats, useInvoiceOperations } from '../../hooks/useInvoices';
import InvoiceCard from '../../components/invoices/InvoiceCard';
import EditInvoiceModal from '../../components/invoices/EditInvoiceModal';
import { useLawyerAuth } from '../../hooks/useLawyerAuth';
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';
import { formatCurrency } from '../../services/invoiceService';

/**
 * Lawyer Invoices Page
 * Displays all invoices created by the lawyer with statistics
 */
const LawyerInvoices = () => {
  const navigate = useNavigate();
  const { lawyer } = useLawyerAuth();

  // Get lawyer ID from auth context
  const lawyerId = lawyer?.lawyer_id;

  console.log('🔍 LawyerInvoices - lawyer data:', { lawyer, lawyerId });

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    fromDate: '',
    toDate: ''
  });

  const [activeTab, setActiveTab] = useState('all');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Fetch invoices with real-time updates (only if lawyerId exists)
  const { invoices, loading, error, refetch } = useInvoices(lawyerId, 'lawyer', filters);

  // Fetch statistics
  const { stats, loading: statsLoading } = useInvoiceStats(lawyerId, 'lawyer', 'month');

  // Debug logging
  console.log('📊 LawyerInvoices state:', {
    invoices: invoices?.length,
    loading,
    error,
    lawyerId,
    filters
  });

  // Invoice operations
  const { remove, cancel, update, loading: operationLoading } = useInvoiceOperations();

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
        inv.client?.first_name?.toLowerCase().includes(searchLower) ||
        inv.client?.last_name?.toLowerCase().includes(searchLower)
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

  // Handle delete invoice
  const handleDelete = async (invoice) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

    const { error } = await remove(invoice.invoice_id);
    if (!error) {
      alert('تم حذف الفاتورة بنجاح');
      refetch();
    } else {
      alert('حدث خطأ أثناء حذف الفاتورة');
    }
  };

  // Handle cancel invoice
  const handleCancel = async (invoice) => {
    const reason = window.prompt('سبب الإلغاء:');
    if (!reason) return;

    const { error } = await cancel(invoice.invoice_id, reason);
    if (!error) {
      alert('تم إلغاء الفاتورة بنجاح');
      refetch();
    } else {
      alert('حدث خطأ أثناء إلغاء الفاتورة');
    }
  };

  // Handle edit invoice
  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setEditModalOpen(true);
  };

  // Handle save edited invoice
  const handleSaveEdit = async (updatedInvoice) => {
    const { error } = await update(
      updatedInvoice.invoice_id,
      updatedInvoice,
      updatedInvoice.items
    );

    if (!error) {
      alert('تم تحديث الفاتورة بنجاح');
      setEditModalOpen(false);
      setSelectedInvoice(null);
      refetch(); // Refresh the list
    } else {
      alert('حدث خطأ أثناء تحديث الفاتورة');
    }
  };

  // Handle close edit modal
  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setSelectedInvoice(null);
  };

  // Statistics cards
  const statsCards = [
    {
      title: 'الفواتير المدفوعة',
      value: formatCurrency(stats?.paidAmount || 0, 'ILS'),
      count: stats?.paid || 0,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'الفواتير المعلقة',
      value: formatCurrency(stats?.pendingAmount || 0, 'ILS'),
      count: stats?.pending || 0,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'الفواتير المتأخرة',
      value: formatCurrency(stats?.overdueAmount || 0, 'ILS'),
      count: stats?.overdue || 0,
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'الدخل هذا الشهر',
      value: formatCurrency(stats?.periodPaidAmount || 0, 'ILS'),
      count: stats?.periodTotal || 0,
      icon: TrendingUp,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    }
  ];

  const tabs = [
    { id: 'all', label: 'الكل', count: invoices.length },
    { id: 'pending', label: 'معلق', count: stats?.pending || 0 },
    { id: 'paid', label: 'مدفوع', count: stats?.paid || 0 },
    { id: 'overdue', label: 'متأخر', count: stats?.overdue || 0 },
    { id: 'cancelled', label: 'ملغي', count: stats?.cancelled || 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الفواتير</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">إدارة جميع الفواتير والمدفوعات</p>
            </div>
            <button
              onClick={() => navigate('/lawyer/invoices/create')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">إنشاء فاتورة جديدة</span>
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{stat.count} فاتورة</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{stat.title}</h3>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="بحث برقم الفاتورة أو اسم العميل..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Date filters */}
            <div className="flex gap-2 items-center">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-colors relative ${activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="mr-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <p className="text-red-800 dark:text-red-300">حدث خطأ أثناء تحميل الفواتير</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">لا توجد فواتير</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">ابدأ بإنشاء فاتورة جديدة لعملائك</p>
            <button
              onClick={() => navigate('/lawyer/invoices/create')}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              إنشاء فاتورة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.invoice_id}
                invoice={invoice}
                userType="lawyer"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDownload={(inv) => {
                  // TODO: Implement PDF download
                  alert('سيتم تنفيذ تحميل PDF قريباً');
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        invoice={selectedInvoice}
        isOpen={editModalOpen}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        loading={operationLoading}
      />
    </div>
  );
};

export default LawyerInvoices;
