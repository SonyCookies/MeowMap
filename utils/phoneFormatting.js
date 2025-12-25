/**
 * Phone number formatting utilities for Philippine mobile numbers
 * Formats phone numbers to +63XXXXXXXXXX format
 */

/**
 * Formats a phone number to Philippine (+63) format
 * @param {string} phone - The phone number to format
 * @returns {string} - Formatted phone number in +63XXXXXXXXXX format
 */
export const formatPhoneNumber = (phone) => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 63, add +
  if (digits.startsWith('63')) {
    return `+${digits}`;
  }
  // If starts with 0, replace with +63
  if (digits.startsWith('0')) {
    return `+63${digits.substring(1)}`;
  }
  // If 9 digits (mobile number without country code), add +63
  if (digits.length === 9) {
    return `+63${digits}`;
  }
  // If 10 digits (with leading 0), replace 0 with +63
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+63${digits.substring(1)}`;
  }
  // Otherwise, just add +63 if it doesn't already have it
  if (digits.length > 0 && !phone.startsWith('+')) {
    return `+63${digits}`;
  }
  return phone;
};

/**
 * Validates a Philippine mobile phone number
 * @param {string} phone - The phone number to validate
 * @returns {{ isValid: boolean, error: string }} - Validation result
 */
export const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim().length === 0) {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }
  
  // Remove all non-digits for validation
  const digits = phone.replace(/\D/g, '');
  
  // Must start with 63 (country code)
  if (!digits.startsWith('63')) {
    return {
      isValid: false,
      error: 'Phone number must start with +63',
    };
  }
  
  // Must be exactly 12 digits (+63 followed by 9 digits = 12 total)
  if (digits.length !== 12) {
    return {
      isValid: false,
      error: 'Phone number must be +63 followed by 9 digits (e.g., +639123456789)',
    };
  }
  
  // Check if the number after 63 is valid (should start with 9 for mobile)
  const mobileNumber = digits.substring(2);
  if (!mobileNumber.startsWith('9')) {
    return {
      isValid: false,
      error: 'Mobile number must start with 9 (e.g., +639123456789)',
    };
  }
  
  return {
    isValid: true,
    error: '',
  };
};

