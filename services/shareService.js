// 1. React and React Native
import { Share, Platform, Linking } from 'react-native';

/**
 * Share Service
 * Handles sharing sighting data to other apps
 */

/**
 * Format sighting data into a shareable message
 * @param {Object} sighting - Sighting object
 * @returns {string} Formatted message
 */
const formatSightingMessage = (sighting) => {
  const lines = [];
  
  // Emoji and cat name
  lines.push(`🐱 Cat Sighting: ${sighting.cat_name || 'Untitled'}`);
  lines.push('');
  
  // Location
  if (sighting.latitude && sighting.longitude) {
    lines.push(`📍 Location: ${sighting.latitude.toFixed(6)}, ${sighting.longitude.toFixed(6)}`);
  }
  
  // Date
  if (sighting.created_at) {
    const date = new Date(sighting.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    lines.push(`📅 Spotted: ${formattedDate}`);
  }
  
  // Urgency level
  if (sighting.urgency_level) {
    const urgencyEmoji = {
      'Just chilling': '😊',
      'Needs food': '🍽️',
      'Appears injured': '⚠️',
    };
    const emoji = urgencyEmoji[sighting.urgency_level] || '📋';
    lines.push(`${emoji} Status: ${sighting.urgency_level}`);
  }
  
  // Description
  if (sighting.description) {
    lines.push(`📝 Description: ${sighting.description}`);
  }
  
  // Coat pattern and color
  if (sighting.coat_pattern || sighting.primary_color) {
    const details = [];
    if (sighting.coat_pattern) {
      details.push(sighting.coat_pattern.split(' (')[0]);
    }
    if (sighting.primary_color) {
      details.push(sighting.primary_color);
    }
    if (details.length > 0) {
      lines.push(`🎨 Appearance: ${details.join(', ')}`);
    }
  }
  
  lines.push('');
  lines.push('Shared from MeowMap 🐾');
  
  return lines.join('\n');
};

/**
 * Generate a deep link URL for the sighting (if deep linking is configured)
 * @param {string} sightingId - Sighting ID
 * @returns {string} Deep link URL
 */
const generateDeepLink = (sightingId) => {
  // For now, return a placeholder. This can be configured with your app's deep link scheme
  // Example: meowmap://sighting/{sightingId}
  // Or web URL: https://meowmap.app/sighting/{sightingId}
  return `https://meowmap.app/sighting/${sightingId}`;
};

/**
 * Share a cat sighting
 * @param {Object} sighting - Sighting object to share
 * @param {Object} options - Share options
 * @param {boolean} options.includePhoto - Whether to include photo (if available)
 * @param {boolean} options.includeDeepLink - Whether to include deep link
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export const shareSighting = async (sighting, options = {}) => {
  try {
    if (!sighting) {
      return { success: false, error: { message: 'Sighting data is required' } };
    }

    const { includePhoto = false, includeDeepLink = true } = options;

    // Format the message
    let message = formatSightingMessage(sighting);

    // Add deep link if requested
    if (includeDeepLink && sighting.id) {
      const deepLink = generateDeepLink(sighting.id);
      message += `\n\nView on MeowMap: ${deepLink}`;
    }

    // Prepare share options
    const shareOptions = {
      message: message,
      title: `Cat Sighting: ${sighting.cat_name || 'Untitled'}`,
    };

    // Include photo if available and requested
    if (includePhoto && sighting.photo_url) {
      shareOptions.url = sighting.photo_url;
    }

    // Use React Native Share API
    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return { success: true, error: null };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: { message: 'Share was dismissed' } };
    }

    return { success: false, error: { message: 'Unknown share action' } };
  } catch (error) {
    console.error('Error sharing sighting:', error);
    return { success: false, error };
  }
};

/**
 * Copy sighting details to clipboard
 * @param {Object} sighting - Sighting object
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export const copySightingToClipboard = async (sighting) => {
  try {
    if (!sighting) {
      return { success: false, error: { message: 'Sighting data is required' } };
    }

    const message = formatSightingMessage(sighting);
    
    // Use Clipboard API (from @react-native-clipboard/clipboard if available)
    // For now, we'll use a workaround with Share API
    // In a real implementation, you'd use: Clipboard.setString(message);
    
    // For React Native, we can use Share with a workaround or install clipboard package
    // For now, return the formatted message so the caller can handle it
    return { success: true, data: message, error: null };
  } catch (error) {
    console.error('Error copying sighting to clipboard:', error);
    return { success: false, error };
  }
};

