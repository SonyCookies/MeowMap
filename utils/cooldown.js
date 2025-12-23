/**
 * Cooldown utility functions
 * Handles formatting and managing cooldown timers
 */

/**
 * Format cooldown time as MM:SS
 * @param {number} seconds - Cooldown time in seconds
 * @returns {string} Formatted time string (MM:SS)
 */
export const formatCooldown = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

