// 1. React and React Native
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (None in this component)

// 4. Local components
// (None in this component)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85; // 85% of screen width

/**
 * Notification Drawer Component
 * Slides in from the right side when notification bell is clicked
 */
const NotificationDrawer = ({ visible, onClose, notifications = [], onMarkAllAsRead, onNotificationPress }) => {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    if (visible) {
      // Reset animation values when opening
      slideAnim.setValue(DRAWER_WIDTH);
      backdropOpacity.setValue(0);
      setMounted(true);
      
      // Small delay to ensure smooth animation start
      setTimeout(() => {
        // Animate backdrop and drawer together
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
        ]).start();
      }, 10);
    } else {
      // Slide out animation - ensure smooth closing
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Only unmount after animation completes
        setMounted(false);
      });
    }
  }, [visible, slideAnim, backdropOpacity]);

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleNotificationPress = (notification) => {
    if (onNotificationPress) {
      onNotificationPress(notification);
    }
  };

  // Don't render modal if not mounted (after closing animation)
  if (!visible && !mounted) {
    return null;
  }

  return (
    <Modal
      visible={visible || mounted}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerActions}>
              {notifications.length > 0 && (
                <TouchableOpacity
                  style={styles.markAllButton}
                  onPress={handleMarkAllAsRead}
                >
                  <Text style={styles.markAllButtonText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <FontAwesome name="times" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <FontAwesome
                    name="bell-slash"
                    size={48}
                    color={colors.text}
                    style={{ opacity: 0.3 }}
                  />
                </View>
                <Text style={styles.emptyStateTitle}>No notifications</Text>
                <Text style={styles.emptyStateText}>
                  You're all caught up! New notifications will appear here.
                </Text>
              </View>
            ) : (
              notifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id || index}
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

/**
 * Individual Notification Item Component
 */
const NotificationItem = ({ notification, onPress }) => {
  const isRead = notification.read || false;

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !isRead && styles.notificationItemUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {!isRead && <View style={styles.unreadIndicator} />}
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationTime}>{notification.time}</Text>
        </View>
        {notification.message && (
          <Text
            style={styles.notificationMessage}
            numberOfLines={2}
          >
            {notification.message}
          </Text>
        )}
        {notification.type && (
          <View style={styles.notificationType}>
            {getNotificationIcon(notification.type)}
            <Text style={styles.notificationTypeText}>{notification.type}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Get icon component based on notification type
 */
const getNotificationIcon = (type) => {
  const iconSize = 12;
  const iconColor = colors.primary;
  
  switch (type?.toLowerCase()) {
    case 'cat':
      return <MaterialCommunityIcons name="cat" size={iconSize} color={iconColor} />;
    case 'community':
      return <FontAwesome name="users" size={iconSize} color={iconColor} />;
    case 'achievement':
      return <FontAwesome name="trophy" size={iconSize} color={iconColor} />;
    case 'message':
      return <FontAwesome name="envelope" size={iconSize} color={iconColor} />;
    case 'profile':
      return <FontAwesome name="user-circle" size={iconSize} color={iconColor} />;
    case 'system':
      return <FontAwesome name="info-circle" size={iconSize} color={iconColor} />;
    default:
      return <FontAwesome name="bell" size={iconSize} color={iconColor} />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.modalOverlay,
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  markAllButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  markAllButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 80,
  },
  emptyStateIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  notificationItemUnread: {
    backgroundColor: colors.cream,
  },
  unreadIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: theme.spacing.sm,
    marginTop: 6,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  notificationTime: {
    fontSize: 11,
    color: colors.text,
    opacity: 0.7,
  },
  notificationMessage: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
    marginBottom: theme.spacing.xs,
  },
  notificationType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  notificationTypeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});

export default NotificationDrawer;

