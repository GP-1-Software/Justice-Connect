import React from 'react';
import { Search, Filter, X } from 'lucide-react';

const PaymentFilters = ({ 
  viewMode,
  setViewMode,
  searchTerm, 
  setSearchTerm, 
  selectedStatus, 
  setSelectedStatus,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  selectedLawyer,
  setSelectedLawyer,
  selectedDateRange,
  setSelectedDateRange,
  customDateFrom,
  setCustomDateFrom,
  customDateTo,
  setCustomDateTo,
  lawyersList,
  onClearFilters 
}) => {
  const invoiceStatuses = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'معلقة' },
    { value: 'paid', label: 'مدفوعة' },
    { value: 'overdue', label: 'متأخرة' },
    { value: 'cancelled', label: 'ملغية' }
  ];

  const paymentStatuses = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'معلقة' },
    { value: 'completed', label: 'مكتملة' },
    { value: 'failed', label: 'فاشلة' },
    { value: 'refunded', label: 'مستردة' }
  ];

  const paymentMethods = [
    { value: 'all', label: 'الكل' },
    { value: 'credit_card', label: 'بطاقة ائتمان' },
    { value: 'debit_card', label: 'بطاقة مدين' },
    { value: 'cash', label: 'نقداً' },
    { value: 'bank_transfer', label: 'تحويل بنكي' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'other', label: 'أخرى' }
  ];

  const dateRanges = [
    { value: 'all', label: 'كل الفترات' },
    { value: 'today', label: 'اليوم' },
    { value: 'week', label: 'آخر أسبوع' },
    { value: 'month', label: 'آخر شهر' },
    { value: '3months', label: 'آخر 3 أشهر' },
    { value: 'year', label: 'آخر سنة' },
    { value: 'custom', label: 'تحديد مخصص' }
  ];

  const hasActiveFilters = 
    searchTerm || 
    selectedStatus !== 'all' || 
    selectedPaymentMethod !== 'all' ||
    selectedLawyer !== 'all' ||
    selectedDateRange !== 'all';

  const statuses = viewMode === 'invoices' ? invoiceStatuses : paymentStatuses;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            تصفية {viewMode === 'invoices' ? 'الفواتير' : 'المدفوعات'}
          </h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <X className="h-4 w-4" />
            <span>مسح الفلاتر</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            بحث
          </label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={viewMode === 'invoices' ? 'ابحث برقم الفاتورة، رقم الهوية، أو اسم العميل...' : 'ابحث برقم المعاملة، رقم الهوية، أو اسم العميل...'}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            الحالة
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter (only for payments) */}
        {viewMode === 'payments' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              طريقة الدفع
            </label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lawyer Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            المحامي
          </label>
          <select
            value={selectedLawyer}
            onChange={(e) => setSelectedLawyer(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">جميع المحامين</option>
            {lawyersList && lawyersList.map((lawyer) => (
              <option key={lawyer.lawyer_id} value={lawyer.lawyer_id}>
                {lawyer.first_name} {lawyer.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            الفترة الزمنية
          </label>
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Date Range */}
      {selectedDateRange === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              من تاريخ
            </label>
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFilters;
