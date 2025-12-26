// 1. React and React Native
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { shareSighting } from '../../services/shareService';

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function SightingListItem({ sighting, onPress, canEdit = false, onShare }) {
  const getUrgencyColor = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'Just chilling':
        return colors.success;
      case 'Needs food':
        return colors.warning;
      case 'Appears injured':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const urgencyColor = getUrgencyColor(sighting.urgency_level);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Photo Thumbnail */}
      <View style={styles.photoContainer}>
        {sighting.photo_url ? (
          <Image
            source={{ uri: sighting.photo_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <MaterialCommunityIcons name="cat" size={32} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.catName} numberOfLines={1}>
            {sighting.cat_name}
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering onPress of parent
                if (onShare) {
                  onShare(sighting);
                } else {
                  // Fallback: share directly
                  shareSighting(sighting, {
                    includePhoto: false,
                    includeDeepLink: true,
                  }).catch((error) => {
                    console.error('Error sharing sighting:', error);
                    Alert.alert('Error', 'Failed to share sighting. Please try again.');
                  });
                }
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="share-variant" size={16} color={colors.primary} />
            </TouchableOpacity>
            {canEdit && (
              <View style={styles.editBadge}>
                <MaterialCommunityIcons name="pencil" size={12} color={colors.primary} />
              </View>
            )}
          </View>
        </View>

        {sighting.description && (
          <Text style={styles.description} numberOfLines={2}>
            {sighting.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={[styles.urgencyBadge, { borderColor: urgencyColor }]}>
            <MaterialCommunityIcons
              name={
                sighting.urgency_level === 'Just chilling'
                  ? 'emoticon-happy'
                  : sighting.urgency_level === 'Needs food'
                  ? 'food'
                  : 'alert-circle'
              }
              size={12}
              color={urgencyColor}
            />
            <Text style={[styles.urgencyText, { color: urgencyColor }]}>
              {sighting.urgency_level}
            </Text>
          </View>

          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker" size={12} color={colors.text} />
            <Text style={styles.locationText} numberOfLines={1}>
              {sighting.latitude.toFixed(4)}, {sighting.longitude.toFixed(4)}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText}>{formatDate(sighting.created_at)}</Text>
      </View>

      {/* Chevron */}
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.text}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  catName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  shareButton: {
    padding: theme.spacing.xs,
  },
  editBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    backgroundColor: colors.cream,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: colors.text,
  },
  dateText: {
    fontSize: 12,
    color: colors.textLight,
  },
  chevron: {
    marginLeft: theme.spacing.sm,
  },
});


