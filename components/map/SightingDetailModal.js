// 1. React and React Native
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
// (None)

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function SightingDetailModal({ visible, sighting, onClose, userLocation, onGetDirections, loadingDirections }) {
  if (!sighting) return null;

  const getUrgencyIcon = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'Just chilling':
        return { name: 'emoticon-happy', color: colors.success };
      case 'Needs food':
        return { name: 'food', color: colors.warning };
      case 'Appears injured':
        return { name: 'alert-circle', color: colors.error };
      default:
        return { name: 'information', color: colors.primary };
    }
  };

  const urgencyIcon = getUrgencyIcon(sighting.urgency_level);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleGetDirections = async () => {
    if (!userLocation) {
      Alert.alert(
        'Location Unavailable',
        'Your current location is not available. Please enable location services.',
        [{ text: 'OK' }]
      );
      return;
    }

    const { latitude, longitude } = sighting;
    const { latitude: userLat, longitude: userLon } = userLocation;

    // Create URL for directions
    let url;
    if (Platform.OS === 'ios') {
      // Apple Maps
      url = `http://maps.apple.com/?saddr=${userLat},${userLon}&daddr=${latitude},${longitude}&dirflg=d`;
    } else {
      // Google Maps for Android
      url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${latitude},${longitude}&travelmode=driving`;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to generic Google Maps URL
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${latitude},${longitude}&travelmode=driving`;
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open maps. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Error opening directions:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalBackdrop} />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cat Sighting Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
              <FontAwesome name="times" size={20} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Photo */}
            {sighting.photo_url && (
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: sighting.photo_url }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Cat Name */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="cat" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Cat Name</Text>
              </View>
              <Text style={styles.detailValue}>{sighting.cat_name}</Text>
            </View>

            {/* Urgency Level */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons
                  name={urgencyIcon.name}
                  size={20}
                  color={urgencyIcon.color}
                />
                <Text style={styles.detailLabel}>Urgency Level</Text>
              </View>
              <View style={[styles.urgencyBadge, { borderColor: urgencyIcon.color }]}>
                <Text style={[styles.urgencyText, { color: urgencyIcon.color }]}>
                  {sighting.urgency_level}
                </Text>
              </View>
            </View>

            {/* Description */}
            {sighting.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{sighting.description}</Text>
              </View>
            )}

            {/* Coat Pattern */}
            {sighting.coat_pattern && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coat Pattern</Text>
                <Text style={styles.detailValue}>
                  {sighting.coat_pattern.split(' (')[0]}
                </Text>
              </View>
            )}

            {/* Primary Color */}
            {sighting.primary_color && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Primary Color</Text>
                <Text style={styles.detailValue}>{sighting.primary_color}</Text>
              </View>
            )}

            {/* Location */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Location</Text>
              </View>
              <Text style={styles.detailValue}>
                {sighting.latitude.toFixed(6)}, {sighting.longitude.toFixed(6)}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Reported</Text>
              </View>
              <Text style={styles.detailValue}>{formatDate(sighting.created_at)}</Text>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.directionButton, loadingDirections && styles.directionButtonDisabled]}
              onPress={() => {
                if (!loadingDirections) {
                  if (onGetDirections) {
                    onGetDirections(sighting, userLocation);
                  } else {
                    handleGetDirections();
                  }
                }
              }}
              activeOpacity={0.7}
              disabled={loadingDirections}
            >
              {loadingDirections ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.directionButtonText}>Loading...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="directions" size={18} color="#ffffff" />
                  <Text style={styles.directionButtonText}>Get Directions</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeIconButton: {
    padding: theme.spacing.xs,
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
  photoContainer: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  detailRow: {
    marginBottom: theme.spacing.lg,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 22,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    backgroundColor: colors.cream,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  directionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.primary,
  },
  directionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  directionButtonDisabled: {
    opacity: 0.6,
  },
  closeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.beige,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
});

