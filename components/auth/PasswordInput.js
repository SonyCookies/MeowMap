import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

/**
 * Reusable Password Input component with show/hide toggle
 */
const PasswordInput = ({ 
  value, 
  onChangeText, 
  placeholder = "Password",
  showPassword,
  onToggleVisibility,
  editable = true,
  autoComplete = "password",
  style 
}) => {
  return (
    <View style={[styles.passwordInputWrapper, style]}>
      <TextInput
        style={styles.passwordInput}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete={autoComplete}
        editable={editable}
      />
      <TouchableOpacity
        style={styles.eyeIcon}
        onPress={onToggleVisibility}
        disabled={!editable}
      >
        <FontAwesome
          name={showPassword ? 'eye-slash' : 'eye'}
          size={20}
          color="#999"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 16,
    paddingLeft: 8,
  },
});

export default PasswordInput;

