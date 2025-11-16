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
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
        colorClasses[color] || colorClasses.gray
      } ${className}`}
    >
      {label}
    </span>
  );
};

export default InvoiceStatusBadge;
