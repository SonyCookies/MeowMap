/**
 * Password strength checker utility
 * Analyzes password and returns strength level, requirements, and visual indicators
 */

export const checkPasswordStrength = (password) => {
  if (!password) {
    return null;
  }

  let strength = 0;
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  // Count met requirements
  if (requirements.length) strength += 1;
  if (requirements.lowercase) strength += 1;
  if (requirements.uppercase) strength += 1;
  if (requirements.number) strength += 1;
  if (requirements.special) strength += 1;

  let level = 'weak';
  let color = '#FF3B30';
  let label = 'Weak';

  if (strength <= 2) {
    level = 'weak';
    color = '#FF3B30';
    label = 'Weak';
  } else if (strength === 3) {
    level = 'medium';
    color = '#FF9500';
    label = 'Medium';
  } else if (strength >= 4) {
    level = 'strong';
    color = '#34C759';
    label = 'Strong';
  }

  return {
    level,
    color,
    label,
    strength,
    requirements,
  };
};

