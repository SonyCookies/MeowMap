import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Password Strength Indicator component
 * Displays password strength bar and requirements checklist
 */
const PasswordStrengthIndicator = ({ passwordStrength }) => {
  if (!passwordStrength) return null;

  const requirements = passwordStrength.requirements;

  return (
    <View style={styles.passwordStrengthContainer}>
      <View style={styles.passwordStrengthBar}>
        <View
          style={[
            styles.passwordStrengthFill,
            {
              width: `${(passwordStrength.strength / 5) * 100}%`,
              backgroundColor: passwordStrength.color,
            },
          ]}
        />
      </View>
      <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
        {passwordStrength.label}
      </Text>
      <View style={styles.passwordRequirementsContainer}>
        <Text style={styles.passwordRequirementsTitle}>Password requirements:</Text>
        <RequirementItem 
          met={requirements.length} 
          text="At least 8 characters" 
        />
        <RequirementItem 
          met={requirements.lowercase} 
          text="One lowercase letter" 
        />
        <RequirementItem 
          met={requirements.uppercase} 
          text="One uppercase letter" 
        />
        <RequirementItem 
          met={requirements.number} 
          text="One number" 
        />
        <RequirementItem 
          met={requirements.special} 
          text="One special character" 
        />
      </View>
    </View>
  );
};

const RequirementItem = ({ met, text }) => (
  <View style={styles.passwordRequirementItem}>
    <Text style={[
      styles.passwordRequirementIcon,
      { color: met ? '#34C759' : '#999' }
    ]}>
      {met ? '✓' : '✗'}
    </Text>
    <Text style={[
      styles.passwordRequirementText,
      { color: met ? '#333' : '#999' }
    ]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  passwordStrengthContainer: {
    marginTop: 8,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordRequirementsContainer: {
    marginTop: 4,
  },
  passwordRequirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3a3a3a',
    marginBottom: 6,
  },
  passwordRequirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  passwordRequirementIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
    width: 16,
  },
  passwordRequirementText: {
    fontSize: 11,
    flex: 1,
  },
});

export default PasswordStrengthIndicator;

