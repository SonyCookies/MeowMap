import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

/**
 * Remember Me Checkbox component
 */
const RememberMeCheckbox = ({ 
  checked, 
  onToggle, 
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={styles.container}
      disabled={disabled}
    >
      <View style={[
        styles.checkbox,
        checked && styles.checkboxChecked
      ]}>
        {checked && (
          <FontAwesome name="check" size={12} color="#fff" />
        )}
      </View>
      <Text style={styles.text}>Remember Me</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.buttonPrimary,
    borderColor: colors.buttonPrimary,
  },
  text: {
    color: colors.text,
    fontSize: 14,
  },
});

export default RememberMeCheckbox;

