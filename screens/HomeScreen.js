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
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { getProfile } from '../services/profileService';

// 4. Local components
import NotificationDrawer from '../components/home/NotificationDrawer';
import MenuDrawer from '../components/home/MenuDrawer';
import UpdatesCarousel from '../components/home/UpdatesCarousel';
import StatsBanner from '../components/home/StatsBanner';
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
  const [notificationDrawerVisible, setNotificationDrawerVisible] = useState(false);
  const [menuDrawerVisible, setMenuDrawerVisible] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [showMapViewScreen, setShowMapViewScreen] = useState(false);
  const [showUpdatesListScreen, setShowUpdatesListScreen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [updateDetailSource, setUpdateDetailSource] = useState(null); // 'home' or 'list'

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
        <UpdatesCarousel
          updates={updates}
          onUpdatePress={handleUpdatePress}
          onViewAll={() => setShowUpdatesListScreen(true)}
        />

        {/* Stats Banner Container (includes Function Cards inside) */}
        <StatsBanner 
          stats={stats} 
          onMapViewPress={() => setShowMapViewScreen(true)} 
        />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: theme.spacing.md,
    color: colors.textDark,
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
});
