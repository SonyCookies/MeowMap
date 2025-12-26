// 1. React and React Native
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (None)

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

const DATE_FILTERS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 365 Days', value: '365days' },
];

const URGENCY_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Just chilling', value: 'Just chilling' },
  { label: 'Needs food', value: 'Needs food' },
  { label: 'Appears injured', value: 'Appears injured' },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'By Location', value: 'location' },
];

export default function SightingFilters({
  dateFilter,
  urgencyFilter,
  sortBy,
  onDateFilterChange,
  onUrgencyFilterChange,
  onSortChange,
}) {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Date Filter */}
        <TouchableOpacity
          style={[styles.filterButton, dateFilter !== 'all' && styles.filterButtonActive]}
          onPress={() => toggleSection('date')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={dateFilter !== 'all' ? '#ffffff' : colors.primary}
          />
          <Text
            style={[
              styles.filterButtonText,
              dateFilter !== 'all' && styles.filterButtonTextActive,
            ]}
          >
            {DATE_FILTERS.find((f) => f.value === dateFilter)?.label || 'Date'}
          </Text>
          <MaterialCommunityIcons
            name={expandedSection === 'date' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={dateFilter !== 'all' ? '#ffffff' : colors.primary}
          />
        </TouchableOpacity>

        {/* Urgency Filter */}
        <TouchableOpacity
          style={[styles.filterButton, urgencyFilter !== 'all' && styles.filterButtonActive]}
          onPress={() => toggleSection('urgency')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="alert-circle"
            size={16}
            color={urgencyFilter !== 'all' ? '#ffffff' : colors.primary}
          />
          <Text
            style={[
              styles.filterButtonText,
              urgencyFilter !== 'all' && styles.filterButtonTextActive,
            ]}
          >
            {URGENCY_FILTERS.find((f) => f.value === urgencyFilter)?.label || 'Urgency'}
          </Text>
          <MaterialCommunityIcons
            name={expandedSection === 'urgency' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={urgencyFilter !== 'all' ? '#ffffff' : colors.primary}
          />
        </TouchableOpacity>

        {/* Sort */}
        <TouchableOpacity
          style={[styles.filterButton, sortBy !== 'newest' && styles.filterButtonActive]}
          onPress={() => toggleSection('sort')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="sort"
            size={16}
            color={sortBy !== 'newest' ? '#ffffff' : colors.primary}
          />
          <Text
            style={[styles.filterButtonText, sortBy !== 'newest' && styles.filterButtonTextActive]}
          >
            {SORT_OPTIONS.find((f) => f.value === sortBy)?.label || 'Sort'}
          </Text>
          <MaterialCommunityIcons
            name={expandedSection === 'sort' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={sortBy !== 'newest' ? '#ffffff' : colors.primary}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* Expanded Options */}
      {expandedSection && (
        <View style={styles.expandedContainer}>
          {expandedSection === 'date' && (
            <View style={styles.optionsRow}>
              {DATE_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.optionButton,
                    dateFilter === filter.value && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    onDateFilterChange(filter.value);
                    setExpandedSection(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      dateFilter === filter.value && styles.optionTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {expandedSection === 'urgency' && (
            <View style={styles.optionsRow}>
              {URGENCY_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.optionButton,
                    urgencyFilter === filter.value && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    onUrgencyFilterChange(filter.value);
                    setExpandedSection(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      urgencyFilter === filter.value && styles.optionTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {expandedSection === 'sort' && (
            <View style={styles.optionsRow}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, sortBy === option.value && styles.optionButtonActive]}
                  onPress={() => {
                    onSortChange(option.value);
                    setExpandedSection(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.optionText, sortBy === option.value && styles.optionTextActive]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  expandedContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cream,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDark,
  },
  optionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});


