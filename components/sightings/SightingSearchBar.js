// 1. React and React Native
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (None)

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function SightingSearchBar({ value, onChangeText, onClear }) {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.textLight}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search by cat name or description..."
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    paddingVertical: theme.spacing.xs,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
});


