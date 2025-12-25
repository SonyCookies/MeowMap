// 1. React and React Native
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (None)

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function MapLayersControl({ 
  showHeatmap, 
  onHeatmapToggle, 
  show3DBuildings, 
  on3DBuildingsToggle,
  is3DBuildingsDisabled = false,
  onExpandChange,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (onExpandChange) {
      onExpandChange(newExpanded);
    }
  };

  return (
    <View style={styles.container}>
      {/* Collapsed Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="layers" size={20} color={colors.primary} />
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* Expanded Options */}
      {isExpanded && (
        <View style={styles.optionsContainer}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Map Layers</Text>
          </View>

          {/* Heatmap Toggle */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={onHeatmapToggle}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={showHeatmap ? 'fire' : 'fire-off'}
              size={18}
              color={showHeatmap ? colors.error : colors.textDark}
            />
            <Text
              style={[
                styles.optionText,
                showHeatmap && styles.optionTextActive,
              ]}
            >
              Heatmap
            </Text>
            <View
              style={[
                styles.toggle,
                showHeatmap && styles.toggleActive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  showHeatmap && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* 3D Buildings Toggle */}
          <TouchableOpacity
            style={[
              styles.optionButton,
              is3DBuildingsDisabled && styles.optionButtonDisabled,
            ]}
            onPress={on3DBuildingsToggle}
            activeOpacity={0.7}
            disabled={is3DBuildingsDisabled}
          >
            <MaterialCommunityIcons
              name={show3DBuildings ? 'cube' : 'cube-outline'}
              size={18}
              color={
                is3DBuildingsDisabled
                  ? colors.textLight
                  : show3DBuildings
                  ? colors.primary
                  : colors.textDark
              }
            />
            <Text
              style={[
                styles.optionText,
                show3DBuildings && styles.optionTextActive,
                is3DBuildingsDisabled && styles.optionTextDisabled,
              ]}
            >
              3D Buildings
              {is3DBuildingsDisabled && ' (N/A)'}
            </Text>
            <View
              style={[
                styles.toggle,
                show3DBuildings && styles.toggleActive,
                is3DBuildingsDisabled && styles.toggleDisabled,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  show3DBuildings && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 2,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minWidth: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  optionsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: theme.spacing.xs,
    minWidth: 180,
  },
  titleContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textDark,
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginLeft: 'auto',
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  optionTextDisabled: {
    color: colors.textLight,
  },
});

