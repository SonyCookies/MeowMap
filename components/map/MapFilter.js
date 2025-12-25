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

const FILTER_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 365 Days', value: '365days' },
  { label: 'All Time', value: 'all' },
];

export default function MapFilter({ selectedFilter, onFilterChange, onExpandChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleFilter = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onExpandChange) {
      onExpandChange(newExpandedState);
    }
  };

  return (
    <View style={styles.filterContainer}>
      {/* Collapsed Header - Always Visible */}
      <TouchableOpacity
        style={styles.filterHeader}
        onPress={toggleFilter}
        activeOpacity={0.7}
      >
        <View style={styles.filterHeaderContent}>
          <MaterialCommunityIcons name="filter" size={18} color={colors.primary} />
          <Text style={styles.filterTitle}>Filter: {FILTER_OPTIONS.find(opt => opt.value === selectedFilter)?.label || 'All Time'}</Text>
        </View>
        <MaterialCommunityIcons
          name={isExpanded ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* Expanded Options - Collapsible */}
      {isExpanded && (
        <View style={styles.filterOptions}>
          {FILTER_OPTIONS.map((option) => {
            const isSelected = selectedFilter === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterButton,
                  isSelected && styles.filterButtonSelected,
                ]}
                onPress={() => {
                  onFilterChange(option.value);
                  setIsExpanded(false); // Collapse after selection
                  if (onExpandChange) {
                    onExpandChange(false);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    isSelected && styles.filterButtonTextSelected,
                  ]}
                >
                  {option.label}
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
  filterContainer: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
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
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
  },
  filterHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDark,
  },
  filterButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

