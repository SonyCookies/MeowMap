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
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { getProfile, upsertProfile, uploadAvatar } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

// 4. Local components
import AvatarPreviewModal from '../components/profile/AvatarPreviewModal';

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

  useEffect(() => {
    loadProfile();
  }, [user]);

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
    let isValid = true;

    // Validate display name
    if (!displayName.trim()) {
      setDisplayNameError('Display name is required');
      isValid = false;
    } else {
      setDisplayNameError('');
    }

    // Validate bio (minimum 10 characters)
    if (!bio.trim() || bio.trim().length < 10) {
      setBioError('Bio must be at least 10 characters');
      isValid = false;
    } else {
      setBioError('');
    }

    // Validate location
    if (!location.trim()) {
      setLocationError('Location is required');
      isValid = false;
    } else {
      setLocationError('');
    }

    // Validate phone number (PH format +63)
    const phoneRegex = /^\+63\d{10}$/;
    if (!phoneNumber.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!phoneRegex.test(phoneNumber.trim())) {
      setPhoneError('Phone number must be in format +63XXXXXXXXXX');
      isValid = false;
    } else {
      setPhoneError('');
    }

    return isValid;
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    
    // If starts with 63, add + prefix
    if (digits.startsWith('63')) {
      return `+${digits}`;
    }
    // If starts with 0, replace with +63
    if (digits.startsWith('0')) {
      return `+63${digits.substring(1)}`;
    }
    // If doesn't start with anything, add +63
    if (digits.length > 0) {
      return `+63${digits}`;
    }
    return text;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    if (phoneError) setPhoneError('');
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload an avatar.');
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
        setAvatarUrl(null); // Clear existing URL when new image is selected
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
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
        const { data: uploadData, error: uploadError } = await uploadAvatar(user.id, avatarUri);
        if (uploadError) {
          throw new Error('Failed to upload avatar. Please try again.');
        }
        finalAvatarUrl = uploadData.url;
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
                disabled={saving}
              >
                {saving ? (
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
          <View style={styles.infoSection}>
            {/* Display Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              {editing ? (
                <>
                  <TextInput
                    style={[styles.input, displayNameError && styles.inputError]}
                    value={displayName}
                    onChangeText={(text) => {
                      setDisplayName(text);
                      if (displayNameError) setDisplayNameError('');
                    }}
                    placeholder="Enter your display name"
                    placeholderTextColor={colors.text}
                    editable={!saving}
                  />
                  {displayNameError ? (
                    <Text style={styles.errorText}>{displayNameError}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.fieldValue}>{profile?.display_name || 'Not set'}</Text>
              )}
            </View>

            {/* Email (Read-only) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={[styles.fieldValue, styles.fieldValueMuted]}>
                {user?.email || 'Not set'}
              </Text>
              {user?.email_confirmed_at ? (
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
                    onChangeText={(text) => {
                      setBio(text);
                      if (bioError) setBioError('');
                    }}
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
                <Text style={styles.fieldValue}>
                  {profile?.bio || 'Not set'}
                </Text>
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
                    onChangeText={(text) => {
                      setLocation(text);
                      if (locationError) setLocationError('');
                    }}
                    placeholder="Barangay, City/Municipality, Province"
                    placeholderTextColor={colors.text}
                    editable={!saving}
                  />
                  {locationError ? (
                    <Text style={styles.errorText}>{locationError}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.fieldValue}>
                  {profile?.location || 'Not set'}
                </Text>
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
                    onChangeText={handlePhoneChange}
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
                <Text style={styles.fieldValue}>
                  {profile?.phone_number || 'Not set'}
                </Text>
              )}
            </View>
          </View>
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

