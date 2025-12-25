// 1. React and React Native
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (None)

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function FunctionCards({ onMapViewPress }) {
  return (
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
            onPress={onMapViewPress}
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
  );
}

const styles = StyleSheet.create({
  cardsContainerWrapper: {
    backgroundColor: colors.surface,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.xxxl,
    marginTop: 0, // No top margin since it's inside stats banner
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
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
});

