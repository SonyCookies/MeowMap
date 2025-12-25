/**
 * Notification Utilities
 * Helper functions for creating notification objects
 */

/**
 * Create a notification object (for local use, database will generate ID)
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type (cat, community, achievement, message, system, profile)
 * @returns {Object} Notification data object (for database insertion)
 */
export const createNotification = ({ title, message, type = 'system' }) => {
  return {
    title,
    message,
    type,
  };
};

/**
 * Format time ago from ISO string
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted time string (e.g., "2m ago", "1h ago")
 */
export const formatTimeAgo = (isoString) => {
  if (!isoString) {
    return 'now';
  }

  try {
    const now = new Date();
    const then = new Date(isoString);
    
    // Check if date is valid
    if (isNaN(then.getTime())) {
      console.warn('Invalid date string:', isoString);
      return 'now';
    }

    const diffInSeconds = Math.floor((now - then) / 1000);

    // Handle negative differences (future dates)
    if (diffInSeconds < 0) {
      return 'now';
    }

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      // Less than a week
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else if (diffInSeconds < 2592000) {
      // Less than a month
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks}w ago`;
    } else if (diffInSeconds < 31536000) {
      // Less than a year
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}mo ago`;
    } else {
      // More than a year - show actual date
      return then.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: then.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.error('Error formatting time ago:', error);
    return 'now';
  }
};

/**
 * Update notification time display
 * @param {Object} notification - Notification object from database
 * @returns {Object} Notification with updated time display
 */
export const updateNotificationTime = (notification) => {
  // Handle both created_at (from database) and createdAt (legacy)
  const createdAt = notification.created_at || notification.createdAt;
  return {
    ...notification,
    time: createdAt ? formatTimeAgo(createdAt) : 'now',
  };
};

