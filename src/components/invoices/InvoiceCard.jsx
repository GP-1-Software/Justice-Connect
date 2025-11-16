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
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border ${
        updatedRecently 
          ? 'border-orange-300 shadow-orange-100' 
          : isUpdated 
            ? 'border-amber-300 shadow-amber-50' 
            : 'border-gray-200'
      } ${className}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {invoice.invoice_number}
              </h3>
              <p className="text-sm text-gray-500">
                {userType === 'lawyer' ? invoice.client?.first_name : invoice.lawyer?.first_name}{' '}
                {userType === 'lawyer' ? invoice.client?.last_name : invoice.lawyer?.last_name}
              </p>
            </div>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>تاريخ الإصدار: {formatDate(invoice.issue_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>تاريخ الاستحقاق: {formatDate(invoice.due_date)}</span>
          </div>
          {isUpdated && (
            <div className={`flex items-center gap-2 text-sm ${updatedRecently ? 'text-orange-600' : 'text-amber-600'}`}>
              <Edit className="w-4 h-4" />
              <span className="font-medium">
                تم التعديل: {formatDateTime(invoice.updated_at)}
              </span>
              {updatedRecently && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                  حديث
                </span>
              )}
            </div>
          )}
          {invoice.case && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>القضية: {invoice.case.title}</span>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">المبلغ الإجمالي</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(invoice.total_amount, invoice.currency)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {/* View Button */}
            <button
              onClick={handleView}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="تحميل PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Edit Button (Lawyer only) */}
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(invoice)}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="تعديل"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {/* Delete Button (Lawyer only) */}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(invoice)}
                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
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
