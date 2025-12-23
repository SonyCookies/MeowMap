import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

/**
 * Reusable Email Input component with validation
 */
const EmailInput = ({ 
  value, 
  onChangeText, 
  error, 
  placeholder = "Email",
  editable = true,
  style 
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError
        ]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        editable={editable}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default EmailInput;

