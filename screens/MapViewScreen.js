// 1. React and React Native
import React, { useState, useEffect, useRef } from 'react';
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
  Linking,
} from 'react-native';
import * as Location from 'expo-location';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

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
import { createSighting, getSightings } from '../services/sightingService';
import { useAuth } from '../contexts/AuthContext';
import { useLocationPermission } from '../hooks/useLocationPermission';
import { useImagePicker } from '../hooks/useImagePicker';

// 4. Local components
import SightingFormModal from '../components/map/SightingFormModal';
import SightingDetailModal from '../components/map/SightingDetailModal';
import SightingMarker from '../components/map/SightingMarker';
import MapFilter from '../components/map/MapFilter';
import MapStyleSelector from '../components/map/MapStyleSelector';
import MapLayersControl from '../components/map/MapLayersControl';
import MapTiltControl from '../components/map/MapTiltControl';
import { UserLocationMarker, PendingPinMarker } from '../components/map/MapMarkers';

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

  // Use location permission hook
  const {
    location,
    loading,
    locationPermission,
    userLocation,
    centerOnUser,
  } = useLocationPermission(defaultLocation);

  const [pendingPin, setPendingPin] = useState(null);
  const [showSightingForm, setShowSightingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCoatPatternPicker, setShowCoatPatternPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [sightings, setSightings] = useState([]);
  const [selectedSighting, setSelectedSighting] = useState(null);
  const [showSightingDetail, setShowSightingDetail] = useState(false);
  const [loadingSightings, setLoadingSightings] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [routeDestination, setRouteDestination] = useState(null);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [hasUserCentered, setHasUserCentered] = useState(false);
  const [mapStyle, setMapStyle] = useState('Street');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [show3DBuildings, setShow3DBuildings] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [isLayersExpanded, setIsLayersExpanded] = useState(false);
  const pitchChangeRef = useRef(false);
  const stableCenterRef = useRef(null);

  // Disable 3D buildings for Satellite and other styles that don't support it well
  const is3DBuildingsSupported = mapStyle !== 'Satellite';

  // Auto-disable 3D buildings when switching to unsupported styles
  useEffect(() => {
    if (!is3DBuildingsSupported && show3DBuildings) {
      setShow3DBuildings(false);
    }
  }, [mapStyle, is3DBuildingsSupported]);
  const [sightingForm, setSightingForm] = useState({
    catName: '',
    description: '',
    urgencyLevel: 'Just chilling',
    coatPattern: '',
    primaryColor: '',
    photo: null,
  });

  // Use image picker hook
  const { imageUri: pickedPhotoUri, showImagePickerOptions: showImageOptions, setImageUri: setPhotoUri } = useImagePicker({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  // Update photo when image is picked
  useEffect(() => {
    if (pickedPhotoUri) {
      setSightingForm((prev) => ({ ...prev, photo: pickedPhotoUri }));
    }
  }, [pickedPhotoUri]);

  // Center map on user location when it becomes available (only on initial load, once)
  useEffect(() => {
    // Prioritize userLocation if available, otherwise use location
    const targetLocation = userLocation || location;
    
    if (targetLocation && !hasUserCentered && targetLocation.latitude !== defaultLocation.latitude) {
      // Small delay to ensure map is ready
      const timer = setTimeout(() => {
        setMapCenter({
          latitude: targetLocation.latitude,
          longitude: targetLocation.longitude,
        });
        setHasUserCentered(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
    // Only run once when component mounts and location is available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load sightings when map is ready or filter changes
  useEffect(() => {
    if (!loading && Mapbox && MAPBOX_ACCESS_TOKEN) {
      loadSightings();
    }
  }, [loading, Mapbox, MAPBOX_ACCESS_TOKEN, dateFilter]);

  // Use mapCenter state if available, otherwise fall back to location
  const currentMapCenter = mapCenter || location;
  
  // Store stable center coordinate - only update when we actually want to move the map
  useEffect(() => {
    if (currentMapCenter && !pitchChangeRef.current) {
      stableCenterRef.current = {
        latitude: currentMapCenter.latitude,
        longitude: currentMapCenter.longitude,
      };
    }
  }, [currentMapCenter]);
  
  // Use stable center when pitch is changing, otherwise use current center
  const cameraCenter = pitchChangeRef.current && stableCenterRef.current
    ? stableCenterRef.current
    : currentMapCenter;

  const loadSightings = async () => {
    setLoadingSightings(true);
    try {
      const { data, error } = await getSightings({ dateFilter });
      if (error) {
        console.error('Error loading sightings:', error);
      } else {
        setSightings(data || []);
      }
    } catch (error) {
      console.error('Error loading sightings:', error);
    } finally {
      setLoadingSightings(false);
    }
  };

  const handleGetDirections = async (sighting, userLoc) => {
    if (!userLoc || !sighting) {
      Alert.alert(
        'Location Unavailable',
        'Your current location is not available. Please enable location services.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!MAPBOX_ACCESS_TOKEN) {
      Alert.alert('Error', 'Mapbox access token not configured.');
      return;
    }

    setLoadingDirections(true);

    try {
      // Fetch route from Mapbox Directions API
      const origin = `${userLoc.longitude},${userLoc.latitude}`;
      const destination = `${sighting.longitude},${sighting.latitude}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        console.error('Directions API error:', response.status, errorData);
        
        let errorMessage = 'Unable to get directions. ';
        if (response.status === 401) {
          errorMessage += 'Invalid API token. Please check your Mapbox configuration.';
        } else if (response.status === 403) {
          errorMessage += 'API token does not have permission to access Directions API.';
        } else if (errorData.message) {
          errorMessage += errorData.message;
        } else {
          errorMessage += 'Please try again.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        if (route.geometry && route.geometry.coordinates) {
          const coordinates = route.geometry.coordinates.map(coord => [coord[0], coord[1]]);
          setRouteCoordinates(coordinates);
          
          // Store destination for navigation
          setRouteDestination({
            latitude: sighting.latitude,
            longitude: sighting.longitude,
          });

          // Close the modal
          setShowSightingDetail(false);
          setSelectedSighting(null);

          // Center map on route
          if (coordinates.length > 0) {
            const midIndex = Math.floor(coordinates.length / 2);
            const midCoord = coordinates[midIndex];
            setMapCenter({
              latitude: midCoord[1],
              longitude: midCoord[0],
            });
          }
        } else {
          console.error('Route geometry not found in response');
          Alert.alert(
            'Error',
            'Route data format is invalid. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        const errorMessage = data.message || 'Unable to get directions. Please try again.';
        console.error('Directions API returned error:', data.code, errorMessage);
        Alert.alert(
          'Error',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      let errorMessage = 'Unable to get directions. ';
      
      if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingDirections(false);
    }
  };

  const handleStartNavigation = async () => {
    if (!routeDestination || !userLocation) {
      Alert.alert(
        'Error',
        'Unable to start navigation. Location information is missing.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const { latitude, longitude } = routeDestination;
      const { latitude: userLat, longitude: userLon } = userLocation;

      let url;
      if (Platform.OS === 'ios') {
        // Apple Maps with turn-by-turn navigation
        url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
      } else {
        // Google Maps with turn-by-turn navigation
        url = `google.navigation:q=${latitude},${longitude}`;
        
        // Check if Google Maps can handle the URL, otherwise use web URL
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&nav=1`;
        }
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web-based directions
        const fallbackUrl = Platform.OS === 'ios'
          ? `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`
          : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      console.error('Error starting navigation:', error);
      Alert.alert(
        'Error',
        'Unable to open navigation app. Please try again.',
        [{ text: 'OK' }]
      );
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
    // Clear route when map is long pressed
    if (routeCoordinates) {
      setRouteCoordinates(null);
    }
  };

  const handleShowImageOptions = () => {
    showImageOptions();
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleSubmitSighting = async () => {
    if (!sightingForm.catName.trim()) {
      Alert.alert('Validation Error', 'Please enter a cat name or nickname.');
      return;
    }

    // Description is now required
    if (!sightingForm.description || !sightingForm.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description of the cat.');
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

    // GPS distance validation (anti-cheat) - prevent pins too far from user's GPS position
    const MAX_DISTANCE_METERS = 1000; // 1 kilometer maximum distance
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        pendingPin.latitude,
        pendingPin.longitude
      );

      if (distance > MAX_DISTANCE_METERS) {
        Alert.alert(
          'Location Too Far',
          `The pin location is ${Math.round(distance)} meters away from your current location. Please place the pin within ${MAX_DISTANCE_METERS} meters of your current position.`,
          [{ text: 'OK' }]
        );
        return;
      }
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
                    setPhotoUri(null);
                    // Reload sightings to show the new one
                    loadSightings();
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
        {/* Map Style Selector */}
        <MapStyleSelector
          selectedStyle={mapStyle}
          onStyleChange={setMapStyle}
          isLayersExpanded={isLayersExpanded}
        />

        {/* Map Layers Control */}
        <MapLayersControl
          showHeatmap={showHeatmap}
          onHeatmapToggle={() => setShowHeatmap(!showHeatmap)}
          show3DBuildings={show3DBuildings}
          on3DBuildingsToggle={() => {
            if (is3DBuildingsSupported) {
              setShow3DBuildings(!show3DBuildings);
            }
          }}
          is3DBuildingsDisabled={!is3DBuildingsSupported}
          onExpandChange={setIsLayersExpanded}
        />

        {/* Map Tilt Control */}
        <MapTiltControl
          pitch={pitch}
          onPitchChange={(newPitch) => {
            pitchChangeRef.current = true;
            setPitch(newPitch);
            // Reset flag after a short delay
            setTimeout(() => {
              pitchChangeRef.current = false;
            }, 100);
          }}
        />

        {/* Instruction text - Hide when route is displayed */}
        {!routeCoordinates && (
          <View style={styles.instructionContainer}>
            <View style={styles.instructionBox}>
              <MaterialCommunityIcons name="information" size={16} color={colors.primary} />
              <Text style={styles.instructionText}>
                Hold on the map to report a sighting
              </Text>
            </View>
          </View>
        )}

        {/* Navigation and Clear route buttons */}
        {routeCoordinates && (
          <>
            {/* Navigate button */}
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={handleStartNavigation}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="navigation" size={20} color="#ffffff" />
              <Text style={styles.navigateButtonText}>Navigate</Text>
            </TouchableOpacity>
            
            {/* Clear route button */}
            <TouchableOpacity
              style={styles.clearRouteButton}
              onPress={() => {
                setRouteCoordinates(null);
                setRouteDestination(null);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
              <Text style={styles.clearRouteButtonText}>Clear Route</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Filter - Bottom of screen */}
        <MapFilter
          selectedFilter={dateFilter}
          onFilterChange={setDateFilter}
          onExpandChange={setIsFilterExpanded}
        />

        <Mapbox.MapView
          style={styles.map}
          styleURL={Mapbox.StyleURL[mapStyle] || Mapbox.StyleURL.Street}
          logoEnabled={false}
          attributionEnabled={false}
          onLongPress={handleMapLongPress}
          onMapIdle={(state) => {
            // Update zoom level when user manually zooms to preserve it
            if (state.properties.zoomLevel && Math.abs(state.properties.zoomLevel - zoomLevel) > 0.1) {
              setZoomLevel(state.properties.zoomLevel);
            }
          }}
        >
          <Mapbox.Camera
            key={`camera-${stableCenterRef.current ? stableCenterRef.current.latitude.toFixed(6) : cameraCenter.latitude.toFixed(6)}-${stableCenterRef.current ? stableCenterRef.current.longitude.toFixed(6) : cameraCenter.longitude.toFixed(6)}`}
            zoomLevel={zoomLevel}
            centerCoordinate={pitchChangeRef.current && stableCenterRef.current 
              ? [stableCenterRef.current.longitude, stableCenterRef.current.latitude]
              : [cameraCenter.longitude, cameraCenter.latitude]}
            pitch={pitch}
            animationMode={pitchChangeRef.current ? "none" : "flyTo"}
            animationDuration={pitchChangeRef.current ? 0 : 1500}
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
                <UserLocationMarker />
              </Mapbox.PointAnnotation>
            )
          )}

          {/* Pending pin marker */}
          {pendingPin && (
            <Mapbox.PointAnnotation
              id="pendingPin"
              coordinate={[pendingPin.longitude, pendingPin.latitude]}
            >
              <PendingPinMarker />
            </Mapbox.PointAnnotation>
          )}

          {/* Saved sightings markers */}
          {sightings.map((sighting) => (
            <Mapbox.PointAnnotation
              key={sighting.id}
              id={`sighting-${sighting.id}`}
              coordinate={[sighting.longitude, sighting.latitude]}
              onSelected={() => {
                setSelectedSighting(sighting);
                setShowSightingDetail(true);
              }}
            >
              <SightingMarker urgencyLevel={sighting.urgency_level} />
            </Mapbox.PointAnnotation>
          ))}

          {/* Route line */}
          {routeCoordinates && routeCoordinates.length > 0 && (
            <Mapbox.ShapeSource
              id="routeSource"
              shape={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: routeCoordinates,
                },
              }}
            >
              <Mapbox.LineLayer
                id="routeLayer"
                style={{
                  lineColor: colors.primary,
                  lineWidth: 4,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </Mapbox.ShapeSource>
          )}

          {/* Heatmap Layer */}
          {showHeatmap && sightings.length > 0 && (
            <Mapbox.ShapeSource
              id="heatmapSource"
              shape={{
                type: 'FeatureCollection',
                features: sightings.map((sighting) => ({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [sighting.longitude, sighting.latitude],
                  },
                  properties: {
                    weight: 1,
                  },
                })),
              }}
            >
              <Mapbox.HeatmapLayer
                id="heatmapLayer"
                style={{
                  heatmapColor: [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0,
                    'rgba(0, 0, 255, 0)',
                    0.1,
                    'rgba(0, 255, 255, 0.3)',
                    0.5,
                    'rgba(0, 255, 0, 0.5)',
                    0.7,
                    'rgba(255, 255, 0, 0.7)',
                    1,
                    'rgba(255, 0, 0, 1)',
                  ],
                  heatmapWeight: [
                    'interpolate',
                    ['linear'],
                    ['get', 'weight'],
                    0,
                    0,
                    1,
                    1,
                  ],
                  heatmapIntensity: [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0,
                    1,
                    9,
                    3,
                  ],
                  heatmapRadius: [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0,
                    2,
                    9,
                    20,
                  ],
                  heatmapOpacity: 0.6,
                }}
              />
            </Mapbox.ShapeSource>
          )}

          {/* 3D Buildings Layer - Only show if supported by current map style */}
          {show3DBuildings && is3DBuildingsSupported && (
            <Mapbox.VectorSource id="composite" url="mapbox://mapbox.mapbox-streets-v8">
              <Mapbox.FillExtrusionLayer
                id="3d-buildings"
                sourceLayerID="building"
                style={{
                  fillExtrusionColor: '#aaa',
                  fillExtrusionOpacity: 0.6,
                  fillExtrusionHeight: [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'height'],
                  ],
                  fillExtrusionBase: [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'min_height'],
                  ],
                }}
              />
            </Mapbox.VectorSource>
          )}
        </Mapbox.MapView>

        {/* Center on user button */}
        {locationPermission && (
          <TouchableOpacity
            style={[
              styles.centerButton,
              isFilterExpanded && styles.centerButtonExpanded,
            ]}
            onPress={async () => {
              try {
                // Get current location directly
                const currentLocation = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.High,
                });
                
                const newLocation = {
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                };
                
                // Update map center immediately
                setMapCenter(newLocation);
                setHasUserCentered(true);
                
                // Also call the hook's centerOnUser to update location state
                centerOnUser();
              } catch (error) {
                console.error('Error centering on user:', error);
                Alert.alert('Error', 'Failed to get your current location.');
              }
            }}
            activeOpacity={0.8}
          >
            <FontAwesome name="location-arrow" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sighting Form Modal */}
      <SightingFormModal
        visible={showSightingForm}
        sightingForm={sightingForm}
        onFormChange={setSightingForm}
        submitting={submitting}
        showCoatPatternPicker={showCoatPatternPicker}
        showColorPicker={showColorPicker}
        onShowCoatPatternPicker={() => setShowCoatPatternPicker(!showCoatPatternPicker)}
        onShowColorPicker={() => setShowColorPicker(!showColorPicker)}
        onShowImageOptions={handleShowImageOptions}
        onRemovePhoto={() => {
          setSightingForm((prev) => ({ ...prev, photo: null }));
          setPhotoUri(null);
        }}
        onSubmit={handleSubmitSighting}
        onCancel={handleCancelSighting}
      />

      {/* Sighting Detail Modal */}
      <SightingDetailModal
        visible={showSightingDetail}
        sighting={selectedSighting}
        onClose={() => {
          setShowSightingDetail(false);
          setSelectedSighting(null);
        }}
        userLocation={userLocation}
        onGetDirections={handleGetDirections}
        loadingDirections={loadingDirections}
      />
      
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
    top: theme.spacing.xxl,
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
  navigateButton: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  clearRouteButton: {
    position: 'absolute',
    top: 100,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearRouteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
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
    right: theme.spacing.md,
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
    marginBottom: theme.spacing.xxl,
  },
  centerButtonExpanded: {
    marginBottom: theme.spacing.xxxxxxl,
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
});

