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

const MAP_STYLES = [
  { 
    label: 'Street', 
    value: 'Street',
    icon: 'road',
  },
  { 
    label: 'Satellite', 
    value: 'Satellite',
    icon: 'satellite-variant',
  },
  { 
    label: 'Outdoors', 
    value: 'Outdoors',
    icon: 'terrain',
  },
  { 
    label: 'Light', 
    value: 'Light',
    icon: 'weather-sunny',
  },
  { 
    label: 'Dark', 
    value: 'Dark',
    icon: 'weather-night',
  },
];

export default function MapStyleSelector({ selectedStyle, onStyleChange, isLayersExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSelector = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.container, { right: isLayersExpanded ? 200 : 80 }]}>
      {/* Collapsed Header - Always Visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleSelector}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name={MAP_STYLES.find(s => s.value === selectedStyle)?.icon || 'map'} 
          size={20} 
          color={colors.primary} 
        />
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* Expanded Options - Collapsible */}
      {isExpanded && (
        <View style={styles.optionsContainer}>
          {MAP_STYLES.map((style) => {
            const isSelected = selectedStyle === style.value;
            return (
              <TouchableOpacity
                key={style.value}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => {
                  onStyleChange(style.value);
                  setIsExpanded(false);
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={style.icon}
                  size={16}
                  color={isSelected ? '#ffffff' : colors.primary}
                />
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: theme.spacing.md,
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
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    flex: 1,
  },
  optionsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: theme.spacing.xs,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textDark,
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

