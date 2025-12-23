// 1. React and React Native
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { FontAwesome } from '@expo/vector-icons';

// 5. Constants and contexts
import { colors } from '../../constants/theme';

/**
 * Profile Task Item Component
 * Displays a profile completion task with status indicator
 */
const ProfileTaskItem = ({ 
  title, 
  completed, 
  onPress,
  isActive = false 
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statusIcon}>
        <View style={[
          styles.statusCircle,
          completed ? styles.statusCircleCompleted : styles.statusCirclePending
        ]}>
          <FontAwesome
            name="check"
            size={12}
            color={completed ? '#fff' : colors.text}
          />
        </View>
      </View>
      
      <Text style={[
        styles.title,
        completed && styles.titleCompleted
      ]}>
        {title}
      </Text>
      
      <View style={styles.arrowIcon}>
        <FontAwesome
          name="chevron-right"
          size={16}
          color={isActive ? '#fff' : colors.text}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  statusCircleCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusCirclePending: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  titleCompleted: {
    color: colors.textDark,
  },
  arrowIcon: {
    marginLeft: 8,
  },
});

export default ProfileTaskItem;

