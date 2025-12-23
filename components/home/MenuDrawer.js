// 1. React and React Native
import React, { useEffect, useRef } from 'react';
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
  Image,
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
 * Menu Drawer Component
 * Slides in from the right side when hamburger menu is clicked
 */
const MenuDrawer = ({ visible, onClose, profile, onMenuItemPress }) => {
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
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Only unmount after animation completes
        setMounted(false);
      });
    }
  }, [visible, slideAnim, backdropOpacity]);

  const handleMenuItemPress = (menuItem) => {
    if (onMenuItemPress) {
      onMenuItemPress(menuItem);
    }
    onClose();
  };

  // Don't render modal if not mounted (after closing animation)
  if (!visible && !mounted) {
    return null;
  }

  const menuItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: 'user-circle',
      iconFamily: 'FontAwesome',
      section: 'main',
    },
    {
      id: 'my-sightings',
      label: 'My Sightings',
      icon: 'cat',
      iconFamily: 'MaterialCommunityIcons',
      section: 'main',
    },
    {
      id: 'map-view',
      label: 'Map View',
      icon: 'map-marker',
      iconFamily: 'MaterialCommunityIcons',
      section: 'main',
    },
    {
      id: 'community',
      label: 'Community',
      icon: 'account-group',
      iconFamily: 'MaterialCommunityIcons',
      section: 'main',
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: 'chart-pie',
      iconFamily: 'MaterialCommunityIcons',
      section: 'main',
    },
    {
      id: 'divider-1',
      type: 'divider',
      section: 'main',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'cog',
      iconFamily: 'FontAwesome',
      section: 'secondary',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'help-circle',
      iconFamily: 'MaterialCommunityIcons',
      section: 'secondary',
    },
    {
      id: 'about',
      label: 'About',
      icon: 'info-circle',
      iconFamily: 'FontAwesome',
      section: 'secondary',
    },
    {
      id: 'divider-2',
      type: 'divider',
      section: 'secondary',
    },
    {
      id: 'sign-out',
      label: 'Sign Out',
      icon: 'sign-out',
      iconFamily: 'FontAwesome',
      section: 'danger',
      danger: true,
    },
  ];

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
          {/* Header with Profile */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Menu</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <FontAwesome name="times" size={18} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileSection}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <FontAwesome name="user" size={24} color={colors.primary} />
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile?.display_name || 'Cat Guardian'}
                </Text>
                {profile?.email && (
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {profile.email}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item, index) => {
              if (item.type === 'divider') {
                return <View key={item.id} style={styles.divider} />;
              }

              const IconComponent = item.iconFamily === 'MaterialCommunityIcons'
                ? MaterialCommunityIcons
                : FontAwesome;

              return (
                <MenuItem
                  key={item.id}
                  item={item}
                  IconComponent={IconComponent}
                  onPress={() => handleMenuItemPress(item)}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

/**
 * Individual Menu Item Component
 */
const MenuItem = ({ item, IconComponent, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.menuItem, item.danger && styles.menuItemDanger]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <View style={[styles.menuItemIcon, item.danger && styles.menuItemIconDanger]}>
          <IconComponent
            name={item.icon}
            size={22}
            color={item.danger ? colors.error : colors.primary}
          />
        </View>
        <Text style={[styles.menuItemLabel, item.danger && styles.menuItemLabelDanger]}>
          {item.label}
        </Text>
      </View>
      <FontAwesome
        name="chevron-right"
        size={14}
        color={item.danger ? colors.error : colors.text}
        style={{ opacity: 0.5 }}
      />
    </TouchableOpacity>
  );
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
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textDark,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.cream,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: theme.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 56,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  menuItemIconDanger: {
    backgroundColor: `${colors.error}15`, // 15% opacity
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    letterSpacing: 0.2,
  },
  menuItemLabelDanger: {
    color: colors.error,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.md,
  },
});

export default MenuDrawer;

