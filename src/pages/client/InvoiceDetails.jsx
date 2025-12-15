import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoice } from '../../hooks/useInvoices';
import { formatCurrency } from '../../services/invoiceService';
import InvoiceStatusBadge from '../../components/invoices/InvoiceStatusBadge';
import {
  ArrowRight,
  FileText,
  Calendar,
  User,
  Download,
  CreditCard,
  Mail,
  Phone
} from 'lucide-react';

/**
 * Client Invoice Details Page
 */
const InvoiceDetails = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { invoice, loading, error } = useInvoice(parseInt(invoiceId));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">الفاتورة غير موجودة</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-JO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const canPay = invoice.status === 'pending' || invoice.status === 'overdue';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {invoice.invoice_number}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">تفاصيل الفاتورة</p>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            {/* Lawyer Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">معلومات المحامي</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-900 dark:text-white">
                    {invoice.lawyer?.first_name} {invoice.lawyer?.last_name}
                  </span>
                </div>
                {invoice.lawyer?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">{invoice.lawyer.email}</span>
                  </div>
                )}
                {invoice.lawyer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">{invoice.lawyer.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">معلومات الفاتورة</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    تاريخ الإصدار: {formatDate(invoice.issue_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    تاريخ الاستحقاق: {formatDate(invoice.due_date)}
                  </span>
                </div>
                {invoice.case && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      القضية: {invoice.case.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">بنود الفاتورة</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">الوصف</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">الكمية</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">السعر</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">المجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{item.description}</td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.unit_price, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-left text-gray-900 dark:text-white font-medium">
                        {formatCurrency(item.total_price, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="max-w-sm mr-auto space-y-3">
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>المجموع الفرعي</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>

              {invoice.tax_percentage > 0 && (
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                  <span>الضريبة ({invoice.tax_percentage}%)</span>
                  <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                </div>
              )}

              {invoice.discount_amount > 0 && (
                <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                  <span>الخصم</span>
                  <span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                <span>المجموع الإجمالي</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatCurrency(invoice.total_amount, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ملاحظات</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Terms */}
          {invoice.terms_conditions && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الشروط والأحكام</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">{invoice.terms_conditions}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {canPay && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/client/invoices/${invoice.invoice_id}/pay`)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              <span>دفع الفاتورة</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;
