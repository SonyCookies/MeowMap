// 1. Third-party libraries
import { supabase } from '../lib/supabase';

/**
 * Notification Service
 * Handles notification operations in Supabase
 */

/**
 * Get all notifications for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {boolean} options.onlyUnread - Only fetch unread notifications
 * @param {number} options.limit - Limit number of results
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const getNotifications = async (userId, options = {}) => {
  try {
    if (!userId) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.onlyUnread) {
      query = query.eq('read', false);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: [], error };
  }
};

/**
 * Create a new notification
 * @param {string} userId - User ID
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Notification type (cat, community, achievement, message, profile, system)
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const createNotification = async (userId, notificationData) => {
  try {
    if (!userId) {
      return { data: null, error: new Error('User ID is required') };
    }

    const { title, message, type = 'system' } = notificationData;

    if (!title) {
      return { data: null, error: new Error('Notification title is required') };
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    if (!notificationId) {
      return { data: null, error: new Error('Notification ID is required') };
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array|null, error: Object|null}>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    if (!userId) {
      return { data: null, error: new Error('User ID is required') };
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .select();

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { data: null, error };
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{error: Object|null}>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    if (!notificationId) {
      return { error: new Error('Notification ID is required') };
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { error };
  }
};

/**
 * Delete all notifications for a user
 * @param {string} userId - User ID
 * @returns {Promise<{error: Object|null}>}
 */
export const deleteAllNotifications = async (userId) => {
  try {
    if (!userId) {
      return { error: new Error('User ID is required') };
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return { error };
  }
};

/**
 * Get unread notifications count for a user
 * @param {string} userId - User ID
 * @returns {Promise<{count: number, error: Object|null}>}
 */
export const getUnreadCount = async (userId) => {
  try {
    if (!userId) {
      return { count: 0, error: null };
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { count: 0, error };
  }
};

/**
 * Create a notification for sighting deletion with undo capability
 * @param {string} userId - User ID
 * @param {Object} sightingData - Full sighting data to store for undo
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const createSightingDeletionNotification = async (userId, sightingData) => {
  try {
    if (!userId) {
      return { data: null, error: new Error('User ID is required') };
    }

    if (!sightingData) {
      return { data: null, error: new Error('Sighting data is required') };
    }

    // Store the full sighting data as JSON in the message field for undo
    const message = JSON.stringify({
      action: 'sighting_deleted',
      sightingData: sightingData,
    });

    // Use the database function to bypass RLS
    const { data: notificationId, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_title: `Sighting deleted: ${sightingData.cat_name || 'Untitled'}`,
      p_message: message,
      p_type: 'cat',
    });

    if (error) throw error;

    // Fetch the created notification
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    return { data: notification, error: null };
  } catch (error) {
    console.error('Error creating deletion notification:', error);
    return { data: null, error };
  }
};

/**
 * Create a notification for sighting creation
 * @param {string} userId - User ID (the creator)
 * @param {Object} sightingData - Sighting data
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const createSightingCreationNotification = async (userId, sightingData) => {
  try {
    if (!userId || !sightingData) {
      return { data: null, error: new Error('User ID and sighting data are required') };
    }

    const messageContent = JSON.stringify({
      action: 'sighting_created',
      sightingId: sightingData.id,
      sightingData: {
        id: sightingData.id,
        cat_name: sightingData.cat_name,
        latitude: sightingData.latitude,
        longitude: sightingData.longitude,
      },
    });

    // Use the database function to bypass RLS
    const { data: notificationId, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_title: `Sighting created: ${sightingData.cat_name || 'Untitled'}`,
      p_message: messageContent,
      p_type: 'cat',
    });

    if (error) throw error;

    // Fetch the created notification
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    return { data: notification, error: null };
  } catch (error) {
    console.error('Error creating sighting creation notification:', error);
    return { data: null, error };
  }
};

/**
 * Create notifications for comment on a sighting
 * Notifies: the sighting creator and all previous commenters (excluding the current commenter)
 * @param {string} sightingId - Sighting ID
 * @param {string} commenterId - User ID of the person who commented
 * @param {string} commenterName - Display name of the commenter
 * @param {string} catName - Cat name from the sighting
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const createCommentNotifications = async (sightingId, commenterId, commenterName, catName) => {
  try {
    if (!sightingId || !commenterId) {
      return { data: [], error: new Error('Sighting ID and commenter ID are required') };
    }

    // Get the sighting to find the creator
    const { data: sighting, error: sightingError } = await supabase
      .from('cat_sightings')
      .select('user_id, cat_name')
      .eq('id', sightingId)
      .single();

    if (sightingError) throw sightingError;

    // Get all existing comments to find previous commenters
    // Note: This query runs BEFORE the new comment is saved, so it won't include the current comment
    const { data: existingComments, error: commentsError } = await supabase
      .from('sighting_comments')
      .select('user_id')
      .eq('sighting_id', sightingId)
      .neq('user_id', commenterId); // Exclude the current commenter from the start

    if (commentsError) throw commentsError;

    // Collect unique user IDs to notify (excluding the current commenter)
    const userIdsToNotify = new Set();

    // Add the sighting creator (if not the commenter)
    if (sighting.user_id && sighting.user_id !== commenterId) {
      userIdsToNotify.add(sighting.user_id);
    }

    // Add all previous commenters (excluding the current commenter)
    // Using Set ensures no duplicates - if creator also commented, they'll only be added once
    (existingComments || []).forEach((comment) => {
      if (comment.user_id && comment.user_id !== commenterId) {
        userIdsToNotify.add(comment.user_id);
      }
    });

    // Create notifications for each user
    const notifications = [];
    const catNameDisplay = catName || sighting.cat_name || 'Untitled';
    const messageContent = JSON.stringify({
      action: 'comment_added',
      sightingId: sightingId,
      commenterId: commenterId,
      commenterName: commenterName,
    });

    for (const userId of userIdsToNotify) {
      // Use the database function to bypass RLS
      const { data: notificationId, error: notifError } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_title: `${commenterName} commented on "${catNameDisplay}"`,
        p_message: messageContent,
        p_type: 'cat',
      });

      if (notifError) {
        console.error(`Error creating notification for user ${userId}:`, notifError);
        // Continue with other notifications even if one fails
      } else if (notificationId) {
        // Fetch the created notification to return it
        const { data: notification } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', notificationId)
          .single();
        if (notification) {
          notifications.push(notification);
        }
      }
    }

    return { data: notifications, error: null };
  } catch (error) {
    console.error('Error creating comment notifications:', error);
    return { data: [], error };
  }
};

/**
 * Create notifications for status update on a sighting
 * Notifies: the sighting creator and all users who have commented (excluding the user who updated the status)
 * @param {string} sightingId - Sighting ID
 * @param {string} updaterId - User ID of the person who updated the status
 * @param {string} updaterName - Display name of the updater
 * @param {string} catName - Cat name from the sighting
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const createStatusUpdateNotifications = async (sightingId, updaterId, updaterName, catName, oldStatus, newStatus) => {
  try {
    if (!sightingId || !updaterId) {
      return { data: [], error: new Error('Sighting ID and updater ID are required') };
    }

    // Get the sighting to find the creator
    const { data: sighting, error: sightingError } = await supabase
      .from('cat_sightings')
      .select('user_id, cat_name')
      .eq('id', sightingId)
      .single();

    if (sightingError) throw sightingError;

    const sightingCreatorId = sighting.user_id;

    // Get all users who have commented on this sighting
    const { data: existingComments, error: commentsError } = await supabase
      .from('sighting_comments')
      .select('user_id')
      .eq('sighting_id', sightingId)
      .neq('user_id', updaterId); // Exclude the current updater

    if (commentsError) throw commentsError;

    // Collect unique user IDs to notify (excluding the updater)
    const userIdsToNotify = new Set();

    // Add sighting creator if they are not the updater
    if (sightingCreatorId && sightingCreatorId !== updaterId) {
      userIdsToNotify.add(sightingCreatorId);
    }

    // Add all commenters (excluding the updater)
    (existingComments || []).forEach((comment) => {
      if (comment.user_id && comment.user_id !== updaterId) {
        userIdsToNotify.add(comment.user_id);
      }
    });

    if (userIdsToNotify.size === 0) {
      return { data: [], error: null }; // No one to notify
    }

    // Get status labels for display
    const statusLabels = {
      sighting: 'Sighting',
      fed: 'Fed',
      taken_to_vet: 'Taken to Vet',
      adopted: 'Adopted',
      gone: 'Gone',
    };

    const oldStatusLabel = statusLabels[oldStatus] || oldStatus;
    const newStatusLabel = statusLabels[newStatus] || newStatus;

    const catNameDisplay = catName || sighting.cat_name || 'Untitled';
    const messageContent = JSON.stringify({
      action: 'status_updated',
      sightingId: sightingId,
      updaterId: updaterId,
      updaterName: updaterName,
      catName: catNameDisplay,
      oldStatus: oldStatus,
      newStatus: newStatus,
    });

    // Create notifications for each user
    const notifications = [];
    for (const userId of userIdsToNotify) {
      // Use the database function to bypass RLS
      const { data: notificationId, error: notifError } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_title: `Status updated: "${catNameDisplay}"`,
        p_message: messageContent,
        p_type: 'cat',
      });

      if (notifError) {
        console.error(`Error creating status update notification for user ${userId}:`, notifError);
        // Continue with other notifications even if one fails
      } else if (notificationId) {
        // Fetch the created notification
        const { data: notification } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', notificationId)
          .single();
        if (notification) {
          notifications.push(notification);
        }
      }
    }

    return { data: notifications, error: null };
  } catch (error) {
    console.error('Error creating status update notifications:', error);
    return { data: [], error };
  }
};
