// 1. React and React Native
import React from 'react';
import { View, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (None)

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors } from '../../constants/theme';

/**
 * User location marker component
 */
export function UserLocationMarker() {
  return (
    <View style={styles.userLocationMarker}>
      <View style={styles.userLocationPulse} />
      <View style={styles.userLocationDot} />
    </View>
  );
}

/**
 * Pending pin marker component
 */
export function PendingPinMarker() {
  return (
    <View style={styles.pendingPinMarker}>
      <MaterialCommunityIcons name="cat" size={32} color={colors.primary} />
      <View style={styles.pendingPinPulse} />
    </View>
  );
}

const styles = StyleSheet.create({
  userLocationMarker: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  pendingPinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pendingPinPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
});

