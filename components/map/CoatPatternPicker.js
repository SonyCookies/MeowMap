// 1. React and React Native
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (None)

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

const COAT_PATTERNS = [
  'Solid (One single color)',
  'Tabby (Stripes, swirls, or "M" on forehead)',
  'Tuxedo (Black body with white chest/paws)',
  'Bicolor (Any other color + White)',
  'Calico (White + Orange + Black patches)',
  'Tortoiseshell (Black + Orange mottled, no white)',
  'Colorpoint (Light body, dark ears/tail - like a Siamese)',
];

export default function CoatPatternPicker({ visible, selectedPattern, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.pickerModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerModalHeader}>
            <Text style={styles.pickerModalTitle}>Select Coat Pattern</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerModalList}>
            {/* Clear option */}
            <TouchableOpacity
              style={[styles.pickerItem, !selectedPattern && styles.pickerItemSelected]}
              onPress={() => {
                onSelect('');
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerItemText, !selectedPattern && styles.pickerItemTextSelected]}>
                Clear Selection
              </Text>
              {!selectedPattern && (
                <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
            {COAT_PATTERNS.map((pattern) => {
              const patternName = pattern.split(' (')[0];
              const isSelected = selectedPattern === pattern;
              return (
                <TouchableOpacity
                  key={pattern}
                  style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                  onPress={() => {
                    onSelect(pattern);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                    {patternName}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  pickerModalList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 48,
  },
  pickerItemSelected: {
    backgroundColor: colors.background,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
    flexShrink: 1,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

