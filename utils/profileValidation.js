/**
 * Profile validation utilities
 * Validates profile fields like display name, bio, location, and phone number
 */

import { validatePhoneNumber } from './phoneFormatting';

/**
 * Validates display name
 * @param {string} name - The display name to validate
 * @returns {{ isValid: boolean, error: string }} - Validation result
 */
export const validateDisplayName = (name) => {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: 'Display name is required',
    };
  }
  if (name.trim().length < 2) {
    return {
      isValid: false,
      error: 'Name must be at least 2 characters',
    };
  }
  if (name.trim().length > 50) {
    return {
      isValid: false,
      error: 'Name must be less than 50 characters',
    };
  }
  return {
    isValid: true,
    error: '',
  };
};

/**
 * Validates bio
 * @param {string} bio - The bio to validate
 * @returns {{ isValid: boolean, error: string }} - Validation result
 */
export const validateBio = (bio) => {
  if (!bio || bio.trim().length === 0) {
    return {
      isValid: false,
      error: 'Bio is required',
    };
  }
  if (bio.trim().length < 10) {
    return {
      isValid: false,
      error: 'Bio must be at least 10 characters',
    };
  }
  if (bio.trim().length > 500) {
    return {
      isValid: false,
      error: 'Bio must be less than 500 characters',
    };
  }
  return {
    isValid: true,
    error: '',
  };
};

/**
 * Validates location
 * @param {string} location - The location to validate
 * @returns {{ isValid: boolean, error: string }} - Validation result
 */
export const validateLocation = (location) => {
  if (!location || location.trim().length === 0) {
    return {
      isValid: false,
      error: 'Location is required',
    };
  }
  if (location.trim().length > 200) {
    return {
      isValid: false,
      error: 'Location must be less than 200 characters',
    };
  }
  return {
    isValid: true,
    error: '',
  };
};

/**
 * Validates phone number using phoneFormatting utility
 * @param {string} phone - The phone number to validate
 * @returns {{ isValid: boolean, error: string }} - Validation result
 */
export const validatePhone = (phone) => {
  return validatePhoneNumber(phone);
};

/**
 * Validates entire profile form
 * @param {Object} profileData - Profile data object
 * @param {string} profileData.displayName - Display name
 * @param {string} profileData.bio - Bio
 * @param {string} profileData.location - Location
 * @param {string} profileData.phoneNumber - Phone number
 * @returns {{ isValid: boolean, errors: Object }} - Validation result with errors object
 */
export const validateProfileForm = (profileData) => {
  const { displayName, bio, location, phoneNumber } = profileData;
  
  const displayNameResult = validateDisplayName(displayName);
  const bioResult = validateBio(bio);
  const locationResult = validateLocation(location);
  const phoneResult = validatePhone(phoneNumber);
  
  const isValid = displayNameResult.isValid && 
                  bioResult.isValid && 
                  locationResult.isValid && 
                  phoneResult.isValid;
  
  return {
    isValid,
    errors: {
      displayName: displayNameResult.error,
      bio: bioResult.error,
      location: locationResult.error,
      phone: phoneResult.error,
    },
  };
};

