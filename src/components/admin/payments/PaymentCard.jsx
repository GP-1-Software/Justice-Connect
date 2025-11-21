import React from 'react';
import { 
  CreditCard, 
  User, 
  Briefcase, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText
} from 'lucide-react';

const PaymentCard = ({ payment, onClick }) => {
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
    completed: {
      color: 'green',
      icon: CheckCircle,
      label: 'مكتملة',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    },
    failed: {
      color: 'red',
      icon: XCircle,
      label: 'فاشلة',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    },
    refunded: {
      color: 'purple',
      icon: RefreshCw,
      label: 'مستردة',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-400',
      badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
    }
  };

  const status = statusConfig[payment.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  // Payment method labels
  const paymentMethodLabels = {
    'credit_card': 'بطاقة ائتمان',
    'debit_card': 'بطاقة مدين',
    'cash': 'نقداً',
    'bank_transfer': 'تحويل بنكي',
    'paypal': 'PayPal',
    'other': 'أخرى'
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div
      onClick={onClick}
      className={`${status.bg} border ${status.border} rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02]`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 space-x-reverse flex-1 min-w-0">
          <div className={`p-2 sm:p-3 ${status.badge} rounded-lg flex-shrink-0`}>
            <CreditCard className={`h-5 w-5 sm:h-6 sm:w-6 ${status.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">
              دفعة #{payment.payment_id}
            </h3>
            {payment.transaction_id && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                معرف المعاملة: {payment.transaction_id}
              </p>
            )}
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
          <span className="text-sm text-gray-600 dark:text-gray-400">المبلغ المدفوع</span>
          <div className="flex items-center space-x-2 space-x-reverse">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {parseFloat(payment.amount).toFixed(2)} ₪
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">طريقة الدفع</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {paymentMethodLabels[payment.payment_method] || payment.payment_method}
        </p>
        {payment.payment_gateway && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            عبر: {payment.payment_gateway}
          </p>
        )}
      </div>

      {/* Invoice Info */}
      {payment.invoice && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center space-x-2 space-x-reverse mb-1">
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs text-gray-600 dark:text-gray-400">الفاتورة المرتبطة</p>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            فاتورة #{payment.invoice.invoice_number}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            المبلغ الإجمالي: {parseFloat(payment.invoice.total_amount).toFixed(2)} ₪
          </p>
        </div>
      )}

      {/* Client and Lawyer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Client */}
        {payment.client && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">العميل</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {payment.client.first_name} {payment.client.last_name}
              </p>
            </div>
          </div>
        )}

        {/* Lawyer */}
        {payment.lawyer && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
              <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">المحامي</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {payment.lawyer.first_name} {payment.lawyer.last_name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Date */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        {payment.payment_date ? (
          <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-600 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>تاريخ الدفع:</span>
            <span className="font-medium">
              {formatDate(payment.payment_date)}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-600 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>تاريخ الإنشاء:</span>
            <span className="font-medium">
              {formatDate(payment.created_at)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCard;
