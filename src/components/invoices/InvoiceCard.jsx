import React from 'react';
import { useNavigate } from 'react-router-dom';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { formatCurrency } from '../../services/invoiceService';
import { FileText, Calendar, User, Eye, Download, Edit, Trash2 } from 'lucide-react';

/**
 * Invoice Card Component
 * Displays invoice summary in a card format
 */
const InvoiceCard = ({
  invoice,
  userType,
  onView,
  onEdit,
  onDelete,
  onDownload,
  additionalActions,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleView = () => {
    if (onView) {
      onView(invoice);
    } else {
      navigate(`/${userType}/invoices/${invoice.invoice_id}`);
    }
  };

  const formatDate = (date) => {
    // Use Gregorian calendar (ar-EG or ar-JO for Arabic with Gregorian)
    return new Date(date).toLocaleDateString('ar-JO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory' // Force Gregorian calendar
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('ar-JO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'gregory'
    });
  };

  // Check if invoice was updated after creation
  const isUpdated = invoice.updated_at && invoice.created_at &&
    new Date(invoice.updated_at) > new Date(invoice.created_at);

  // Calculate time difference for "recently updated" indicator
  const updatedRecently = isUpdated &&
    (new Date() - new Date(invoice.updated_at)) < (24 * 60 * 60 * 1000); // Less than 24 hours

  const canEdit = userType === 'lawyer' && (invoice.status === 'pending' || invoice.status === 'overdue');
  const canDelete = userType === 'lawyer' && (invoice.status === 'pending' || invoice.status === 'overdue');

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border ${updatedRecently
          ? 'border-orange-300 dark:border-orange-600 shadow-orange-100 dark:shadow-orange-900/20'
          : isUpdated
            ? 'border-amber-300 dark:border-amber-600 shadow-amber-50 dark:shadow-amber-900/20'
            : 'border-gray-200 dark:border-gray-700'
        } ${className}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {invoice.invoice_number}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userType === 'lawyer' ? invoice.client?.first_name : invoice.lawyer?.first_name}{' '}
                {userType === 'lawyer' ? invoice.client?.last_name : invoice.lawyer?.last_name}
              </p>
            </div>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>تاريخ الإصدار: {formatDate(invoice.issue_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>تاريخ الاستحقاق: {formatDate(invoice.due_date)}</span>
          </div>
          {isUpdated && (
            <div className={`flex items-center gap-2 text-sm ${updatedRecently ? 'text-orange-600 dark:text-orange-400' : 'text-amber-600 dark:text-amber-400'}`}>
              <Edit className="w-4 h-4" />
              <span className="font-medium">
                تم التعديل: {formatDateTime(invoice.updated_at)}
              </span>
              {updatedRecently && (
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs rounded-full font-medium">
                  حديث
                </span>
              )}
            </div>
          )}
          {invoice.case && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4" />
              <span>القضية: {invoice.case.title}</span>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">المبلغ الإجمالي</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(invoice.total_amount, invoice.currency)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {/* View Button */}
            <button
              onClick={handleView}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors font-medium"
            >
              <Eye className="w-4 h-4" />
              <span>عرض</span>
            </button>

            {/* Additional Actions (Pay Now for client) */}
            {additionalActions}

            {/* Download Button */}
            {onDownload && (
              <button
                onClick={() => onDownload(invoice)}
                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="تحميل PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Edit Button (Lawyer only) */}
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(invoice)}
                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="تعديل"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {/* Delete Button (Lawyer only) */}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(invoice)}
                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;
