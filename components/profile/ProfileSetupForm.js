// 1. React and React Native
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';

// 2. Third-party libraries
import { FontAwesome } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { formatPhoneNumber } from '../../utils/phoneFormatting';

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors } from '../../constants/theme';

export default function ProfileSetupForm({
  displayName,
  displayNameError,
  onDisplayNameChange,
  bio,
  bioError,
  onBioChange,
  location,
  locationError,
  onLocationChange,
  phoneNumber,
  phoneError,
  onPhoneChange,
  avatarUri,
  onAvatarPress,
  onAvatarPreviewPress,
  loading,
}) {
  return (
    <>
      {/* Avatar Section */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Avatar *</Text>
        <View style={styles.avatarFieldContainer}>
          <TouchableOpacity
            style={[
              styles.avatarFieldButton,
              !avatarUri && styles.avatarFieldButtonEmpty
            ]}
            onPress={onAvatarPress}
            disabled={loading}
          >
            <Text style={[
              styles.avatarFieldButtonText,
              !avatarUri && styles.avatarFieldButtonTextEmpty
            ]}>
              {avatarUri ? 'Change Photo' : 'Choose Photo'}
            </Text>
          </TouchableOpacity>
          {avatarUri && (
            <TouchableOpacity
              style={styles.avatarPreviewButton}
              onPress={onAvatarPreviewPress}
            >
              <FontAwesome name="eye" size={16} color={colors.primary} />
              <Text style={[styles.avatarPreviewButtonText, { marginLeft: 8 }]}>Preview</Text>
            </TouchableOpacity>
          )}
        </View>
        {avatarUri && (
          <View style={styles.avatarFileNameContainer}>
            <Text style={styles.avatarFileName} numberOfLines={1}>
              {avatarUri.split('/').pop().split('?')[0] || 'Selected image'}
            </Text>
          </View>
        )}
        <Text style={styles.hintText}>
          Tap to select an avatar photo from your device
        </Text>
      </View>

      {/* Display Name Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Cat Guardian Name *</Text>
        <TextInput
          style={[
            styles.input,
            displayNameError && styles.inputError
          ]}
          placeholder="Enter your display name"
          placeholderTextColor="#999"
          value={displayName}
          onChangeText={onDisplayNameChange}
          maxLength={50}
          editable={!loading}
          autoCapitalize="words"
        />
        {displayNameError ? (
          <Text style={styles.errorText}>{displayNameError}</Text>
        ) : (
          <Text style={styles.hintText}>
            This is how other Cat Guardians will see you
          </Text>
        )}
      </View>

      {/* Bio Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Bio *</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            bioError && styles.inputError
          ]}
          placeholder="Tell other Cat Guardians about yourself"
          placeholderTextColor="#999"
          value={bio}
          onChangeText={onBioChange}
          maxLength={500}
          editable={!loading}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {bioError ? (
          <Text style={styles.errorText}>{bioError}</Text>
        ) : (
          <Text style={styles.hintText}>
            {bio.length}/500 characters (minimum 10 characters)
          </Text>
        )}
      </View>

      {/* Location Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={[
            styles.input,
            locationError && styles.inputError
          ]}
          placeholder="Barangay, City/Municipality, Province"
          placeholderTextColor="#999"
          value={location}
          onChangeText={onLocationChange}
          maxLength={200}
          editable={!loading}
          autoCapitalize="words"
        />
        {locationError ? (
          <Text style={styles.errorText}>{locationError}</Text>
        ) : (
          <Text style={styles.hintText}>
            Format: Barangay, City/Municipality, Province
          </Text>
        )}
      </View>

      {/* Phone Number Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={[
            styles.input,
            phoneError && styles.inputError
          ]}
          placeholder="+639123456789"
          placeholderTextColor="#999"
          value={phoneNumber}
          onChangeText={(text) => {
            const formatted = formatPhoneNumber(text);
            onPhoneChange(formatted);
          }}
          onBlur={() => {
            if (phoneNumber.trim()) {
              const formatted = formatPhoneNumber(phoneNumber);
              onPhoneChange(formatted);
            }
          }}
          maxLength={13}
          editable={!loading}
          keyboardType="phone-pad"
        />
        {phoneError ? (
          <Text style={styles.errorText}>{phoneError}</Text>
        ) : (
          <Text style={styles.hintText}>
            Format: +639123456789 (PH mobile number)
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  inputSection: {
    marginBottom: 20,
    width: '100%',
    maxWidth: 500,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    fontSize: 16,
    color: colors.textDark,
    width: '100%',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 4,
  },
  hintText: {
    color: colors.text,
    fontSize: 14,
    marginTop: 4,
  },
  avatarFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  avatarFieldButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFieldButtonEmpty: {
    borderStyle: 'dashed',
  },
  avatarFieldButtonText: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '500',
  },
  avatarFieldButtonTextEmpty: {
    color: colors.text,
  },
  avatarPreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginLeft: 12,
  },
  avatarPreviewButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  avatarFileNameContainer: {
    marginTop: 12,
    width: '100%',
  },
  avatarFileName: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
});

