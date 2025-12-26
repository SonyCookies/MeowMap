// 1. React and React Native
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ImageBackground,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

// 2. Third-party libraries
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { getUserSightings, deleteSighting, updateSighting } from '../services/sightingService';
import { createSightingDeletionNotification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

// 4. Local components
import SightingListItem from '../components/sightings/SightingListItem';
import SightingFilters from '../components/sightings/SightingFilters';
import SightingSearchBar from '../components/sightings/SightingSearchBar';
import SightingDetailModal from '../components/map/SightingDetailModal';
import SightingFormModal from '../components/map/SightingFormModal';
import CoatPatternPicker from '../components/map/CoatPatternPicker';
import ColorPicker from '../components/map/ColorPicker';

// 5. Constants and contexts
import { colors, theme } from '../constants/theme';
import { useImagePicker } from '../hooks/useImagePicker';

export default function MySightingsScreen({ onBack, onShowInMap }) {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSighting, setSelectedSighting] = useState(null);
  const [showSightingDetail, setShowSightingDetail] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCoatPatternPicker, setShowCoatPatternPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filter and search state
  const [dateFilter, setDateFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    catName: '',
    description: '',
    urgencyLevel: 'Just chilling',
    coatPattern: '',
    primaryColor: '',
    photo: null,
  });

  // Image picker hook
  const { imageUri: pickedPhotoUri, showImagePickerOptions: showImageOptions, setImageUri: setPhotoUri } = useImagePicker({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  // Update photo when image is picked
  useEffect(() => {
    if (pickedPhotoUri) {
      setEditForm((prev) => ({ ...prev, photo: pickedPhotoUri }));
    }
  }, [pickedPhotoUri]);

  // Load sightings
  const loadSightings = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await getUserSightings(user.id, {
        dateFilter,
        urgencyFilter: urgencyFilter !== 'all' ? urgencyFilter : undefined,
        searchQuery: searchQuery.trim() || undefined,
        sortBy,
      });

      if (error) {
        console.error('Error loading sightings:', error);
        Alert.alert('Error', 'Failed to load your sightings. Please try again.');
      } else {
        setSightings(data || []);
      }
    } catch (error) {
      console.error('Error loading sightings:', error);
      Alert.alert('Error', 'Failed to load your sightings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, dateFilter, urgencyFilter, searchQuery, sortBy]);

  // Load sightings when filters change
  useEffect(() => {
    loadSightings();
  }, [loadSightings]);

  // Check if sighting can be edited (within 24 hours)
  const canEditSighting = (sighting) => {
    if (!sighting?.created_at) return false;
    const createdAt = new Date(sighting.created_at);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  // Handle sighting press
  const handleSightingPress = (sighting) => {
    setSelectedSighting(sighting);
    setShowSightingDetail(true);
  };

  // Handle edit
  const handleEdit = (sighting) => {
    if (!canEditSighting(sighting)) {
      Alert.alert(
        'Cannot Edit',
        'Sightings can only be edited within 24 hours of creation.'
      );
      return;
    }

    setEditForm({
      catName: sighting.cat_name || '',
      description: sighting.description || '',
      urgencyLevel: sighting.urgency_level || 'Just chilling',
      coatPattern: sighting.coat_pattern || '',
      primaryColor: sighting.primary_color || '',
      photo: sighting.photo_url || null,
    });
    setSelectedSighting(sighting);
    setShowSightingDetail(false);
    setShowEditForm(true);
  };

  // Handle delete
  const handleDelete = (sighting) => {
    Alert.alert(
      'Delete Sighting',
      `Are you sure you want to delete the sighting for "${sighting.cat_name}"? You can undo this action from notifications.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              // Store full sighting data before deleting
              const sightingData = { ...sighting };
              
              // Delete the sighting
              const { error } = await deleteSighting(sighting.id, sightingData);
              if (error) {
                throw error;
              }

              // Create notification with sighting data for undo
              const { data: notification, error: notifError } = await createSightingDeletionNotification(
                user.id,
                sightingData
              );

              if (notifError) {
                console.error('Error creating deletion notification:', notifError);
                // Still show success even if notification creation fails
              } else {
                // Refresh notifications to show the new one (don't call addNotification as it would create a duplicate)
                refreshNotifications();
              }

              Alert.alert('Success', 'Sighting deleted successfully. You can undo this from notifications.');
              loadSightings();
              setShowSightingDetail(false);
              setSelectedSighting(null);
            } catch (error) {
              console.error('Error deleting sighting:', error);
              Alert.alert('Error', 'Failed to delete sighting. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadSightings();
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="cat" size={64} color={colors.textLight} />
      <Text style={styles.emptyStateTitle}>No Sightings Yet</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || dateFilter !== 'all' || urgencyFilter !== 'all'
          ? 'No sightings match your filters. Try adjusting your search or filters.'
          : "You haven't reported any cat sightings yet. Start by adding one from the map!"}
      </Text>
    </View>
  );

  // Render list item
  const renderSightingItem = ({ item }) => (
    <SightingListItem
      sighting={item}
      onPress={() => handleSightingPress(item)}
      canEdit={canEditSighting(item)}
    />
  );

  return (
    <ImageBackground
      source={require('../assets/images/HomeScreenBg.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <View style={styles.backButtonCircle}>
            <FontAwesome name="arrow-left" size={18} color={colors.textDark} />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Sightings</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Search Bar */}
      <SightingSearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Filters */}
      <SightingFilters
        dateFilter={dateFilter}
        urgencyFilter={urgencyFilter}
        sortBy={sortBy}
        onDateFilterChange={setDateFilter}
        onUrgencyFilterChange={setUrgencyFilter}
        onSortChange={setSortBy}
      />

      {/* Sightings List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your sightings...</Text>
        </View>
      ) : (
        <FlatList
          data={sightings}
          renderItem={renderSightingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            sightings.length === 0 ? styles.emptyListContent : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Sighting Detail Modal */}
      <SightingDetailModal
        visible={showSightingDetail}
        sighting={selectedSighting}
        onClose={() => {
          setShowSightingDetail(false);
          setSelectedSighting(null);
        }}
        userLocation={null}
        onGetDirections={null}
        loadingDirections={false}
        onEdit={selectedSighting ? () => handleEdit(selectedSighting) : undefined}
        onDelete={selectedSighting ? () => handleDelete(selectedSighting) : undefined}
        canEdit={selectedSighting ? canEditSighting(selectedSighting) : false}
        deleting={deleting}
        onShowInMap={onShowInMap && selectedSighting ? () => onShowInMap(selectedSighting) : undefined}
      />

      {/* Edit Form Modal */}
      <SightingFormModal
        visible={showEditForm}
        sightingForm={editForm}
        onFormChange={setEditForm}
        submitting={false}
        showCoatPatternPicker={showCoatPatternPicker}
        showColorPicker={showColorPicker}
        onShowCoatPatternPicker={() => setShowCoatPatternPicker(true)}
        onShowColorPicker={() => setShowColorPicker(true)}
        onShowImageOptions={showImageOptions}
        onRemovePhoto={() => {
          setEditForm((prev) => ({ ...prev, photo: null }));
          setPhotoUri(null);
        }}
        onSubmit={async () => {
          if (!selectedSighting?.id) return;

          setLoading(true);
          try {
            const { data, error } = await updateSighting(selectedSighting.id, {
              catName: editForm.catName,
              description: editForm.description,
              urgencyLevel: editForm.urgencyLevel,
              coatPattern: editForm.coatPattern,
              primaryColor: editForm.primaryColor,
              photoUri: editForm.photo,
              photoUrl: editForm.photo,
            });

            if (error) {
              throw error;
            }

            Alert.alert('Success', 'Sighting updated successfully.');
            setShowEditForm(false);
            setSelectedSighting(null);
            setEditForm({
              catName: '',
              description: '',
              urgencyLevel: 'Just chilling',
              coatPattern: '',
              primaryColor: '',
              photo: null,
            });
            loadSightings();
          } catch (error) {
            console.error('Error updating sighting:', error);
            Alert.alert('Error', 'Failed to update sighting. Please try again.');
          } finally {
            setLoading(false);
          }
        }}
        onCancel={() => {
          setShowEditForm(false);
          setSelectedSighting(null);
          setEditForm({
            catName: '',
            description: '',
            urgencyLevel: 'Just chilling',
            coatPattern: '',
            primaryColor: '',
            photo: null,
          });
        }}
        isEditMode={true}
        sightingId={selectedSighting?.id}
      />

      {/* Coat Pattern Picker */}
      <CoatPatternPicker
        visible={showCoatPatternPicker}
        selectedPattern={editForm.coatPattern}
        onSelect={(pattern) => {
          setEditForm((prev) => ({ ...prev, coatPattern: pattern }));
          setShowCoatPatternPicker(false);
        }}
        onClose={() => setShowCoatPatternPicker(false)}
      />

      {/* Color Picker */}
      <ColorPicker
        visible={showColorPicker}
        selectedColor={editForm.primaryColor}
        onSelect={(color) => {
          setEditForm((prev) => ({ ...prev, primaryColor: color }));
          setShowColorPicker(false);
        }}
        onClose={() => setShowColorPicker(false)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  backgroundImage: {
    opacity: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.sm,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: colors.text,
  },
});

