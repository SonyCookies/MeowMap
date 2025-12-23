// 1. React and React Native
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';

// 2. Third-party libraries
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { upsertProfile, uploadAvatar, getProfile, getProfileCompletion } from '../services/profileService';

// 4. Local components
import ProfileProgressIndicator from '../components/profile/ProfileProgressIndicator';
import AvatarPreviewModal from '../components/profile/AvatarPreviewModal';

// 5. Constants and contexts
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileSetupScreen({ onComplete }) {
  const { user } = useAuth();
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [displayNameError, setDisplayNameError] = useState('');
  const [bioError, setBioError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [completion, setCompletion] = useState(null);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  // Load existing profile data
  useEffect(() => {
    loadExistingProfile();
  }, [user]);

  const loadExistingProfile = async () => {
    if (!user?.id) return;

    setLoadingProfile(true);
    try {
      const { data: profile } = await getProfile(user.id);
      if (profile) {
        setDisplayName(profile.display_name || '');
        setBio(profile.bio || '');
        setLocation(profile.location || '');
        setPhoneNumber(profile.phone_number || '');
        
        // Calculate completion status
        const profileWithEmail = {
          ...profile,
          email_verified: user.email_confirmed_at !== null,
        };
        const completionStatus = getProfileCompletion(profileWithEmail);
        setCompletion(completionStatus);
      } else {
        // New profile
        const completionStatus = getProfileCompletion(null);
        setCompletion(completionStatus);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Update completion status when fields change
  useEffect(() => {
    if (!loadingProfile && user) {
      const profileData = {
        display_name: displayName.trim(),
        avatar_url: avatarUri ? 'pending' : null, // We'll upload it on submit
        bio: bio.trim(),
        location: location.trim(),
        phone_number: phoneNumber.trim(),
        email_verified: user.email_confirmed_at !== null,
      };
      const completionStatus = getProfileCompletion(profileData);
      setCompletion(completionStatus);
    }
  }, [displayName, avatarUri, bio, location, phoneNumber, user, loadingProfile]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need permission to access your photos to set your avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images || 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need permission to access your camera to take a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Choose Avatar',
      'Select an option',
      [
        { text: 'Camera', onPress: handleTakePhoto },
        { text: 'Photo Library', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const validateDisplayName = (name) => {
    if (!name || name.trim().length === 0) {
      setDisplayNameError('Cat Guardian Name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setDisplayNameError('Name must be at least 2 characters');
      return false;
    }
    if (name.trim().length > 50) {
      setDisplayNameError('Name must be less than 50 characters');
      return false;
    }
    setDisplayNameError('');
    return true;
  };

  const validateBio = (bioText) => {
    if (!bioText || bioText.trim().length === 0) {
      setBioError('Bio is required');
      return false;
    }
    if (bioText.trim().length < 10) {
      setBioError('Bio must be at least 10 characters');
      return false;
    }
    if (bioText.trim().length > 500) {
      setBioError('Bio must be less than 500 characters');
      return false;
    }
    setBioError('');
    return true;
  };

  const validateLocation = (loc) => {
    if (!loc || loc.trim().length === 0) {
      setLocationError('Location is required');
      return false;
    }
    if (loc.trim().length > 200) {
      setLocationError('Location must be less than 200 characters');
      return false;
    }
    setLocationError('');
    return true;
  };

  // Format phone number to PH +63 format
  const formatPhoneNumber = (phone) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // If starts with 63, add +
    if (digits.startsWith('63')) {
      return `+${digits}`;
    }
    // If starts with 0, replace with +63
    if (digits.startsWith('0')) {
      return `+63${digits.substring(1)}`;
    }
    // If 9 digits (mobile number without country code), add +63
    if (digits.length === 9) {
      return `+63${digits}`;
    }
    // If 10 digits (with leading 0), replace 0 with +63
    if (digits.length === 10 && digits.startsWith('0')) {
      return `+63${digits.substring(1)}`;
    }
    // Otherwise, just add +63 if it doesn't already have it
    if (digits.length > 0 && !phone.startsWith('+')) {
      return `+63${digits}`;
    }
    return phone;
  };

  const validatePhone = (phone) => {
    if (!phone || phone.trim().length === 0) {
      setPhoneError('Phone number is required');
      return false;
    }
    
    // Remove all non-digits for validation
    const digits = phone.replace(/\D/g, '');
    
    // Must start with 63 (country code)
    if (!digits.startsWith('63')) {
      setPhoneError('Phone number must start with +63');
      return false;
    }
    
    // Must be exactly 12 digits (+63 followed by 9 digits = 12 total)
    if (digits.length !== 12) {
      setPhoneError('Phone number must be +63 followed by 9 digits (e.g., +639123456789)');
      return false;
    }
    
    // Check if the number after 63 is valid (should start with 9 for mobile)
    const mobileNumber = digits.substring(2);
    if (!mobileNumber.startsWith('9')) {
      setPhoneError('Mobile number must start with 9 (e.g., +639123456789)');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  const handleSubmit = async () => {
    // Validate all required fields
    const isDisplayNameValid = validateDisplayName(displayName);
    const isBioValid = validateBio(bio);
    const isLocationValid = validateLocation(location);
    const isPhoneValid = validatePhone(phoneNumber);

    if (!isDisplayNameValid || !isBioValid || !isLocationValid || !isPhoneValid) {
      return;
    }

    if (!avatarUri) {
      Alert.alert('Avatar Required', 'Please add an avatar image to complete your profile.');
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = null;

      // Upload avatar
      if (avatarUri) {
        const { data: uploadData, error: uploadError } = await uploadAvatar(user.id, avatarUri);
        
        if (uploadError) {
          const errorMessage = uploadError.message || uploadError.originalError?.message || 'Failed to upload avatar. Please check your internet connection and try again.';
          throw new Error(errorMessage);
        }

        avatarUrl = uploadData.url;
      }

      // Format phone number before saving
      const formattedPhone = formatPhoneNumber(phoneNumber.trim());

      // Save profile to database
      // Note: email_verified is not stored in the database, it's computed from auth.user
      const { data: profileData, error: profileError } = await upsertProfile(user.id, {
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        bio: bio.trim(),
        location: location.trim(),
        phone_number: formattedPhone,
      });

      if (profileError) {
        throw profileError;
      }

      // Profile saved successfully, call onComplete callback
      if (onComplete) {
        onComplete(profileData);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.contentContainer}>
          {/* Cat Illustration at Top */}
          <View style={styles.catIllustrationContainer}>
            <Image 
              source={require('../assets/images/Catracter.png')}
              style={styles.catIllustration}
              resizeMode="contain"
            />
          </View>

          {/* Wordmark */}
          <View style={styles.wordmarkContainer}>
            <Image 
              source={require('../assets/images/Wordmark.png')}
              style={styles.wordmark}
              resizeMode="contain"
            />
          </View>

          {/* Header */}
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Fill in your details to help other Cat Guardians connect with you and build a stronger community
          </Text>

          {/* Progress Indicator */}
          {completion && (
            <View style={styles.progressContainer}>
              <ProfileProgressIndicator
                completedCount={completion.completedCount}
                totalCount={completion.totalCount}
              />
            </View>
          )}

          {/* Avatar Section - Field Style */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Avatar *</Text>
            <View style={styles.avatarFieldContainer}>
              <TouchableOpacity
                style={[
                  styles.avatarFieldButton,
                  !avatarUri && styles.avatarFieldButtonEmpty
                ]}
                onPress={showImagePickerOptions}
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
                  onPress={() => setShowAvatarPreview(true)}
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
              onChangeText={(text) => {
                setDisplayName(text);
                if (text) {
                  validateDisplayName(text);
                } else {
                  setDisplayNameError('');
                }
              }}
              onBlur={() => validateDisplayName(displayName)}
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
              onChangeText={(text) => {
                setBio(text);
                if (text) {
                  validateBio(text);
                } else {
                  setBioError('');
                }
              }}
              onBlur={() => validateBio(bio)}
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
              onChangeText={(text) => {
                setLocation(text);
                if (text) {
                  validateLocation(text);
                } else {
                  setLocationError('');
                }
              }}
              onBlur={() => validateLocation(location)}
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
                setPhoneNumber(text);
                if (text) {
                  validatePhone(text);
                } else {
                  setPhoneError('');
                }
              }}
              onBlur={() => {
                // Auto-format on blur
                if (phoneNumber.trim()) {
                  const formatted = formatPhoneNumber(phoneNumber);
                  setPhoneNumber(formatted);
                  validatePhone(formatted);
                }
              }}
              maxLength={13} // +639123456789 = 13 characters
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

          {/* Email Verification Status */}
          {user && (
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <FontAwesome
                  name={user.email_confirmed_at ? 'check-circle' : 'exclamation-circle'}
                  size={20}
                  color={user.email_confirmed_at ? colors.success : colors.warning}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  Email: {user.email_confirmed_at ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
              {!user.email_confirmed_at && (
                <Text style={styles.infoHint}>
                  Check your email inbox to verify your email address
                </Text>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                Save Profile
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Avatar Preview Modal */}
      <AvatarPreviewModal
        visible={showAvatarPreview}
        imageUri={avatarUri}
        onClose={() => setShowAvatarPreview(false)}
        onChange={() => {
          setShowAvatarPreview(false);
          showImagePickerOptions();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  catIllustrationContainer: {
    width: '100%',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: 10,
    paddingVertical: 10,
  },
  catIllustration: {
    width: 200,
    height: 200,
  },
  wordmarkContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: -20,
  },
  wordmark: {
    width: 300,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: -10,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 24,
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
  catTailContainer: {
    position: 'absolute',
    bottom: -50,
    right: -449,
    width: 550,
    height: 550,
    overflow: 'hidden',
    zIndex: 1,
    pointerEvents: 'none',
  },
  catTail: {
    width: 550,
    height: 550,
    opacity: 1,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
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
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '500',
  },
  infoHint: {
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
    marginLeft: 32,
  },
  submitButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    maxWidth: 500,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  catTailContainer: {
    position: 'absolute',
    bottom: -50,
    right: -449,
    width: 550,
    height: 550,
    overflow: 'hidden',
    zIndex: 1,
    pointerEvents: 'none',
  },
  catTail: {
    width: 550,
    height: 550,
    opacity: 1,
  },
});
