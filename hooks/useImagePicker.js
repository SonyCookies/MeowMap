import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/**
 * Custom hook for handling image picker functionality
 * Supports both camera and photo library selection
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.allowsEditing - Whether to allow image editing
 * @param {Array<number>} options.aspect - Aspect ratio [width, height]
 * @param {number} options.quality - Image quality (0-1)
 * @returns {Object} - Image picker state and functions
 */
export const useImagePicker = (options = {}) => {
  const {
    allowsEditing = true,
    aspect = [1, 1],
    quality = 0.8,
  } = options;

  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Pick image from photo library
   */
  const pickImage = async () => {
    try {
      setLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need permission to access your photos.'
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images || 'images',
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Take photo with camera
   */
  const takePhoto = async () => {
    try {
      setLoading(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need permission to access your camera.'
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Show image picker options (camera or photo library)
   */
  const showImagePickerOptions = () => {
    Alert.alert(
      'Choose Image',
      'Select an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  /**
   * Clear selected image
   */
  const clearImage = () => {
    setImageUri(null);
  };

  return {
    imageUri,
    loading,
    pickImage,
    takePhoto,
    showImagePickerOptions,
    clearImage,
    setImageUri,
  };
};

