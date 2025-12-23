// 1. React and React Native
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 5. Constants and contexts
import { colors } from '../../constants/theme';

/**
 * Profile Progress Indicator Component
 * Shows profile completion percentage and progress bar
 */
const ProfileProgressIndicator = ({ completedCount, totalCount }) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.percentage}>{percentage}%</Text>
        <Text style={styles.label}>Complete</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${percentage}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  percentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  label: {
    fontSize: 14,
    color: colors.text,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
});

export default ProfileProgressIndicator;

