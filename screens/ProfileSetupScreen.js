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
import { FontAwesome } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { upsertProfile, getProfile, getProfileCompletion } from '../services/profileService';
import { validateDisplayName, validateBio, validateLocation, validatePhone } from '../utils/profileValidation';
import { formatPhoneNumber } from '../utils/phoneFormatting';
import { useImagePicker } from '../hooks/useImagePicker';

// 4. Local components
import ProfileProgressIndicator from '../components/profile/ProfileProgressIndicator';
import AvatarPreviewModal from '../components/profile/AvatarPreviewModal';
import ProfileSetupForm from '../components/profile/ProfileSetupForm';

// 5. Constants and contexts
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileSetupScreen({ onComplete }) {
  const { user } = useAuth();
  
  // Form state
  const [displayName, setDisplayName] = useState('');
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

  // Use custom hooks
  const { imageUri: avatarUri, showImagePickerOptions, setImageUri } = useImagePicker({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

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
        avatar_url: avatarUri ? 'pending' : null,
        bio: bio.trim(),
        location: location.trim(),
        phone_number: phoneNumber.trim(),
        email_verified: user.email_confirmed_at !== null,
      };
      const completionStatus = getProfileCompletion(profileData);
      setCompletion(completionStatus);
    }
  }, [displayName, avatarUri, bio, location, phoneNumber, user, loadingProfile]);



  const handleSubmit = async () => {
    // Validate all required fields
    const displayNameResult = validateDisplayName(displayName);
    const bioResult = validateBio(bio);
    const locationResult = validateLocation(location);
    const phoneResult = validatePhone(phoneNumber);

    setDisplayNameError(displayNameResult.error);
    setBioError(bioResult.error);
    setLocationError(locationResult.error);
    setPhoneError(phoneResult.error);

    if (!displayNameResult.isValid || !bioResult.isValid || !locationResult.isValid || !phoneResult.isValid) {
      return;
    }

    if (!avatarUri) {
      Alert.alert('Avatar Required', 'Please add an avatar image to complete your profile.');
      return;
    }

    setLoading(true);

    try {
      // Upload avatar
      const { uploadAvatar } = await import('../services/profileService');
      let avatarUrl = null;

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

          {/* Profile Setup Form */}
          <ProfileSetupForm
            displayName={displayName}
            displayNameError={displayNameError}
            onDisplayNameChange={(text) => {
              setDisplayName(text);
              if (text) {
                const result = validateDisplayName(text);
                setDisplayNameError(result.error);
              } else {
                setDisplayNameError('');
              }
            }}
            bio={bio}
            bioError={bioError}
            onBioChange={(text) => {
              setBio(text);
              if (text) {
                const result = validateBio(text);
                setBioError(result.error);
              } else {
                setBioError('');
              }
            }}
            location={location}
            locationError={locationError}
            onLocationChange={(text) => {
              setLocation(text);
              if (text) {
                const result = validateLocation(text);
                setLocationError(result.error);
              } else {
                setLocationError('');
              }
            }}
            phoneNumber={phoneNumber}
            phoneError={phoneError}
            onPhoneChange={(text) => {
              setPhoneNumber(text);
              if (text) {
                const result = validatePhone(text);
                setPhoneError(result.error);
              } else {
                setPhoneError('');
              }
            }}
            avatarUri={avatarUri}
            onAvatarPress={showImagePickerOptions}
            onAvatarPreviewPress={() => setShowAvatarPreview(true)}
            loading={loading}
          />

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
      {avatarUri && (
        <AvatarPreviewModal
          visible={showAvatarPreview}
          imageUri={avatarUri}
          onClose={() => setShowAvatarPreview(false)}
          onChange={() => {
            setShowAvatarPreview(false);
            showImagePickerOptions();
          }}
        />
      )}
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
