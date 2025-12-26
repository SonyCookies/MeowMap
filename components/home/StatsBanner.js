// 1. React and React Native
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// 2. Third-party libraries
// (None)

// 3. Local utilities and hooks
// (None)

// 4. Local components
import FunctionCards from './FunctionCards';

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function StatsBanner({ stats, onMapViewPress, onMySightingsPress }) {
  return (
    <View style={styles.statsBannerContainer}>
      {/* Background Image - Flipped Horizontally */}
      <Image
        source={require('../../assets/images/StatsCardBg.png')}
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

      {/* Functionality Cards Container - Inside Stats Banner */}
      <FunctionCards onMapViewPress={onMapViewPress} onMySightingsPress={onMySightingsPress} />
    </View>
  );
}

const styles = StyleSheet.create({
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
});

