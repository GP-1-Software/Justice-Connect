import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Calendar,
  FileText,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  CreditCard,
  AlertCircle
} from 'lucide-react';

const InvoiceDetailsModal = ({ invoice, onClose, onUpdateStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState(invoice.status);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!invoice) return null;

  const statuses = [
    { value: 'pending', label: 'معلقة' },
    { value: 'paid', label: 'مدفوعة' },
    { value: 'overdue', label: 'متأخرة' },
    { value: 'cancelled', label: 'ملغية' }
  ];

  const handleUpdateStatus = async () => {
    if (selectedStatus === invoice.status) return;
    
    setIsUpdating(true);
    try {
      await onUpdateStatus(invoice.invoice_id, selectedStatus);
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

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-500 text-white p-4 sm:p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold truncate">فاتورة #{invoice.invoice_number}</h2>
              <p className="text-sm text-green-100">تاريخ الإصدار: {formatDate(invoice.issue_date)}</p>
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
              تحديث حالة الفاتورة
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
                disabled={isUpdating || selectedStatus === invoice.status}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isUpdating ? 'جاري التحديث...' : 'تحديث الحالة'}
              </button>
            </div>
          </div>

          {/* Amount Details */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              تفاصيل المبالغ
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">المبلغ الأساسي</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {parseFloat(invoice.subtotal).toFixed(2)} ₪
                </span>
              </div>
              {invoice.tax_amount && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">
                    الضريبة ({invoice.tax_percentage}%)
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {parseFloat(invoice.tax_amount).toFixed(2)} ₪
                  </span>
                </div>
              )}
              {invoice.discount_amount && (
                <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                  <span>الخصم</span>
                  <span className="text-lg font-semibold">
                    -{parseFloat(invoice.discount_amount).toFixed(2)} ₪
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">المبلغ الإجمالي</span>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {parseFloat(invoice.total_amount).toFixed(2)} ₪
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Client and Lawyer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Information */}
            {invoice.client && (
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
                      {invoice.client.first_name} {invoice.client.last_name}
                    </span>
                  </p>
                  {invoice.client.id_number && (
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">رقم الهوية: </span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {invoice.client.id_number}
                      </span>
                    </p>
                  )}
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{invoice.client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{invoice.client.phone}</span>
                  </div>
                  {invoice.client.city && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 dark:text-white">{invoice.client.city}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lawyer Information */}
            {invoice.lawyer && (
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
                      {invoice.lawyer.first_name} {invoice.lawyer.last_name}
                    </span>
                  </p>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{invoice.lawyer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{invoice.lawyer.phone}</span>
                  </div>
                  {invoice.lawyer.specialization && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {invoice.lawyer.specialization.map((spec, index) => (
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

          {/* Dates */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              التواريخ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ الإصدار</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatDate(invoice.issue_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ الاستحقاق</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatDate(invoice.due_date)}
                </p>
              </div>
              {invoice.paid_date && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ الدفع</p>
                  <p className="text-base font-semibold text-green-600 dark:text-green-400">
                    {formatDate(invoice.paid_date)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Related Case or Appointment */}
          {invoice.case && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                القضية المرتبطة
              </h3>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {invoice.case.title}
              </p>
              {invoice.case.case_number && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  رقم القضية: {invoice.case.case_number}
                </p>
              )}
            </div>
          )}

          {invoice.appointment && !invoice.case && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                الموعد المرتبط
              </h3>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {invoice.appointment.appointment_type || 'موعد'}
              </p>
              {invoice.appointment.appointment_number && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  رقم الموعد: {invoice.appointment.appointment_number}
                </p>
              )}
            </div>
          )}

          {/* Payments */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                المدفوعات ({invoice.payments.length})
              </h3>
              <div className="space-y-2">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.payment_id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {parseFloat(payment.amount).toFixed(2)} ₪
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(payment.payment_date || payment.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      payment.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      payment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {payment.status === 'completed' ? 'مكتملة' :
                       payment.status === 'pending' ? 'معلقة' : 'فاشلة'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                ملاحظات
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;
