import { useState } from 'react';
import { uploadAvatar } from '../services/profileService';
import { Alert } from 'react-native';

/**
 * Custom hook for handling avatar upload functionality
 * 
 * @param {string} userId - User ID for avatar upload
 * @returns {Object} - Avatar upload state and functions
 */
export const useAvatarUpload = (userId) => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  /**
   * Upload avatar image
   * @param {string} imageUri - Local URI of the image to upload
   * @returns {Promise<{ url: string } | null>} - Upload result with URL or null on error
   */
  const upload = async (imageUri) => {
    if (!imageUri || !userId) {
      return null;
    }

    setUploading(true);
    try {
      const { data, error } = await uploadAvatar(userId, imageUri);
      
      if (error) {
        throw new Error(error.message || 'Failed to upload avatar');
      }

      if (data?.url) {
        setAvatarUrl(data.url);
        return { url: data.url };
      }
      
      return null;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', error.message || 'Failed to upload avatar. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Clear avatar URL
   */
  const clearAvatar = () => {
    setAvatarUrl(null);
  };

  return {
    uploading,
    avatarUrl,
    upload,
    clearAvatar,
    setAvatarUrl,
  };
};

