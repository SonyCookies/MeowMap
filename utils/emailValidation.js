/**
 * Email validation utility
 * Validates email format using regex
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {Object} Validation result with isValid flag and error message
 */
export const validateEmail = (email) => {
  if (!email) {
    return {
      isValid: false,
      error: '',
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  return {
    isValid: true,
    error: '',
  };
};

