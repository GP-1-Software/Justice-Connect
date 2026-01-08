/**
 * Format specialization field that might be stored as JSON string
 * @param {string|array} specialization - The specialization value
 * @param {string} separator - The separator to use when joining arrays (default: ' • ')
 * @returns {string} - Formatted specialization string
 */


export const formatSpecialization = (specialization, separator = ' • ') => {
  if (!specialization) return '';

  try {
    // If it's already an array, clean and join
    if (Array.isArray(specialization)) {
      return specialization
        .map(item => {
          if (!item) return '';
          // Clean each item from JSON artifacts
          let cleaned = String(item).trim();
          // Remove {"text"} format
          cleaned = cleaned.replace(/^\{?"?(.+?)"?\}?$/, '$1');
          // Remove extra quotes
          cleaned = cleaned.replace(/^["']|["']$/g, '');
          return cleaned;
        })
        .filter(Boolean)
        .join(separator);
    }

    // If it's a string that looks like PostgreSQL array: {val1,val2}
    if (typeof specialization === 'string') {
      // PostgreSQL array format: {"قانون جنائي","قانون مدني"}
      if (specialization.startsWith('{') && specialization.endsWith('}')) {
        // Remove outer braces
        const content = specialization.slice(1, -1);
        // Split by comma and clean each item
        const items = content.split(',').map(item => {
          let cleaned = item.trim();
          // Remove all quotes and braces
          cleaned = cleaned.replace(/["{}']/g, '');
          return cleaned;
        }).filter(Boolean);
        return items.join(separator);
      }
      
      // Try to parse as JSON array
      if (specialization.startsWith('[')) {
        try {
          const parsed = JSON.parse(specialization);
          if (Array.isArray(parsed)) {
            return parsed
              .map(item => String(item).replace(/["{}']/g, '').trim())
              .filter(Boolean)
              .join(separator);
          }
        } catch {
          // Fallthrough
        }
      }
      
      // Single string value - clean it
      return specialization.replace(/["{}']/g, '').trim();
    }

    // Plain object
    if (typeof specialization === 'object' && specialization !== null) {
      return Object.values(specialization)
        .map(item => String(item).replace(/["{}']/g, '').trim())
        .filter(Boolean)
        .join(separator);
    }

    return String(specialization);
  } catch (err) {
    console.error('Error formatting specialization:', err);
    return String(specialization);
  }
};




/**
 * Format currency amount
 * @param {number|string} amount - The amount to format
 * @param {string} currency - The currency symbol (default: '₪')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = '₪') => {
  if (!amount && amount !== 0) return '';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${numAmount.toLocaleString()} ${currency}`;
};

/**
 * Format phone number
 * @param {string} phone - The phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    // Format: (0XX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
};

/**
 * Format date to Arabic or English based on locale
 * @param {string|Date} date - The date to format
 * @param {string} locale - The locale (default: 'ar-EG')
 * @returns {string} The formatted date string
 */
export const formatDate = (date, locale = 'ar-EG') => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format time to 12-hour or 24-hour format
 * @param {string} time - The time string (HH:mm:ss or HH:mm)
 * @param {boolean} use24Hour - Whether to use 24-hour format (default: false)
 * @returns {string} - Formatted time string
 */
export const formatTime = (time, use24Hour = false) => {
  if (!time) return '';

  const [hour, minute] = time.split(':').map(Number);

  if (use24Hour) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const period = hour >= 12 ? 'م' : 'ص';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
};

/**
 * Truncate text to specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length (default: 100)
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text || '';

  return text.slice(0, maxLength).trim() + suffix;
};

/**
 * Get status badge color based on status
 * @param {string} status - The status value
 * @returns {object} - Object with background and text color classes
 */
export const getStatusColor = (status) => {
  const statusColors = {
    pending: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-800 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    approved: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800'
    },
    confirmed: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800'
    },
    rejected: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800'
    },
    cancelled: {
      bg: 'bg-gray-100 dark:bg-gray-900/20',
      text: 'text-gray-800 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-800'
    },
    completed: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800'
    },
    active: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800'
    },
    closed: {
      bg: 'bg-gray-100 dark:bg-gray-900/20',
      text: 'text-gray-800 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-800'
    }
  };

  return statusColors[status] || statusColors.pending;
};
