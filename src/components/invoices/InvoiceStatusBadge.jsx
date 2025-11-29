import React from 'react';
import { getInvoiceStatusLabel, getInvoiceStatusColor } from '../../services/invoiceService';

/**
 * Invoice Status Badge Component
 * Displays invoice status with appropriate color
 */
const InvoiceStatusBadge = ({ status, className = '' }) => {
  const label = getInvoiceStatusLabel(status);
  const color = getInvoiceStatusColor(status);

  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClasses[color] || colorClasses.gray
        } ${className}`}
    >
      {label}
    </span>
  );
};

export default InvoiceStatusBadge;
