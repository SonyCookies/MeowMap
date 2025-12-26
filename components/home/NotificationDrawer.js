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
  TextInput,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { formatTimeAgo } from '../../utils/notifications';

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
const NotificationDrawer = ({ visible, onClose, notifications = [], onMarkAllAsRead, onNotificationPress, onUndo }) => {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter notifications based on search query
  const filteredNotifications = notifications.filter((notification) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const title = (notification.title || '').toLowerCase();
    const message = (notification.message || '').toLowerCase();
    const type = (notification.type || '').toLowerCase();
    return title.includes(query) || message.includes(query) || type.includes(query);
  });

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

          {/* Search Bar */}
          {notifications.length > 0 && (
            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={16} color={colors.text} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search notifications..."
                placeholderTextColor={colors.text}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchButton}
                >
                  <FontAwesome name="times-circle" size={16} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Notifications List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIcon}>
                  <FontAwesome
                    name={searchQuery ? "search" : "bell-slash"}
                    size={48}
                    color={colors.text}
                    style={{ opacity: 0.3 }}
                  />
                </View>
                <Text style={styles.emptyStateTitle}>
                  {searchQuery ? 'No results found' : 'No notifications'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery 
                    ? 'Try adjusting your search terms.'
                    : "You're all caught up! New notifications will appear here."}
                </Text>
              </View>
            ) : (
              filteredNotifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id || index}
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                  onUndo={onUndo}
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
const NotificationItem = ({ notification, onPress, onUndo }) => {
  const isRead = notification.read || false;

  // Check if this is a deletion notification with undo capability
  const isDeletionNotification = () => {
    try {
      if (!notification.message) return false;
      const parsed = JSON.parse(notification.message);
      return parsed && parsed.action === 'sighting_deleted' && parsed.sightingData;
    } catch (e) {
      return false;
    }
  };

  // Check if undo is still available (within 24 hours)
  const isUndoAvailable = () => {
    if (!isDeletionNotification()) return false;
    
    const createdAt = notification.created_at || notification.createdAt;
    if (!createdAt) return false;
    
    try {
      const createdDate = new Date(createdAt);
      const now = new Date();
      const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
      
      // Undo is only available within 24 hours
      return hoursDiff < 24;
    } catch (e) {
      console.error('Error checking undo availability:', e);
      return false;
    }
  };

  const canUndo = isUndoAvailable();

  // Format time - use existing time property or format from created_at
  const getFormattedTime = () => {
    if (notification.time) {
      return notification.time;
    }
    
    // Fallback: format from created_at or createdAt
    const createdAt = notification.created_at || notification.createdAt;
    if (createdAt) {
      try {
        return formatTimeAgo(createdAt);
      } catch (error) {
        console.error('Error formatting notification time:', error);
        return 'now';
      }
    }
    
    return 'now';
  };

  const handleUndo = (e) => {
    e.stopPropagation();
    if (onUndo && canUndo) {
      try {
        const parsed = JSON.parse(notification.message);
        onUndo(notification.id, parsed.sightingData);
      } catch (error) {
        console.error('Error parsing notification data for undo:', error);
      }
    }
  };

  // Get display message (not the JSON)
  const getDisplayMessage = () => {
    // Try to parse JSON message
    try {
      if (!notification.message) return '';
      
      const parsed = JSON.parse(notification.message);
      
      // Handle sighting_deleted
      if (parsed.action === 'sighting_deleted' && parsed.sightingData) {
        const catName = parsed.sightingData?.cat_name || 'Untitled';
        const createdAt = notification.created_at || notification.createdAt;
        
        if (createdAt) {
          try {
            const createdDate = new Date(createdAt);
            const now = new Date();
            const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
              const remainingHours = Math.floor(24 - hoursDiff);
              return `Sighting "${catName}" was deleted. Undo available for ${remainingHours} more hour${remainingHours !== 1 ? 's' : ''}.`;
            } else {
              return `Sighting "${catName}" was deleted. Undo is no longer available.`;
            }
          } catch (e) {
            return `Sighting "${catName}" was deleted.`;
          }
        }
        return `Sighting "${catName}" was deleted.`;
      }
      
      // Handle sighting_created
      if (parsed.action === 'sighting_created' && parsed.sightingData) {
        const catName = parsed.sightingData?.cat_name || 'Untitled';
        return `Your sighting "${catName}" has been created successfully!`;
      }
      
      // Handle comment_added
      if (parsed.action === 'comment_added') {
        const commenterName = parsed.commenterName || 'Someone';
        const catName = parsed.catName || 'a sighting';
        return `${commenterName} left a comment on "${catName}".`;
      }
      
      // Handle status_updated
      if (parsed.action === 'status_updated') {
        const updaterName = parsed.updaterName || 'Someone';
        const catName = parsed.catName || 'a sighting';
        const statusLabels = {
          sighting: 'Sighting',
          fed: 'Fed',
          taken_to_vet: 'Taken to Vet',
          adopted: 'Adopted',
          gone: 'Gone',
        };
        const oldStatusLabel = statusLabels[parsed.oldStatus] || parsed.oldStatus;
        const newStatusLabel = statusLabels[parsed.newStatus] || parsed.newStatus;
        return `${updaterName} updated the status of "${catName}" from ${oldStatusLabel} to ${newStatusLabel}.`;
      }
      
      // If parsed but no known action, return original message
      return notification.message;
    } catch (e) {
      // Not JSON, return as-is
      return notification.message || '';
    }
  };

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
          <Text style={styles.notificationTime}>{getFormattedTime()}</Text>
        </View>
        {getDisplayMessage() && (
          <Text
            style={styles.notificationMessage}
            numberOfLines={2}
          >
            {getDisplayMessage()}
          </Text>
        )}
        {notification.type && (
          <View style={styles.notificationType}>
            {getNotificationIcon(notification.type)}
            <Text style={styles.notificationTypeText}>{notification.type}</Text>
          </View>
        )}
        {canUndo && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={handleUndo}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="undo" size={16} color={colors.primary} />
            <Text style={styles.undoButtonText}>Undo</Text>
          </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    padding: 0,
  },
  clearSearchButton: {
    marginLeft: theme.spacing.xs,
    padding: 4,
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
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
  },
  undoButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default NotificationDrawer;

