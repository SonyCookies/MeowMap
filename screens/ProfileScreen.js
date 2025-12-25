// 1. React and React Native
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { getProfile, upsertProfile } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { validateProfileForm } from '../utils/profileValidation';
import { useAvatarUpload } from '../hooks/useAvatarUpload';
import { useImagePicker } from '../hooks/useImagePicker';

// 4. Local components
import AvatarPreviewModal from '../components/profile/AvatarPreviewModal';
import ProfileForm from '../components/profile/ProfileForm';

// 5. Constants and contexts
import { colors, theme } from '../constants/theme';

export default function ProfileScreen({ onBack }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Error states
  const [displayNameError, setDisplayNameError] = useState('');
  const [bioError, setBioError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Use custom hooks
  const { imageUri: pickedImageUri, showImagePickerOptions, setImageUri } = useImagePicker({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  const { uploading: avatarUploading, upload: uploadAvatarImage } = useAvatarUpload(user?.id);

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Update avatarUri when image is picked
  useEffect(() => {
    if (pickedImageUri) {
      setAvatarUri(pickedImageUri);
    }
  }, [pickedImageUri]);

  const loadProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await getProfile(user.id);
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setPhoneNumber(data.phone_number || '');
        setAvatarUrl(data.avatar_url || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    // Reset errors
    setDisplayNameError('');
    setBioError('');
    setLocationError('');
    setPhoneError('');
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form to original values
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setPhoneNumber(profile.phone_number || '');
      setAvatarUri(null);
    }
    // Clear errors
    setDisplayNameError('');
    setBioError('');
    setLocationError('');
    setPhoneError('');
  };

  const validateForm = () => {
    const result = validateProfileForm({
      displayName,
      bio,
      location,
      phoneNumber,
    });

    setDisplayNameError(result.errors.displayName);
    setBioError(result.errors.bio);
    setLocationError(result.errors.location);
    setPhoneError(result.errors.phone);

    return result.isValid;
  };

  const handlePhoneChange = (text) => {
    setPhoneNumber(text);
    if (phoneError) setPhoneError('');
  };

  const handlePickImage = () => {
    showImagePickerOptions();
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if one was selected
      if (avatarUri) {
        const uploadResult = await uploadAvatarImage(avatarUri);
        if (!uploadResult) {
          throw new Error('Failed to upload avatar. Please try again.');
        }
        finalAvatarUrl = uploadResult.url;
      }

      // Update profile
      const profileData = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        phone_number: phoneNumber.trim(),
        ...(finalAvatarUrl && { avatar_url: finalAvatarUrl }),
      };

      const { data, error } = await upsertProfile(user.id, profileData);
      if (error) {
        throw error;
      }

      // Update local state
      setProfile(data);
      setAvatarUrl(finalAvatarUrl);
      setAvatarUri(null);
      setImageUri(null);
      setEditing(false);

      // Create notification for profile update
      addNotification({
        title: 'Profile Updated',
        message: 'Your profile has been successfully updated.',
        type: 'profile',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../assets/images/HomeScreenBg.png')}
        style={styles.container}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ImageBackground>
    );
  }

  const currentAvatar = avatarUri ? { uri: avatarUri } : (avatarUrl ? { uri: avatarUrl } : null);

  return (
    <ImageBackground
      source={require('../assets/images/HomeScreenBg.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <View style={styles.backButtonCircle}>
              <FontAwesome name="arrow-left" size={18} color={colors.textDark} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Profile</Text>
          
          {editing ? (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.headerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, styles.headerButtonPrimary]}
                onPress={handleSave}
                disabled={saving || avatarUploading}
              >
                {(saving || avatarUploading) ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.headerButtonText, styles.headerButtonTextPrimary]}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleEdit}
            >
              <Text style={styles.headerButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            {editing ? (
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                {currentAvatar ? (
                  <Image source={currentAvatar} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <FontAwesome name="user" size={48} color={colors.primary} />
                  </View>
                )}
                <View style={styles.avatarEditOverlay}>
                  <MaterialCommunityIcons name="camera" size={24} color="#ffffff" />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.avatarContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <FontAwesome name="user" size={48} color={colors.primary} />
                  </View>
                )}
                {avatarUrl && (
                  <TouchableOpacity
                    style={styles.avatarPreviewButton}
                    onPress={() => setShowAvatarPreview(true)}
                  >
                    <MaterialCommunityIcons name="eye" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text style={styles.avatarHint}>
              {editing ? 'Tap to change photo' : (avatarUrl ? 'Tap to preview' : '')}
            </Text>
          </View>

          {/* Profile Information */}
          <ProfileForm
            editing={editing}
            displayName={editing ? displayName : (profile?.display_name || '')}
            displayNameError={displayNameError}
            onDisplayNameChange={(text) => {
              setDisplayName(text);
              if (displayNameError) setDisplayNameError('');
            }}
            email={user?.email || ''}
            emailVerified={!!user?.email_confirmed_at}
            bio={editing ? bio : (profile?.bio || '')}
            bioError={bioError}
            onBioChange={(text) => {
              setBio(text);
              if (bioError) setBioError('');
            }}
            location={editing ? location : (profile?.location || '')}
            locationError={locationError}
            onLocationChange={(text) => {
              setLocation(text);
              if (locationError) setLocationError('');
            }}
            phoneNumber={editing ? phoneNumber : (profile?.phone_number || '')}
            phoneError={phoneError}
            onPhoneChange={handlePhoneChange}
            saving={saving || avatarUploading}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Avatar Preview Modal */}
      {showAvatarPreview && avatarUrl && (
        <AvatarPreviewModal
          visible={showAvatarPreview}
          imageUri={avatarUrl}
          onClose={() => setShowAvatarPreview(false)}
          onChange={() => {
            setShowAvatarPreview(false);
            setEditing(true);
            handlePickImage();
          }}
        />
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerButtonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  headerButtonTextPrimary: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarPreviewButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarHint: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
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
});

