// 1. React and React Native
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { getProfile } from '../services/profileService';

// 4. Local components
import NotificationDrawer from '../components/home/NotificationDrawer';
import MenuDrawer from '../components/home/MenuDrawer';
import ProfileScreen from './ProfileScreen';

// 5. Constants and contexts
import { colors, theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatesIndex, setUpdatesIndex] = useState(0);
  const [notificationDrawerVisible, setNotificationDrawerVisible] = useState(false);
  const [menuDrawerVisible, setMenuDrawerVisible] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  const updates = [
    { id: '1', title: 'New cat spotted near the park', subtitle: 'Check the latest sighting and add notes.' },
    { id: '2', title: 'Community meetup this weekend', subtitle: 'Join fellow Cat Guardians for a neighborhood walk.' },
    { id: '3', title: 'Top contributors this week', subtitle: 'See who logged the most sightings in your area.' },
  ];

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await getProfile(user.id);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  // Mock data for stats - replace with real data later
  const stats = {
    totalSightings: profile?.total_meows || 0,
    communityPoints: 32,
    contributions: 70,
  };

  const handleUpdateScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    const cardWidth = 280;
    const gap = 12;
    const index = Math.round(contentOffset.x / (cardWidth + gap));
    setUpdatesIndex(index);
  };

  // If showing profile screen, render it instead
  if (showProfileScreen) {
    return (
      <ProfileScreen onBack={() => setShowProfileScreen(false)} />
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/HomeScreenBg.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>

          <View style={styles.profileSection}>
            {loading ? (
              <>
                <View style={styles.profileImagePlaceholder}>
                  <FontAwesome name="user" size={24} color={colors.primary} />
                </View>
                <Text style={styles.profileName}>Loading...</Text>
              </>
            ) : (
              <>
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
                <Text style={styles.profileName}>
                  {profile?.display_name || 'Cat Guardian'}
                </Text>
              </>
            )}
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setNotificationDrawerVisible(true)}
            >
              <View style={styles.iconButtonCircle}>
                <FontAwesome name="bell" size={18} color={colors.primary} />
              </View>
              {notifications.filter((n) => !n.read).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notifications.filter((n) => !n.read).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => setMenuDrawerVisible(true)}
            >
              <View style={[styles.iconButtonCircle, styles.iconButtonCircleWhite]}>
                <FontAwesome name="bars" size={18} color={colors.textDark} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Updates Slider */}
        <View style={styles.updatesContainer}>
          <Text style={styles.sectionTitle}>Updates</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={292}
            decelerationRate="fast"
            contentContainerStyle={styles.updatesScrollContent}
            onScroll={handleUpdateScroll}
            scrollEventThrottle={16}
          >
            {updates.map((item) => (
              <View key={item.id} style={styles.updateCard}>
                <View style={styles.updateImagePlaceholder}>
                  <MaterialCommunityIcons name="image" size={24} color={colors.primary} />
                </View>
                <Text style={styles.updateTitle}>{item.title}</Text>
                <Text style={styles.updateSubtitle}>{item.subtitle}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.dotsRow}>
            {updates.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.dot,
                  updatesIndex === index && styles.dotActive
                ]}
              />
            ))}
          </View>
        </View>

        {/* Stats Banner Container */}
        <View style={styles.statsBannerContainer}>
          {/* Background Image - Flipped Horizontally */}
          <Image
            source={require('../assets/images/HomeScreenBg.png')}
            style={styles.statsBannerBgImage}
            resizeMode="cover"
          />
          {/* Stats Cards Container */}
          <View style={styles.statsCardsContainer}>
            <View style={styles.statsBanner}>
              <View style={styles.statsCard}>
                <Text style={styles.statsValue}>{stats.totalSightings}</Text>
                <Text style={styles.statsLabel}>Cat Sightings</Text>
              </View>
              <View style={styles.statsCard}>
                <View style={styles.statsCardHeader}>
                  <Text style={styles.statsValueNoMargin}>{stats.communityPoints}</Text>
                  <View style={styles.notificationBadgeSmall}>
                    <Text style={styles.notificationBadgeSmallText}>1</Text>
                  </View>
                </View>
                <Text style={styles.statsLabel}>Meows</Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsValue}>{stats.contributions}</Text>
                <Text style={styles.statsLabel}>Contributions</Text>
              </View>
            </View>
          </View>

          {/* Functionality Cards Container */}
          <View style={styles.cardsContainerWrapper}>
            <Text style={styles.sectionTitle}>What would you like to do?</Text>
            <View style={styles.cardsContainer}>
              {/* Row 1 */}
              <View style={styles.cardsRow}>
                <TouchableOpacity style={styles.functionCard}>
                  <View style={styles.functionCardIcon}>
                    <MaterialCommunityIcons name="cat" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.functionCardText}>My Sightings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.functionCard}>
                  <View style={styles.functionCardIcon}>
                    <MaterialCommunityIcons name="map-marker" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.functionCardText}>Map View</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.cardsRow}>
                <TouchableOpacity style={styles.functionCard}>
                  <View style={styles.functionCardIcon}>
                    <MaterialCommunityIcons name="account-group" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.functionCardText}>Community</Text>
                  <View style={styles.notificationBadgeCard}>
                    <Text style={styles.notificationBadgeCardText}>2</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.functionCard}>
                  <View style={styles.functionCardIcon}>
                    <MaterialCommunityIcons name="chart-pie" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.functionCardText}>Statistics</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Notification Drawer */}
      <NotificationDrawer
        visible={notificationDrawerVisible}
        onClose={() => setNotificationDrawerVisible(false)}
        notifications={notifications}
        onMarkAllAsRead={markAllAsRead}
        onNotificationPress={(notification) => {
          if (!notification.read) {
            markAsRead(notification.id);
          }
        }}
      />

      {/* Menu Drawer */}
      <MenuDrawer
        visible={menuDrawerVisible}
        onClose={() => setMenuDrawerVisible(false)}
        profile={profile ? { ...profile, email: user?.email } : null}
        onMenuItemPress={(item) => {
          if (item.id === 'sign-out') {
            handleSignOut();
          } else if (item.id === 'profile') {
            setShowProfileScreen(true);
          }
        }}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.md,
  },
  updatesContainer: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 12,
  },
  updatesScrollContent: {
    paddingRight: theme.spacing.md,
  },
  updateCard: {
    width: 280,
    marginRight: theme.spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  updateImagePlaceholder: {
    width: '100%',
    height: 70,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  updateSubtitle: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: 6,
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: colors.text,
    opacity: 0.3,
  },
  dotActive: {
    backgroundColor: colors.primary,
    opacity: 1,
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
  },
  iconButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonCircleWhite: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationBadgeSmall: {
    backgroundColor: colors.error,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  notificationBadgeSmallText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statsBannerContainer: {
    backgroundColor: colors.primary,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.xxxl,
    overflow: 'hidden',
    position: 'relative',
  },
  statsBannerBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: [{ scaleX: -1 }],
    opacity: 0.3,
  },
  statsCardsContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statsBanner: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statsCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statsValueNoMargin: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statsLabel: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardsContainerWrapper: {
    backgroundColor: colors.surface,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.xxxl,
  },
  cardsContainer: {
    gap: theme.spacing.md,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  functionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  functionCardIcon: {
    marginBottom: 12,
  },
  functionCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
  },
  notificationBadgeCard: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeCardText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
