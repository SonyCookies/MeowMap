// 1. React and React Native
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// Conditionally import Mapbox only on native platforms (not web)
let Mapbox = null;
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || null;

if (Platform.OS !== 'web') {
  try {
    Mapbox = require('@rnmapbox/maps').default;
    
    if (MAPBOX_ACCESS_TOKEN) {
      Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
    } else {
      console.warn('Mapbox access token not found. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.');
    }
  } catch (error) {
    console.warn('Mapbox not available:', error);
  }
}

// 3. Local utilities and hooks
import { createSighting } from '../services/sightingService';
import { useAuth } from '../contexts/AuthContext';

// 4. Local components
// (None for this screen)

// 5. Constants and contexts
import { colors, theme } from '../constants/theme';

export default function MapViewScreen({ onBack }) {
  // Get user from auth context
  const { user } = useAuth();
  
  // Default location - set initial location to default
  const defaultLocation = {
    latitude: 13.036205,
    longitude: 121.486055,
  };

  const [location, setLocation] = useState(defaultLocation);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [pendingPin, setPendingPin] = useState(null);
  const [showSightingForm, setShowSightingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCoatPatternPicker, setShowCoatPatternPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [sightingForm, setSightingForm] = useState({
    catName: '',
    description: '',
    urgencyLevel: 'Just chilling',
    coatPattern: '',
    primaryColor: '',
    photo: null,
  });

  const coatPatterns = [
    'Solid (One single color)',
    'Tabby (Stripes, swirls, or "M" on forehead)',
    'Tuxedo (Black body with white chest/paws)',
    'Bicolor (Any other color + White)',
    'Calico (White + Orange + Black patches)',
    'Tortoiseshell (Black + Orange mottled, no white)',
    'Colorpoint (Light body, dark ears/tail - like a Siamese)',
  ];

  const primaryColors = [
    'Black',
    'White',
    'Orange Ginger',
    'Grey Blue',
    'Cream Buff',
    'Brown',
  ];

  useEffect(() => {
    requestLocationPermission();
    return () => {
      // Cleanup if needed
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      
      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use the map.',
          [{ text: 'OK' }]
        );
        setLocationPermission(false);
        // Use default location when services are disabled
        setLocation(defaultLocation);
        setLoading(false);
        return;
      }

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show your current location on the map.',
          [{ text: 'OK' }]
        );
        setLocationPermission(false);
        // Use default location when permission is denied
        setLocation(defaultLocation);
        setLoading(false);
        return;
      }

      setLocationPermission(true);
      
      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLoc = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setUserLocation(userLoc);
      setLocation(userLoc);
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get your current location. Please try again.',
        [{ text: 'OK' }]
      );
      // Use default location when there's an error
      setLocation(defaultLocation);
      setLoading(false);
    }
  };

  const handleCenterOnUser = async () => {
    if (!locationPermission) {
      await requestLocationPermission();
      return;
    }

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLoc = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(userLoc);
      setUserLocation(userLoc);
    } catch (error) {
      console.error('Error centering on user:', error);
      Alert.alert('Error', 'Failed to get your current location.');
    }
  };

  const handleMapLongPress = (event) => {
    const { geometry } = event;
    const coordinates = {
      latitude: geometry.coordinates[1],
      longitude: geometry.coordinates[0],
    };
    setPendingPin(coordinates);
    setShowSightingForm(true);
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSightingForm((prev) => ({ ...prev, photo: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSightingForm((prev) => ({ ...prev, photo: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleShowImageOptions = () => {
    Alert.alert(
      'Select Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: handleTakePhoto },
        { text: 'Gallery', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSubmitSighting = async () => {
    if (!sightingForm.catName.trim()) {
      Alert.alert('Validation Error', 'Please enter a cat name or nickname.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to report a sighting.');
      return;
    }

    if (!pendingPin) {
      Alert.alert('Error', 'Location is required.');
      return;
    }

    // Show agreement confirmation dialog
    Alert.alert(
      'Report Confirmation',
      'I confirm that this report is truthful, accurate, and responsible. I understand that this information is not fake news or misleading.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'I Agree',
          onPress: async () => {
            setSubmitting(true);

            try {
              const { data, error } = await createSighting(user.id, {
                catName: sightingForm.catName,
                description: sightingForm.description,
                urgencyLevel: sightingForm.urgencyLevel,
                coatPattern: sightingForm.coatPattern,
                primaryColor: sightingForm.primaryColor,
                latitude: pendingPin.latitude,
                longitude: pendingPin.longitude,
                photoUri: sightingForm.photo,
              });

              if (error) {
                throw error;
              }

              Alert.alert('Success', 'Cat sighting saved!', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Reset form and close modal
                    setSightingForm({
                      catName: '',
                      description: '',
                      urgencyLevel: 'Just chilling',
                      coatPattern: '',
                      primaryColor: '',
                      photo: null,
                    });
                    setPendingPin(null);
                    setShowSightingForm(false);
                  },
                },
              ]);
            } catch (error) {
              console.error('Error saving sighting:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to save cat sighting. Please try again.'
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCancelSighting = () => {
    Alert.alert(
      'Cancel Sighting',
      'Are you sure you want to cancel? This will remove the pending pin.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            setSightingForm({
              catName: '',
              description: '',
              urgencyLevel: 'Just chilling',
              coatPattern: '',
              primaryColor: '',
              photo: null,
            });
            setPendingPin(null);
            setShowSightingForm(false);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <View style={styles.backButtonCircle}>
              <FontAwesome name="arrow-left" size={18} color={colors.textDark} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Map View</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  // Show message if running on web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <View style={styles.backButtonCircle}>
              <FontAwesome name="arrow-left" size={18} color={colors.textDark} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Map View</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Map Not Available on Web</Text>
          <Text style={styles.errorText}>
            Mapbox maps are only available on native platforms (iOS and Android).{'\n\n'}
            Please run the app on a device or emulator to use the map feature.
          </Text>
        </View>
      </View>
    );
  }

  // Show error if Mapbox is not available or token is not configured
  if (!Mapbox || !MAPBOX_ACCESS_TOKEN) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <View style={styles.backButtonCircle}>
              <FontAwesome name="arrow-left" size={18} color={colors.textDark} />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Map View</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Mapbox Token Required</Text>
          <Text style={styles.errorText}>
            Please configure your Mapbox access token in the .env file.{'\n\n'}
            Add this line to your .env file:{'\n'}
            <Text style={styles.codeText}>EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here</Text>
            {'\n\n'}
            Get your token at:{'\n'}
            <Text style={styles.linkText}>https://account.mapbox.com/access-tokens/</Text>
          </Text>
        </View>
      </View>
    );
  }

  // Use location state (which defaults to defaultLocation if no permission/user location)
  const mapCenter = location;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <View style={styles.backButtonCircle}>
            <FontAwesome name="arrow-left" size={18} color={colors.textDark} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Map View</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {/* Instruction text */}
        <View style={styles.instructionContainer}>
          <View style={styles.instructionBox}>
            <MaterialCommunityIcons name="information" size={16} color={colors.primary} />
            <Text style={styles.instructionText}>Hold on the map to report a sighting</Text>
          </View>
        </View>

        <Mapbox.MapView
          style={styles.map}
          styleURL={Mapbox.StyleURL.Street}
          logoEnabled={false}
          attributionEnabled={false}
          onLongPress={handleMapLongPress}
        >
          <Mapbox.Camera
            zoomLevel={15}
            centerCoordinate={[mapCenter.longitude, mapCenter.latitude]}
            animationMode="flyTo"
            animationDuration={2000}
          />

          {/* User location - Use Mapbox built-in component when permission is granted */}
          {locationPermission ? (
            <Mapbox.UserLocation
              visible={true}
              showsUserHeadingIndicator={true}
            />
          ) : (
            /* Custom user location marker as fallback when UserLocation component not available */
            userLocation && (
              <Mapbox.PointAnnotation
                id="userLocation"
                coordinate={[userLocation.longitude, userLocation.latitude]}
              >
                <View style={styles.userLocationMarker}>
                  <View style={styles.userLocationPulse} />
                  <View style={styles.userLocationDot} />
                </View>
              </Mapbox.PointAnnotation>
            )
          )}

          {/* Pending pin marker */}
          {pendingPin && (
            <Mapbox.PointAnnotation
              id="pendingPin"
              coordinate={[pendingPin.longitude, pendingPin.latitude]}
            >
              <View style={styles.pendingPinMarker}>
                <MaterialCommunityIcons name="cat" size={32} color={colors.primary} />
                <View style={styles.pendingPinPulse} />
              </View>
            </Mapbox.PointAnnotation>
          )}
        </Mapbox.MapView>

        {/* Center on user button */}
        {locationPermission && (
          <TouchableOpacity
            style={styles.centerButton}
            onPress={handleCenterOnUser}
            activeOpacity={0.8}
          >
            <FontAwesome name="location-arrow" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sighting Form Modal */}
      <Modal
        visible={showSightingForm}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelSighting}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalBackdrop} />
          <View style={[styles.modalContent, submitting && styles.modalContentDisabled]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Cat Sighting</Text>
              <TouchableOpacity onPress={handleCancelSighting}>
                <FontAwesome name="times" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Cat Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Cat Name / Nickname *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., The Grocery Store Tabby"
                  placeholderTextColor={colors.text}
                  value={sightingForm.catName}
                  onChangeText={(text) => setSightingForm((prev) => ({ ...prev, catName: text }))}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., Very shy, orange, wearing a blue collar"
                  placeholderTextColor={colors.text}
                  value={sightingForm.description}
                  onChangeText={(text) => setSightingForm((prev) => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Coat Pattern */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Coat Pattern (Recommended)</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowCoatPatternPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownText, !sightingForm.coatPattern && styles.dropdownPlaceholder]}>
                    {sightingForm.coatPattern ? sightingForm.coatPattern.split(' (')[0] : 'Select coat pattern'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Primary Color */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Primary Color</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowColorPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownText, !sightingForm.primaryColor && styles.dropdownPlaceholder]}>
                    {sightingForm.primaryColor || 'Select primary color'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Urgency Level */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Urgency Level</Text>
                <View style={styles.urgencyButtons}>
                  {[
                    { level: 'Just chilling', icon: 'emoticon-happy', color: colors.success },
                    { level: 'Needs food', icon: 'food', color: colors.warning },
                    { level: 'Appears injured', icon: 'alert-circle', color: colors.error },
                  ].map(({ level, icon, color }) => {
                    const isActive = sightingForm.urgencyLevel === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.urgencyButton,
                          isActive && { borderColor: color },
                        ]}
                        onPress={() => setSightingForm((prev) => ({ ...prev, urgencyLevel: level }))}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={icon}
                          size={20}
                          color={isActive ? color : colors.text}
                        />
                        <Text
                          style={[
                            styles.urgencyButtonText,
                            isActive && { color: color },
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Photo Upload */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Photo</Text>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={handleShowImageOptions}
                  activeOpacity={0.7}
                >
                  {sightingForm.photo ? (
                    <Image source={{ uri: sightingForm.photo }} style={styles.photoPreview} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <MaterialCommunityIcons name="camera" size={32} color={colors.primary} />
                      <Text style={styles.photoPlaceholderText}>Take Photo or Choose from Gallery</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {sightingForm.photo && (
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => setSightingForm((prev) => ({ ...prev, photo: null }))}
                  >
                    <Text style={styles.removePhotoText}>Remove Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSighting}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitSighting}
                activeOpacity={0.7}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Sighting</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        
      </Modal>

      {/* Coat Pattern Picker Modal */}
      <Modal
        visible={showCoatPatternPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCoatPatternPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCoatPatternPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Coat Pattern</Text>
              <TouchableOpacity onPress={() => setShowCoatPatternPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerModalList}>
              {/* Clear option */}
              <TouchableOpacity
                style={[styles.pickerItem, !sightingForm.coatPattern && styles.pickerItemSelected]}
                onPress={() => {
                  setSightingForm((prev) => ({ ...prev, coatPattern: '' }));
                  setShowCoatPatternPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerItemText, !sightingForm.coatPattern && styles.pickerItemTextSelected]}>
                  Clear Selection
                </Text>
                {!sightingForm.coatPattern && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
              {coatPatterns.map((pattern) => {
                const patternName = pattern.split(' (')[0];
                const isSelected = sightingForm.coatPattern === pattern;
                return (
                  <TouchableOpacity
                    key={pattern}
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => {
                      setSightingForm((prev) => ({ ...prev, coatPattern: pattern }));
                      setShowCoatPatternPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                      {patternName}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Primary Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowColorPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Primary Color</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerModalList}>
              {/* Clear option */}
              <TouchableOpacity
                style={[styles.pickerItem, !sightingForm.primaryColor && styles.pickerItemSelected]}
                onPress={() => {
                  setSightingForm((prev) => ({ ...prev, primaryColor: '' }));
                  setShowColorPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerItemText, !sightingForm.primaryColor && styles.pickerItemTextSelected]}>
                  Clear Selection
                </Text>
                {!sightingForm.primaryColor && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
              {primaryColors.map((color) => {
                const isSelected = sightingForm.primaryColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => {
                      setSightingForm((prev) => ({ ...prev, primaryColor: color }));
                      setShowColorPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                      {color}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Separate Modal for Loading Overlay to ensure it's on top */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={submitting}
        statusBarTranslucent={true}
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Saving sighting...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  headerSpacer: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  instructionContainer: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1,
    alignItems: 'center',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
    gap: theme.spacing.xs,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: colors.cream,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    color: colors.textDark,
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  centerButton: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  pendingPinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pendingPinPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalContentDisabled: {
    opacity: 0.6,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
  },
  modalBody: {
    padding: theme.spacing.md,
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: colors.textDark,
  },
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.md,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
  },
  dropdownPlaceholder: {
    color: colors.text,
  },
  urgencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  urgencyButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  urgencyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
  },
  photoButton: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  photoPlaceholderText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  removePhotoText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  submitButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  pickerModalList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 48,
  },
  pickerItemSelected: {
    backgroundColor: colors.background,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
    flexShrink: 1,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

