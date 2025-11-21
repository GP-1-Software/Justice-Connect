import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  FileText,
  AlertCircle
} from 'lucide-react';

const PaymentDetailsModal = ({ payment, onClose, onUpdateStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState(payment.status);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!payment) return null;

  const statuses = [
    { value: 'pending', label: 'معلقة' },
    { value: 'completed', label: 'مكتملة' },
    { value: 'failed', label: 'فاشلة' },
    { value: 'refunded', label: 'مستردة' }
  ];

  const handleUpdateStatus = async () => {
    if (selectedStatus === payment.status) return;
    
    setIsUpdating(true);
    try {
      await onUpdateStatus(payment.payment_id, selectedStatus);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const paymentMethodLabels = {
    'credit_card': 'بطاقة ائتمان',
    'debit_card': 'بطاقة مدين',
    'cash': 'نقداً',
    'bank_transfer': 'تحويل بنكي',
    'paypal': 'PayPal',
    'other': 'أخرى'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 sm:p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold truncate">دفعة #{payment.payment_id}</h2>
              {payment.transaction_id && (
                <p className="text-sm text-blue-100">معرف المعاملة: {payment.transaction_id}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition flex-shrink-0"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Update Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              تحديث حالة الدفعة
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating || selectedStatus === payment.status}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isUpdating ? 'جاري التحديث...' : 'تحديث الحالة'}
              </button>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">المبلغ المدفوع</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {parseFloat(payment.amount).toFixed(2)} ₪
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              تفاصيل الدفع
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">طريقة الدفع</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {paymentMethodLabels[payment.payment_method] || payment.payment_method}
                </p>
              </div>
              {payment.payment_gateway && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">بوابة الدفع</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {payment.payment_gateway}
                  </p>
                </div>
              )}
              {payment.payment_date && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ الدفع</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatDate(payment.payment_date)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ الإنشاء</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatDate(payment.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Information */}
          {payment.invoice && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  الفاتورة المرتبطة
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  فاتورة #{payment.invoice.invoice_number}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">المبلغ الإجمالي: </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {parseFloat(payment.invoice.total_amount).toFixed(2)} ₪
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">الحالة: </span>
                    <span className={`font-semibold ${
                      payment.invoice.status === 'paid' ? 'text-green-600 dark:text-green-400' :
                      payment.invoice.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {payment.invoice.status === 'paid' ? 'مدفوعة' :
                       payment.invoice.status === 'pending' ? 'معلقة' :
                       payment.invoice.status === 'overdue' ? 'متأخرة' : 'ملغية'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Client and Lawyer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Information */}
            {payment.client && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    معلومات العميل
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">الاسم: </span>
                    <span className="text-gray-900 dark:text-white">
                      {payment.client.first_name} {payment.client.last_name}
                    </span>
                  </p>
                  {payment.client.id_number && (
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">رقم الهوية: </span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {payment.client.id_number}
                      </span>
                    </p>
                  )}
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{payment.client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{payment.client.phone}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lawyer Information */}
            {payment.lawyer && (
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    معلومات المحامي
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">الاسم: </span>
                    <span className="text-gray-900 dark:text-white">
                      {payment.lawyer.first_name} {payment.lawyer.last_name}
                    </span>
                  </p>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{payment.lawyer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{payment.lawyer.phone}</span>
                  </div>
                  {payment.lawyer.specialization && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {payment.lawyer.specialization.map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                ملاحظات
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {payment.notes}
              </p>
            </div>
          )}

          {/* Payment Proof */}
          {payment.payment_proof_url && (
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                إثبات الدفع
              </h3>
              <a
                href={payment.payment_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                عرض إثبات الدفع
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
