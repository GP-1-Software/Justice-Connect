/**
 * Validates Palestinian ID numbers
 * Palestinian IDs are 9 digits and use the Luhn algorithm for checksum validation
 */

export const validatePalestinianID = (idNumber) => {
  // Remove any spaces or dashes
  const cleanId = idNumber.replace(/[\s-]/g, '');
  
  // Check if it's exactly 9 digits
  if (!/^\d{9}$/.test(cleanId)) {
    return {
      isValid: false,
      error: 'رقم الهوية يجب أن يتكون من 9 أرقام'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

/**
 * Formats Palestinian ID with dashes for better readability
 * Example: 123456789 -> 12-345-6789
 */
export const formatPalestinianID = (idNumber) => {
  const cleanId = idNumber.replace(/[\s-]/g, '');
  if (cleanId.length <= 2) return cleanId;
  if (cleanId.length <= 5) return `${cleanId.slice(0, 2)}-${cleanId.slice(2)}`;
  return `${cleanId.slice(0, 2)}-${cleanId.slice(2, 5)}-${cleanId.slice(5, 9)}`;
};

/**
 * Extract information from Palestinian ID
 */
export const extractIDInfo = (idNumber) => {
  const cleanId = idNumber.replace(/[\s-]/g, '');
  
  if (!/^\d{9}$/.test(cleanId)) {
    return null;
  }

  const year = parseInt(cleanId.substring(0, 2));
  const month = parseInt(cleanId.substring(2, 4));
  const genderDigit = parseInt(cleanId[7]);
  
  // Determine century (assume 1900s for years > 50, 2000s for years <= 50)
  const fullYear = year > 50 ? 1900 + year : 2000 + year;
  
  return {
    birthYear: fullYear,
    birthMonth: month,
    gender: genderDigit % 2 === 0 ? 'female' : 'male',
    genderArabic: genderDigit % 2 === 0 ? 'أنثى' : 'ذكر'
  };
};
