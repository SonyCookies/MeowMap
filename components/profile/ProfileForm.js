// 1. React and React Native
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { FontAwesome } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { formatPhoneNumber } from '../../utils/phoneFormatting';

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function ProfileForm({
  editing,
  displayName,
  displayNameError,
  onDisplayNameChange,
  email,
  emailVerified,
  bio,
  bioError,
  onBioChange,
  location,
  locationError,
  onLocationChange,
  phoneNumber,
  phoneError,
  onPhoneChange,
  saving,
}) {
  return (
    <View style={styles.infoSection}>
      {/* Display Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Display Name</Text>
        {editing ? (
          <>
            <TextInput
              style={[styles.input, displayNameError && styles.inputError]}
              value={displayName}
              onChangeText={onDisplayNameChange}
              placeholder="Enter your display name"
              placeholderTextColor={colors.text}
              editable={!saving}
            />
            {displayNameError ? (
              <Text style={styles.errorText}>{displayNameError}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.fieldValue}>{displayName || 'Not set'}</Text>
        )}
      </View>

      {/* Email (Read-only) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Email</Text>
        <Text style={[styles.fieldValue, styles.fieldValueMuted]}>
          {email || 'Not set'}
        </Text>
        {emailVerified ? (
          <View style={styles.verifiedBadge}>
            <FontAwesome name="check-circle" size={14} color={colors.success} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : (
          <Text style={styles.unverifiedText}>Email not verified</Text>
        )}
      </View>

      {/* Bio */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Bio</Text>
        {editing ? (
          <>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                bioError && styles.inputError,
              ]}
              value={bio}
              onChangeText={onBioChange}
              placeholder="Tell us about yourself (minimum 10 characters)"
              placeholderTextColor={colors.text}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!saving}
            />
            <Text style={styles.fieldHint}>
              {bio.length}/10 minimum characters
            </Text>
            {bioError ? <Text style={styles.errorText}>{bioError}</Text> : null}
          </>
        ) : (
          <Text style={styles.fieldValue}>{bio || 'Not set'}</Text>
        )}
      </View>

      {/* Location */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Location</Text>
        {editing ? (
          <>
            <TextInput
              style={[styles.input, locationError && styles.inputError]}
              value={location}
              onChangeText={onLocationChange}
              placeholder="Barangay, City/Municipality, Province"
              placeholderTextColor={colors.text}
              editable={!saving}
            />
            {locationError ? (
              <Text style={styles.errorText}>{locationError}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.fieldValue}>{location || 'Not set'}</Text>
        )}
      </View>

      {/* Phone Number */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Phone Number</Text>
        {editing ? (
          <>
            <TextInput
              style={[styles.input, phoneError && styles.inputError]}
              value={phoneNumber}
              onChangeText={(text) => {
                const formatted = formatPhoneNumber(text);
                onPhoneChange(formatted);
              }}
              placeholder="+63XXXXXXXXXX"
              placeholderTextColor={colors.text}
              keyboardType="phone-pad"
              editable={!saving}
            />
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.fieldValue}>{phoneNumber || 'Not set'}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoSection: {
    paddingHorizontal: theme.spacing.md,
  },
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.textDark,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldValueMuted: {
    color: colors.text,
    opacity: 0.8,
  },
  input: {
    fontSize: 16,
    color: colors.textDark,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.sm,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: theme.spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  verifiedText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  unverifiedText: {
    fontSize: 12,
    color: colors.error,
    marginTop: theme.spacing.xs,
  },
});

