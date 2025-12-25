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
 * Sighting marker component for displaying cat sightings on the map
 * @param {string} urgencyLevel - Urgency level: 'Just chilling', 'Needs food', 'Appears injured'
 */
export default function SightingMarker({ urgencyLevel = 'Just chilling' }) {
  // Determine marker color based on urgency level
  const getMarkerColor = () => {
    switch (urgencyLevel) {
      case 'Just chilling':
        return colors.success;
      case 'Needs food':
        return colors.warning;
      case 'Appears injured':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const markerColor = getMarkerColor();

  return (
    <View style={styles.markerContainer}>
      <View style={[styles.markerPulse, { backgroundColor: markerColor }]} />
      <View style={[styles.markerCircle, { backgroundColor: '#ffffff', borderColor: markerColor, borderWidth: 3 }]}>
        <MaterialCommunityIcons name="cat" size={24} color={markerColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.3,
  },
  markerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});

