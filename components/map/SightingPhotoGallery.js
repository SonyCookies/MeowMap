// 1. React and React Native
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { getSightingPhotos, addSightingPhoto, deleteSightingPhoto } from '../../services/photoService';
import { useAuth } from '../../contexts/AuthContext';
import { useImagePicker } from '../../hooks/useImagePicker';
import { formatTimeAgo } from '../../utils/notifications';
import { supabase } from '../../lib/supabase';

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SightingPhotoGallery({ sightingId, isOriginalPoster, onPhotoAdded, originalPhotoUrl, originalPhotoUserId, originalPhotoCreatedAt }) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [originalPhotoUser, setOriginalPhotoUser] = useState(null);
  const fullScreenScrollViewRef = useRef(null);

  const { imageUri: pickedImageUri, showImagePickerOptions, setImageUri: setPickedImageUri } = useImagePicker({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  useEffect(() => {
    if (sightingId) {
      loadPhotos();
    }
  }, [sightingId]);

  useEffect(() => {
    if (pickedImageUri && showAddPhotoModal) {
      // Image was picked, ready to add
    }
  }, [pickedImageUri]);

  // Load original photo user profile if needed
  useEffect(() => {
    if (originalPhotoUserId && !originalPhotoUser) {
      loadOriginalPhotoUser();
    }
  }, [originalPhotoUserId, originalPhotoUser]);

  // Scroll to selected photo when modal opens
  useEffect(() => {
    if (selectedPhoto !== null && fullScreenScrollViewRef.current) {
      setTimeout(() => {
        fullScreenScrollViewRef.current?.scrollTo({
          x: selectedPhotoIndex * SCREEN_WIDTH,
          animated: false,
        });
      }, 100);
    }
  }, [selectedPhoto, selectedPhotoIndex]);

  const loadOriginalPhotoUser = async () => {
    if (!originalPhotoUserId) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', originalPhotoUserId)
        .single();
      
      if (profile) {
        setOriginalPhotoUser({
          id: profile.id,
          display_name: profile.display_name || `User ${originalPhotoUserId.substring(0, 8)}`,
          avatar_url: profile.avatar_url || null,
        });
      }
    } catch (error) {
      console.error('Error loading original photo user:', error);
    }
  };

  const loadPhotos = async () => {
    if (!sightingId) return;

    setLoading(true);
    try {
      const { data, error } = await getSightingPhotos(sightingId);
      if (error) {
        console.error('Error loading photos:', error);
      } else {
        setPhotos(data || []);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to add photos.');
      return;
    }

    if (!pickedImageUri) {
      showImagePickerOptions();
      return;
    }

    setAddingPhoto(true);
    try {
      const { data, error } = await addSightingPhoto(sightingId, user.id, pickedImageUri, photoCaption);
      if (error) {
        throw error;
      }

      // Add new photo to list
      setPhotos((prev) => [...prev, data]);
      setPhotoCaption('');
      setPickedImageUri(null);
      setShowAddPhotoModal(false);

      if (onPhotoAdded) {
        onPhotoAdded();
      }

      Alert.alert('Success', 'Photo added successfully!');
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Error', error.message || 'Failed to add photo. Please try again.');
    } finally {
      setAddingPhoto(false);
    }
  };

  const handleDeletePhoto = (photoId) => {
    if (!user?.id) return;

    // Don't allow deleting the original photo (it's not in the database)
    if (photoId === 'original') {
      Alert.alert('Info', 'The original photo cannot be deleted from here.');
      return;
    }

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingPhotoId(photoId);
            try {
              const { error } = await deleteSightingPhoto(photoId, user.id);
              if (error) {
                throw error;
              }

              // Remove photo from list
              setPhotos((prev) => prev.filter((p) => p.id !== photoId));
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', error.message || 'Failed to delete photo. Please try again.');
            } finally {
              setDeletingPhotoId(null);
            }
          },
        },
      ]
    );
  };

  const openAddPhotoModal = () => {
    setShowAddPhotoModal(true);
    setPhotoCaption('');
    setPickedImageUri(null);
  };

  // Include original photo from sighting if it exists and not already in photos
  // This must be called before any conditional returns (Rules of Hooks)
  const allPhotos = React.useMemo(() => {
    const photoList = [...photos];
    
    // Add original photo if it exists and hasn't been added to gallery yet
    if (originalPhotoUrl && !photoList.some(p => p.photo_url === originalPhotoUrl)) {
      // Check if original photo was created before any gallery photos
      const originalDate = originalPhotoCreatedAt ? new Date(originalPhotoCreatedAt) : new Date(0);
      const galleryDates = photoList.map(p => new Date(p.created_at));
      const isOriginalFirst = galleryDates.length === 0 || galleryDates.every(d => d > originalDate);
      
      const originalPhoto = {
        id: 'original',
        sighting_id: sightingId,
        user_id: originalPhotoUserId,
        photo_url: originalPhotoUrl,
        caption: null,
        created_at: originalPhotoCreatedAt || new Date().toISOString(),
        user: originalPhotoUser || {
          id: originalPhotoUserId,
          display_name: `User ${originalPhotoUserId?.substring(0, 8) || 'Unknown'}`,
          avatar_url: null,
        },
      };
      
      // Insert at beginning if it's the first photo, otherwise at the end
      if (isOriginalFirst) {
        photoList.unshift(originalPhoto);
      } else {
        photoList.push(originalPhoto);
      }
    }
    
    return photoList;
  }, [photos, originalPhotoUrl, originalPhotoUserId, originalPhotoCreatedAt, sightingId, originalPhotoUser]);
  
  const hasPhotos = allPhotos.length > 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with add button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.photoCount}>
            {hasPhotos ? `${allPhotos.length} photo${allPhotos.length !== 1 ? 's' : ''}` : 'No photos yet'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {user?.id && (
            <TouchableOpacity style={styles.addButton} onPress={openAddPhotoModal}>
              <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
              <Text style={styles.addButtonText}>
                {isOriginalPoster ? 'Add Photo' : "I saw this cat too!"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Photo Gallery */}
      {hasPhotos ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalContainer}
          contentContainerStyle={styles.horizontalContent}
        >
          {allPhotos.map((photo, index) => (
            <TouchableOpacity
              key={photo.id}
              style={styles.horizontalItem}
              onPress={() => {
                setSelectedPhoto(photo);
                setSelectedPhotoIndex(index);
              }}
              activeOpacity={0.9}
            >
              <Image source={{ uri: photo.photo_url }} style={styles.horizontalPhoto} resizeMode="contain" />
              {(photo.caption || photo.user) && (
                <View style={styles.horizontalInfo}>
                  {photo.caption && <Text style={styles.horizontalCaption}>{photo.caption}</Text>}
                  {photo.user && (
                    <Text style={styles.horizontalUser}>
                      by {photo.user.display_name} • {formatTimeAgo(photo.created_at)}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="image-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyStateText}>No photos yet</Text>
          {user?.id && (
            <TouchableOpacity style={styles.emptyAddButton} onPress={openAddPhotoModal}>
              <MaterialCommunityIcons name="camera" size={20} color="#ffffff" />
              <Text style={styles.emptyAddButtonText}>
                {isOriginalPoster ? 'Add First Photo' : "I saw this cat too!"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Full-screen Photo Viewer Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.fullScreenContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.fullScreenClose}
            onPress={() => setSelectedPhoto(null)}
          >
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Delete Button (only for user's photos, not original) */}
          {selectedPhoto && 
           user?.id && 
           selectedPhoto.user_id && 
           String(user.id) === String(selectedPhoto.user_id) && 
           selectedPhoto.id !== 'original' && (
            <TouchableOpacity
              style={styles.fullScreenDelete}
              onPress={() => {
                Alert.alert(
                  'Delete Photo',
                  'Are you sure you want to delete this photo?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        setDeletingPhotoId(selectedPhoto.id);
                        try {
                          const { error } = await deleteSightingPhoto(selectedPhoto.id, user.id);
                          if (error) {
                            throw error;
                          }

                          // Remove photo from list
                          setPhotos((prev) => prev.filter((p) => p.id !== selectedPhoto.id));
                          
                          // Update allPhotos to reflect the deletion
                          const newPhotos = allPhotos.filter((p) => p.id !== selectedPhoto.id);
                          
                          // Close modal or navigate to next/previous photo
                          if (newPhotos.length === 0) {
                            setSelectedPhoto(null);
                          } else {
                            // Navigate to previous photo if available, otherwise next
                            const newIndex = selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : 0;
                            if (newPhotos[newIndex]) {
                              setSelectedPhotoIndex(newIndex);
                              setSelectedPhoto(newPhotos[newIndex]);
                              fullScreenScrollViewRef.current?.scrollTo({
                                x: newIndex * SCREEN_WIDTH,
                                animated: true,
                              });
                            } else {
                              setSelectedPhoto(null);
                            }
                          }
                        } catch (error) {
                          console.error('Error deleting photo:', error);
                          Alert.alert('Error', error.message || 'Failed to delete photo. Please try again.');
                        } finally {
                          setDeletingPhotoId(null);
                        }
                      },
                    },
                  ]
                );
              }}
              disabled={deletingPhotoId === selectedPhoto.id}
            >
              {deletingPhotoId === selectedPhoto.id ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <MaterialCommunityIcons name="delete" size={24} color={colors.error} />
              )}
            </TouchableOpacity>
          )}

          {/* Scrollable Photo Viewer */}
          <ScrollView
            ref={fullScreenScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.fullScreenScrollView}
            contentContainerStyle={styles.fullScreenScrollContent}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              if (index >= 0 && index < allPhotos.length) {
                const newPhoto = allPhotos[index];
                setSelectedPhotoIndex(index);
                setSelectedPhoto(newPhoto);
                // Debug: Log to check if user_id matches
                if (__DEV__) {
                  console.log('Photo selected:', {
                    photoId: newPhoto.id,
                    photoUserId: newPhoto.user_id,
                    currentUserId: user?.id,
                    isOwner: String(user?.id) === String(newPhoto.user_id),
                    isOriginal: newPhoto.id === 'original',
                  });
                }
              }
            }}
          >
            {allPhotos.map((photo, index) => (
              <View key={photo.id} style={styles.fullScreenPhotoContainer}>
                <Image
                  source={{ uri: photo.photo_url }}
                  style={styles.fullScreenPhoto}
                  resizeMode="contain"
                />
                {(photo.caption || photo.user) && (
                  <View style={styles.fullScreenPhotoInfo}>
                    {photo.caption && (
                      <Text style={styles.fullScreenCaption}>{photo.caption}</Text>
                    )}
                    {photo.user && (
                      <Text style={styles.fullScreenUser}>
                        by {photo.user.display_name} • {formatTimeAgo(photo.created_at)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Photo Counter */}
          {allPhotos.length > 1 && (
            <View style={styles.fullScreenCounter}>
              <Text style={styles.fullScreenCounterText}>
                {selectedPhotoIndex + 1} / {allPhotos.length}
              </Text>
            </View>
          )}

          {/* Navigation Buttons */}
          {allPhotos.length > 1 && (
            <>
              {selectedPhotoIndex > 0 && (
                <TouchableOpacity
                  style={[styles.fullScreenNavButton, styles.fullScreenNavButtonLeft]}
                  onPress={() => {
                    const newIndex = selectedPhotoIndex - 1;
                    setSelectedPhotoIndex(newIndex);
                    setSelectedPhoto(allPhotos[newIndex]);
                    fullScreenScrollViewRef.current?.scrollTo({
                      x: newIndex * SCREEN_WIDTH,
                      animated: true,
                    });
                  }}
                >
                  <MaterialCommunityIcons name="chevron-left" size={32} color="#ffffff" />
                </TouchableOpacity>
              )}
              {selectedPhotoIndex < allPhotos.length - 1 && (
                <TouchableOpacity
                  style={[styles.fullScreenNavButton, styles.fullScreenNavButtonRight]}
                  onPress={() => {
                    const newIndex = selectedPhotoIndex + 1;
                    setSelectedPhotoIndex(newIndex);
                    setSelectedPhoto(allPhotos[newIndex]);
                    fullScreenScrollViewRef.current?.scrollTo({
                      x: newIndex * SCREEN_WIDTH,
                      animated: true,
                    });
                  }}
                >
                  <MaterialCommunityIcons name="chevron-right" size={32} color="#ffffff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>

      {/* Add Photo Modal */}
      <Modal
        visible={showAddPhotoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddPhotoModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Photo</Text>
              <TouchableOpacity onPress={() => setShowAddPhotoModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {!pickedImageUri ? (
              <View style={styles.modalBody}>
                <TouchableOpacity
                  style={styles.pickImageButton}
                  onPress={showImagePickerOptions}
                  disabled={addingPhoto}
                >
                  <MaterialCommunityIcons name="camera" size={48} color={colors.primary} />
                  <Text style={styles.pickImageText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Image source={{ uri: pickedImageUri }} style={styles.previewImage} resizeMode="cover" />
                <TextInput
                  style={styles.captionInput}
                  value={photoCaption}
                  onChangeText={setPhotoCaption}
                  placeholder="Add a caption (optional)..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  maxLength={200}
                />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={() => {
                    setPickedImageUri(null);
                    showImagePickerOptions();
                  }}
                >
                  <MaterialCommunityIcons name="image-edit" size={20} color={colors.primary} />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddPhotoModal(false);
                  setPickedImageUri(null);
                  setPhotoCaption('');
                }}
                disabled={addingPhoto}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              {pickedImageUri && (
                <TouchableOpacity
                  style={[styles.submitButton, addingPhoto && styles.submitButtonDisabled]}
                  onPress={handleAddPhoto}
                  disabled={addingPhoto}
                >
                  {addingPhoto ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
                      <Text style={styles.submitButtonText}>Add Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  photoCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalContainer: {
    maxHeight: 300,
  },
  horizontalContent: {
    paddingHorizontal: theme.spacing.sm,
  },
  horizontalItem: {
    width: SCREEN_WIDTH - theme.spacing.md * 2,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.cream,
  },
  horizontalPhoto: {
    width: '100%',
    height: 250,
  },
  horizontalInfo: {
    padding: theme.spacing.sm,
    backgroundColor: colors.surface,
  },
  horizontalCaption: {
    fontSize: 14,
    color: colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  horizontalUser: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyState: {
    padding: theme.spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  emptyAddButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullScreenScrollView: {
    flex: 1,
  },
  fullScreenScrollContent: {
    alignItems: 'center',
  },
  fullScreenPhotoContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPhoto: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  fullScreenPhotoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  fullScreenClose: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: theme.spacing.sm,
  },
  fullScreenDelete: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg + 50, // Position next to close button
    zIndex: 20, // Higher than close button to ensure visibility
    backgroundColor: 'rgba(220, 38, 38, 0.8)', // Red background for delete button
    borderRadius: 20,
    padding: theme.spacing.sm,
    minWidth: 44, // Ensure touch target size
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCaption: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: theme.spacing.xs,
  },
  fullScreenUser: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  fullScreenCounter: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  fullScreenCounterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  fullScreenNavButton: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
  },
  fullScreenNavButtonLeft: {
    left: theme.spacing.md,
  },
  fullScreenNavButtonRight: {
    right: theme.spacing.md,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '90%',
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  modalBody: {
    padding: theme.spacing.md,
  },
  pickImageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxxl,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
  },
  pickImageText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  captionInput: {
    backgroundColor: colors.cream,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 14,
    color: colors.textDark,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.md,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
    padding: theme.spacing.sm,
  },
  changePhotoText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: colors.cream,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});

