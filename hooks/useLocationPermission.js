import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

/**
 * Custom hook for handling location permission and user location
 * 
 * @param {Object} defaultLocation - Default location to use if permission denied
 * @param {number} defaultLocation.latitude - Default latitude
 * @param {number} defaultLocation.longitude - Default longitude
 * @returns {Object} - Location state and functions
 */
export const useLocationPermission = (defaultLocation = { latitude: 0, longitude: 0 }) => {
  const [location, setLocation] = useState(defaultLocation);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  /**
   * Request location permission and get current location
   */
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
      setLocation(defaultLocation);
      setLoading(false);
    }
  };

  /**
   * Center map on user's current location
   */
  const centerOnUser = async () => {
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

  // Request permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  return {
    location,
    loading,
    locationPermission,
    userLocation,
    requestLocationPermission,
    centerOnUser,
  };
};

