import React from 'react';
import { 
  FileText, 
  User, 
  Briefcase, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const InvoiceCard = ({ invoice, onClick }) => {
  // Status colors and icons
  const statusConfig = {
    pending: {
      color: 'yellow',
      icon: Clock,
      label: 'معلقة',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
    },
    paid: {
      color: 'green',
      icon: CheckCircle,
      label: 'مدفوعة',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    },
    overdue: {
      color: 'red',
      icon: AlertTriangle,
      label: 'متأخرة',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    },
    cancelled: {
      color: 'gray',
      icon: XCircle,
      label: 'ملغية',
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      text: 'text-gray-700 dark:text-gray-400',
      badge: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
    }
  };

  const status = statusConfig[invoice.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Check if overdue
  const isOverdue = () => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    return dueDate < today;
  };

  return (
    <div
      onClick={onClick}
      className={`${status.bg} border ${status.border} rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] relative overflow-hidden`}
    >
      {/* Overdue Badge */}
      {isOverdue() && invoice.status !== 'overdue' && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
          متأخرة
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 space-x-reverse flex-1 min-w-0">
          <div className={`p-2 sm:p-3 ${status.badge} rounded-lg flex-shrink-0`}>
            <FileText className={`h-5 w-5 sm:h-6 sm:w-6 ${status.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
              فاتورة #{invoice.invoice_number}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              تاريخ الإصدار: {formatDate(invoice.issue_date)}
            </p>
          </div>
        </div>
        
        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${status.badge} flex items-center space-x-1 space-x-reverse flex-shrink-0 mr-2`}>
          <StatusIcon className="h-3 w-3" />
          <span>{status.label}</span>
        </span>
      </div>

      {/* Amount */}
      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">المبلغ الإجمالي</span>
          <div className="flex items-center space-x-2 space-x-reverse">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {parseFloat(invoice.total_amount).toFixed(2)} ₪
            </span>
          </div>
        </div>
        {invoice.subtotal && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>المبلغ الأساسي: {parseFloat(invoice.subtotal).toFixed(2)} ₪</span>
            {invoice.tax_amount && <span className="mr-3">الضريبة: {parseFloat(invoice.tax_amount).toFixed(2)} ₪</span>}
          </div>
        )}
      </div>

      {/* Client and Lawyer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Client */}
        {invoice.client && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">العميل</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {invoice.client.first_name} {invoice.client.last_name}
              </p>
            </div>
          </div>
        )}

        {/* Lawyer */}
        {invoice.lawyer && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
              <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">المحامي</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {invoice.lawyer.first_name} {invoice.lawyer.last_name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Case or Appointment Info */}
      {invoice.case && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">القضية المرتبطة</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {invoice.case.title}
          </p>
          {invoice.case.case_number && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {invoice.case.case_number}
            </p>
          )}
        </div>
      )}

      {invoice.appointment && !invoice.case && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">الموعد المرتبط</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {invoice.appointment.appointment_type || 'موعد'}
          </p>
          {invoice.appointment.appointment_number && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {invoice.appointment.appointment_number}
            </p>
          )}
        </div>
      )}

      {/* Footer - Dates */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-600 dark:text-gray-400">
          <Calendar className="h-3 w-3" />
          <span>تاريخ الاستحقاق:</span>
          <span className={`font-medium ${isOverdue() && invoice.status !== 'paid' ? 'text-red-600 dark:text-red-400' : ''}`}>
            {formatDate(invoice.due_date)}
          </span>
        </div>
        
        {invoice.paid_date && (
          <div className="flex items-center space-x-1 space-x-reverse text-xs text-green-600 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            <span>تاريخ الدفع:</span>
            <span className="font-medium">
              {formatDate(invoice.paid_date)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceCard;
