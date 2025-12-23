// 1. React and React Native
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 2. Third-party libraries
// (None in this context)

// 3. Local utilities and hooks
import { createNotification, updateNotificationTime } from '../utils/notifications';
import {
  getNotifications,
  createNotification as createNotificationDB,
  markNotificationAsRead,
  markAllNotificationsAsRead as markAllNotificationsAsReadDB,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
} from '../services/notificationService';
import { useAuth } from './AuthContext';

// 4. Local components
// (None in this context)

// 5. Constants and contexts
// (None in this context)

const NotificationContext = createContext(null);

/**
 * Notification Provider
 * Manages app-wide notifications state using Supabase
 */
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await getNotifications(user.id);
      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      // Update time display for all notifications
      const updated = (data || []).map(updateNotificationTime);
      setNotifications(updated);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load notifications from database when user changes
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user?.id, loadNotifications]);

  /**
   * Add a new notification
   * @param {Object} notificationData - Notification data (title, message, type)
   */
  const addNotification = useCallback(async (notificationData) => {
    if (!user?.id) {
      console.warn('Cannot add notification: user not logged in');
      return;
    }

    try {
      const { data, error } = await createNotificationDB(user.id, notificationData);
      if (error) {
        console.error('Error creating notification:', error);
        return;
      }

      if (data) {
        // Update time display and add to local state
        const updatedNotification = updateNotificationTime(data);
        setNotifications((prev) => [updatedNotification, ...prev]);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }, [user?.id]);

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { data, error } = await markNotificationAsRead(notificationId);
      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update local state optimistically
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await markAllNotificationsAsReadDB(user.id);
      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      // Update local state
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id]);

  /**
   * Remove a notification
   * @param {string} notificationId - Notification ID
   */
  const removeNotification = useCallback(async (notificationId) => {
    try {
      const { error } = await deleteNotification(notificationId);
      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      // Update local state
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await deleteAllNotifications(user.id);
      if (error) {
        console.error('Error clearing all notifications:', error);
        return;
      }

      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, [user?.id]);

  /**
   * Get unread notifications count
   */
  const getUnreadCount = useCallback(() => {
    return notifications.filter((notif) => !notif.read).length;
  }, [notifications]);

  /**
   * Refresh notifications from database
   */
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // Update notification times periodically (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) => prev.map(updateNotificationTime));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);


  const value = {
    notifications,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    getUnreadCount,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook to use notification context
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

