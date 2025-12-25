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
import UpdateDetailScreen from './UpdateDetailScreen';
import MapViewScreen from './MapViewScreen';
import UpdatesListScreen from './UpdatesListScreen';

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
  const [showMapViewScreen, setShowMapViewScreen] = useState(false);
  const [showUpdatesListScreen, setShowUpdatesListScreen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [updateDetailSource, setUpdateDetailSource] = useState(null); // 'home' or 'list'
  const updatesScrollViewRef = React.useRef(null);
  const autoScrollPausedRef = React.useRef(false);
  const scrollX = React.useRef(0);
  const screenWidth = Dimensions.get('window').width;

  const updates = [
    { id: '1', title: 'New cat spotted near the park', subtitle: 'Check the latest sighting and add notes.' },
    { id: '2', title: 'Community meetup this weekend', subtitle: 'Join fellow Cat Guardians for a neighborhood walk.' },
    { id: '3', title: 'Top contributors this week', subtitle: 'See who logged the most sightings in your area.' },
    { id: '4', title: 'New feature: Cat photo gallery', subtitle: 'Upload and share photos of your cat sightings with the community.' },
    { id: '5', title: 'Weekly challenge starts Monday', subtitle: 'Join the "Cat Spotter Challenge" and win exclusive badges!' },
    { id: '6', title: 'Community guidelines updated', subtitle: 'Please review our updated community guidelines for responsible cat tracking.' },
    { id: '7', title: 'Lost cat alert: Orange tabby', subtitle: 'Help reunite a lost orange tabby cat with its family in the downtown area.' },
    { id: '8', title: 'Map improvements released', subtitle: 'Enhanced map view with better location tracking and new filter options.' },
  ];

  // Only show 5 recent updates in the carousel
  const recentUpdates = updates.slice(0, 5);

  // Create a looped array for infinite scrolling (duplicate items at start and end)
  const loopedUpdates = [...recentUpdates, ...recentUpdates, ...recentUpdates];

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Initialize scroll position to middle section for infinite loop
  useEffect(() => {
    if (recentUpdates.length === 0 || !updatesScrollViewRef.current) return;
    
    const cardWidth = 280;
    const gap = 12;
    const itemWidth = cardWidth + gap;
    const sectionWidth = itemWidth * recentUpdates.length;
    // With paddingHorizontal, section 1 starts at: paddingLeft + sectionWidth
    // To center card at index 0 in section 1: scrollX = paddingLeft + sectionWidth + (0 * itemWidth) - paddingLeft = sectionWidth
    const initialScrollX = sectionWidth;
    
    // Small delay to ensure ScrollView is ready
    setTimeout(() => {
      if (updatesScrollViewRef.current) {
        updatesScrollViewRef.current.scrollTo({
          x: initialScrollX,
          animated: false,
        });
        scrollX.current = initialScrollX;
        setUpdatesIndex(0);
      }
    }, 100);
  }, [recentUpdates.length, screenWidth]);

  // Auto-slide updates every 5 seconds (pauses when user manually scrolling)
  useEffect(() => {
    if (recentUpdates.length === 0) return;

    const interval = setInterval(() => {
      // Skip auto-scroll if paused (user is manually scrolling)
      if (autoScrollPausedRef.current) {
        return;
      }

      setUpdatesIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % recentUpdates.length;
        // Scroll to the next update, centered
        if (updatesScrollViewRef.current) {
          const cardWidth = 280;
          const gap = 12;
          const itemWidth = cardWidth + gap;
          const sectionWidth = itemWidth * recentUpdates.length;
          // With paddingHorizontal, to center a card:
          // Card position in content = paddingLeft + (sectionIndex * sectionWidth) + (cardIndex * itemWidth)
          // To center: scrollX = cardPosition - paddingLeft = (sectionIndex * sectionWidth) + (cardIndex * itemWidth)
          // Stay in middle section (section 1) for infinite loop
          const targetSection = 1;
          const scrollToX = targetSection * sectionWidth + (nextIndex * itemWidth);
          
          updatesScrollViewRef.current.scrollTo({
            x: scrollToX,
            animated: true,
          });
          scrollX.current = scrollToX;
        }
        return nextIndex;
      });
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [recentUpdates.length, screenWidth]);

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
    const itemWidth = cardWidth + gap;
    const scrollPosition = contentOffset.x;
    const sectionWidth = itemWidth * recentUpdates.length;
    
    // Update scroll position ref
    scrollX.current = scrollPosition;
    
    // Calculate which section we're in (0, 1, or 2)
    const section = Math.floor(scrollPosition / sectionWidth);
    // Calculate position within the current section
    const positionInSection = scrollPosition % sectionWidth;
    // Find which card is closest to center
    const index = Math.round(positionInSection / itemWidth) % recentUpdates.length;
    
    setUpdatesIndex(index);
    
    // Loop detection: seamlessly jump between sections for infinite scroll
    if (section === 0 && positionInSection < itemWidth) {
      // Near the start of first section, jump to same position in middle section
      if (updatesScrollViewRef.current) {
        const newScrollX = sectionWidth + positionInSection;
        updatesScrollViewRef.current.scrollTo({
          x: newScrollX,
          animated: false,
        });
        scrollX.current = newScrollX;
      }
    } else if (section === 2 && positionInSection > sectionWidth - itemWidth) {
      // Near the end of last section, jump to same position in middle section
      if (updatesScrollViewRef.current) {
        const newScrollX = sectionWidth + positionInSection;
        updatesScrollViewRef.current.scrollTo({
          x: newScrollX,
          animated: false,
        });
        scrollX.current = newScrollX;
      }
    }
  };

  const handleScrollBeginDrag = () => {
    // Pause auto-scroll when user starts manually scrolling
    autoScrollPausedRef.current = true;
  };

  const handleScrollEndDrag = () => {
    // Snap to nearest centered card
    if (updatesScrollViewRef.current) {
      const cardWidth = 280;
      const gap = 12;
      const itemWidth = cardWidth + gap;
      const sectionWidth = itemWidth * recentUpdates.length;
      
      const currentSection = Math.floor(scrollX.current / sectionWidth);
      const positionInSection = scrollX.current % sectionWidth;
      const nearestIndex = Math.round(positionInSection / itemWidth) % recentUpdates.length;
      
      // Calculate centered position for the nearest card (stay in current section, or jump to middle if at edges)
      let targetSection = currentSection;
      if (currentSection === 0 || currentSection === 2) {
        targetSection = 1; // Jump to middle section
      }
      const snapToX = targetSection * sectionWidth + (nearestIndex * itemWidth);
      
      updatesScrollViewRef.current.scrollTo({
        x: snapToX,
        animated: true,
      });
      scrollX.current = snapToX;
      setUpdatesIndex(nearestIndex);
    }
    
    // Resume auto-scroll after 5 seconds when user stops scrolling
    setTimeout(() => {
      autoScrollPausedRef.current = false;
    }, 5000);
  };

  const handleUpdatePress = (update, source = 'home') => {
    setSelectedUpdate(update);
    setUpdateDetailSource(source);
    // Close updates list screen when an update is selected from list
    if (source === 'list') {
      setShowUpdatesListScreen(false);
    }
  };

  const handleUpdateDetailBack = () => {
    setSelectedUpdate(null);
    // If opened from list, go back to list
    if (updateDetailSource === 'list') {
      setShowUpdatesListScreen(true);
    }
    setUpdateDetailSource(null);
  };

  // If showing update detail screen, render it instead
  if (selectedUpdate) {
    return (
      <UpdateDetailScreen 
        update={selectedUpdate} 
        onBack={handleUpdateDetailBack} 
      />
    );
  }

  // If showing updates list screen, render it instead
  if (showUpdatesListScreen) {
    return (
      <UpdatesListScreen 
        updates={updates}
        onBack={() => setShowUpdatesListScreen(false)}
        onUpdatePress={(update) => handleUpdatePress(update, 'list')}
      />
    );
  }

  // If showing map view screen, render it instead
  if (showMapViewScreen) {
    return (
      <MapViewScreen onBack={() => setShowMapViewScreen(false)} />
    );
  }

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
          <View style={styles.updatesHeader}>
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            <TouchableOpacity 
              onPress={() => setShowUpdatesListScreen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={updatesScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            contentContainerStyle={styles.updatesScrollContent}
            onScroll={handleUpdateScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={16}
          >
            {loopedUpdates.map((item, index) => (
              <TouchableOpacity 
                key={`${item.id}-${index}`} 
                style={styles.updateCard}
                onPress={() => handleUpdatePress(item, 'home')}
                activeOpacity={0.8}
              >
                <View style={styles.updateImagePlaceholder}>
                  <MaterialCommunityIcons name="image" size={24} color={colors.primary} />
                </View>
                <Text style={styles.updateTitle}>{item.title}</Text>
                <Text style={styles.updateSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.dotsRow}>
            {recentUpdates.map((item, index) => (
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
            source={require('../assets/images/StatsCardBg.png')}
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

                <TouchableOpacity 
                  style={styles.functionCard}
                  onPress={() => setShowMapViewScreen(true)}
                >
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

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          // Handle FAB press - you can add navigation or action here
          console.log('FAB pressed');
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#ffffff" />
      </TouchableOpacity>

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
    backgroundColor: colors.surface,
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
    paddingBottom: theme.spacing.md,
  },
  updatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: theme.spacing.md,
    color: colors.textDark,
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: '600',
    paddingRight: theme.spacing.md,
    color: colors.primary,
  },
  updatesScrollContent: {
    paddingHorizontal: Dimensions.get('window').width / 2 - 140, // Center cards: (screenWidth / 2) - (cardWidth / 2)
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
    marginTop: theme.spacing.md,
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
    marginTop: theme.spacing.sm,
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
    opacity: 1,
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
    marginTop: theme.spacing.md,
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
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
