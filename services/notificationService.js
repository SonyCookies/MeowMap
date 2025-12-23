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

