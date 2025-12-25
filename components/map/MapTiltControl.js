// 1. React and React Native
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (None)

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function MapTiltControl({ pitch, onPitchChange }) {
  const intervalRef = useRef(null);
  const minPitch = 0;
  const maxPitch = 60;
  const stepSize = 2; // Degrees to change per interval
  const intervalDelay = 50; // Milliseconds between adjustments

  // Clamp pitch between 0 and 60 degrees
  const clampedPitch = Math.max(minPitch, Math.min(maxPitch, pitch));

  // Calculate pitch percentage for visual indicator
  const pitchPercentage = (clampedPitch / maxPitch) * 100;

  const adjustPitch = (direction) => {
    const newPitch = direction === 'up' 
      ? Math.min(maxPitch, clampedPitch + stepSize)
      : Math.max(minPitch, clampedPitch - stepSize);
    onPitchChange(newPitch);
  };

  const startAdjusting = (direction) => {
    // Immediate adjustment
    adjustPitch(direction);
    
    // Then continue adjusting while held
    intervalRef.current = setInterval(() => {
      adjustPitch(direction);
    }, intervalDelay);
  };

  const stopAdjusting = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Up Button */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.buttonUp,
          clampedPitch >= maxPitch && styles.buttonDisabled,
        ]}
        onPressIn={() => startAdjusting('up')}
        onPressOut={stopAdjusting}
        onPress={() => adjustPitch('up')}
        activeOpacity={0.7}
        disabled={clampedPitch >= maxPitch}
      >
        <MaterialCommunityIcons 
          name="chevron-up" 
          size={20} 
          color={clampedPitch >= maxPitch ? colors.textLight : colors.primary} 
        />
      </TouchableOpacity>

      {/* Pitch Indicator */}
      <View style={styles.indicatorContainer}>
        <View style={styles.indicatorTrack}>
          <View 
            style={[
              styles.indicatorFill,
              { height: `${pitchPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.pitchText}>{Math.round(clampedPitch)}°</Text>
      </View>

      {/* Down Button */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.buttonDown,
          clampedPitch <= minPitch && styles.buttonDisabled,
        ]}
        onPressIn={() => startAdjusting('down')}
        onPressOut={stopAdjusting}
        onPress={() => adjustPitch('down')}
        activeOpacity={0.7}
        disabled={clampedPitch <= minPitch}
      >
        <MaterialCommunityIcons 
          name="chevron-down" 
          size={20} 
          color={clampedPitch <= minPitch ? colors.textLight : colors.primary} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '50%',
    transform: [{ translateY: -80 }],
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: theme.spacing.xs,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonUp: {
    // No additional styles needed
  },
  buttonDown: {
    // No additional styles needed
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  indicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  indicatorTrack: {
    width: 8,
    height: 120,
    backgroundColor: colors.cream,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  indicatorFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  pitchText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textDark,
    marginTop: theme.spacing.xs,
  },
});

