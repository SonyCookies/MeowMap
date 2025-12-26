// 1. React and React Native
import React, { useState, useEffect } from 'react';
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
import { getCommentCount } from '../../services/commentService';
import { verifySighting, getVerificationCounts, getUserVerification } from '../../services/verificationService';
import { updateSightingStatus, getStatusHistory, canUpdateStatus } from '../../services/statusService';
import { createStatusUpdateNotifications } from '../../services/notificationService';
import { shareSighting } from '../../services/shareService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// 4. Local components
import SightingComments from './SightingComments';
import SightingPhotoGallery from './SightingPhotoGallery';

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function SightingDetailModal({ 
  visible, 
  sighting, 
  onClose, 
  userLocation, 
  onGetDirections, 
  loadingDirections,
  onEdit,
  onDelete,
  canEdit = false,
  deleting = false,
  onShowInMap,
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'comments'
  const [commentCount, setCommentCount] = useState(0);
  const [loadingCommentCount, setLoadingCommentCount] = useState(false);
  const [verificationCounts, setVerificationCounts] = useState({ still_there: 0, cat_gone: 0 });
  const [userVerification, setUserVerification] = useState(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loadingStatusHistory, setLoadingStatusHistory] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentSighting, setCurrentSighting] = useState(sighting);

  useEffect(() => {
    if (visible && sighting?.id) {
      setCurrentSighting(sighting); // Update local state when sighting prop changes
      loadCommentCount();
      loadVerificationData();
      loadStatusHistory();
      checkUpdatePermission();
    }
  }, [visible, sighting?.id, user?.id, sighting]);

  const loadCommentCount = async () => {
    if (!sighting?.id) return;
    setLoadingCommentCount(true);
    try {
      const { count, error } = await getCommentCount(sighting.id);
      if (!error) {
        setCommentCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading comment count:', error);
    } finally {
      setLoadingCommentCount(false);
    }
  };

  const loadVerificationData = async () => {
    if (!sighting?.id) return;
    setLoadingVerification(true);
    try {
      const [countsResult, userVerificationResult] = await Promise.all([
        getVerificationCounts(sighting.id),
        user?.id ? getUserVerification(sighting.id, user.id) : Promise.resolve({ data: null }),
      ]);

      if (!countsResult.error) {
        setVerificationCounts(countsResult.data || { still_there: 0, cat_gone: 0 });
      }
      if (userVerificationResult && !userVerificationResult.error) {
        setUserVerification(userVerificationResult.data);
      }
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setLoadingVerification(false);
    }
  };

  const loadStatusHistory = async () => {
    if (!sighting?.id) return;
    setLoadingStatusHistory(true);
    try {
      const { data, error } = await getStatusHistory(sighting.id);
      if (!error) {
        setStatusHistory(data || []);
      }
    } catch (error) {
      console.error('Error loading status history:', error);
    } finally {
      setLoadingStatusHistory(false);
    }
  };

  const checkUpdatePermission = async () => {
    if (!sighting?.id || !user?.id) {
      setCanUpdate(false);
      return;
    }
    try {
      const { canUpdate: canUpdateResult } = await canUpdateStatus(sighting.id, user.id);
      setCanUpdate(canUpdateResult);
    } catch (error) {
      console.error('Error checking update permission:', error);
      setCanUpdate(false);
    }
  };

  const handleVerifySighting = async (type) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to verify sightings.');
      return;
    }

    setLoadingVerification(true);
    try {
      const { error } = await verifySighting(sighting.id, user.id, type);
      if (error) {
        throw error;
      }

      Alert.alert('Success', type === 'still_there' ? 'Thank you for confirming the cat is still there!' : 'Thank you for reporting that the cat is gone.');
      await loadVerificationData();
    } catch (error) {
      console.error('Error verifying sighting:', error);
      Alert.alert('Error', error.message || 'Failed to verify sighting. Please try again.');
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to update status.');
      return;
    }

    setUpdatingStatus(true);
    try {
      const oldStatus = currentSighting?.status || 'sighting';
      
      const { data: updatedSighting, error } = await updateSightingStatus(sighting.id, user.id, newStatus);
      if (error) {
        throw error;
      }

      // Update local sighting state with new status
      if (updatedSighting) {
        setCurrentSighting({
          ...currentSighting,
          status: updatedSighting.status,
        });
      }

      // Get user's display name for notification
      let updaterName = 'Someone';
      if (user?.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();
          updaterName = profile?.display_name || `User ${user.id.substring(0, 8)}`;
        } catch (profileError) {
          console.error('Error fetching user profile for notification:', profileError);
        }
      }

      // Create notifications for sighting creator and commenters (async, don't wait)
      createStatusUpdateNotifications(
        sighting.id,
        user.id,
        updaterName,
        sighting.cat_name,
        oldStatus,
        newStatus
      ).catch((err) => {
        console.error('Error creating status update notifications:', err);
        // Don't fail the status update if notification fails
      });

      Alert.alert('Success', 'Status updated successfully.');
      setShowStatusSelector(false);
      await loadStatusHistory();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', error.message || 'Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      sighting: 'Sighting',
      fed: 'Fed',
      taken_to_vet: 'Taken to Vet',
      adopted: 'Adopted',
      gone: 'Gone',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors_map = {
      sighting: colors.primary,
      fed: colors.success,
      taken_to_vet: colors.warning,
      adopted: colors.success,
      gone: colors.error,
    };
    return colors_map[status] || colors.text;
  };

  if (!sighting) return null;

  // Use currentSighting for display, fallback to sighting prop
  const displaySighting = currentSighting || sighting;

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

  const urgencyIcon = getUrgencyIcon(displaySighting.urgency_level);

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

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'details' && styles.tabActive]}
              onPress={() => setActiveTab('details')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={activeTab === 'details' ? colors.primary : colors.text}
              />
              <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
                Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'comments' && styles.tabActive]}
              onPress={() => setActiveTab('comments')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={18}
                color={activeTab === 'comments' ? colors.primary : colors.text}
              />
              <Text style={[styles.tabText, activeTab === 'comments' && styles.tabTextActive]}>
                Comments
              </Text>
              {commentCount > 0 && (
                <View style={styles.commentBadge}>
                  <Text style={styles.commentBadgeText}>{commentCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {activeTab === 'details' ? (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Photo Gallery */}
            <View style={styles.photoGalleryContainer}>
              <SightingPhotoGallery
                sightingId={sighting.id}
                isOriginalPoster={user?.id === sighting.user_id}
                originalPhotoUrl={sighting.photo_url}
                originalPhotoUserId={sighting.user_id}
                originalPhotoCreatedAt={sighting.created_at}
                onPhotoAdded={() => {
                  // Optionally refresh sighting data or update photo count
                }}
              />
            </View>

            {/* Cat Name */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="cat" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Cat Name</Text>
              </View>
              <Text style={styles.detailValue}>{displaySighting.cat_name}</Text>
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
                  {displaySighting.urgency_level}
                </Text>
              </View>
            </View>

            {/* Description */}
            {displaySighting.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{displaySighting.description}</Text>
              </View>
            )}

            {/* Coat Pattern */}
            {displaySighting.coat_pattern && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coat Pattern</Text>
                <Text style={styles.detailValue}>
                  {displaySighting.coat_pattern.split(' (')[0]}
                </Text>
              </View>
            )}

            {/* Primary Color */}
            {displaySighting.primary_color && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Primary Color</Text>
                <Text style={styles.detailValue}>{displaySighting.primary_color}</Text>
              </View>
            )}

            {/* Location */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Location</Text>
              </View>
              <Text style={styles.detailValue}>
                {displaySighting.latitude.toFixed(6)}, {displaySighting.longitude.toFixed(6)}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Reported</Text>
              </View>
              <Text style={styles.detailValue}>{formatDate(displaySighting.created_at)}</Text>
            </View>

            {/* Status */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="flag" size={20} color={colors.primary} />
                <Text style={styles.detailLabel}>Status</Text>
              </View>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { borderColor: getStatusColor(displaySighting.status || 'sighting') }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(displaySighting.status || 'sighting') }]}>
                    {getStatusLabel(displaySighting.status || 'sighting')}
                  </Text>
                </View>
                {canUpdate && (
                  <TouchableOpacity
                    style={styles.statusEditButton}
                    onPress={() => setShowStatusSelector(true)}
                  >
                    <MaterialCommunityIcons name="pencil" size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Verification Section */}
            <View style={styles.verificationSection}>
              <Text style={styles.sectionTitle}>Community Verification</Text>
              <View style={styles.verificationStats}>
                <View style={styles.verificationStat}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                  <Text style={styles.verificationStatText}>
                    {verificationCounts.still_there} confirmed still there
                  </Text>
                </View>
                <View style={styles.verificationStat}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
                  <Text style={styles.verificationStatText}>
                    {verificationCounts.cat_gone} reported gone
                  </Text>
                </View>
              </View>
              {user?.id && (
                <View style={styles.verificationButtons}>
                  <TouchableOpacity
                    style={[
                      styles.verificationButton,
                      userVerification?.verification_type === 'still_there' && styles.verificationButtonActive,
                      loadingVerification && styles.verificationButtonDisabled,
                    ]}
                    onPress={() => handleVerifySighting('still_there')}
                    disabled={loadingVerification}
                  >
                    {loadingVerification ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check" size={18} color="#ffffff" />
                        <Text style={styles.verificationButtonText}>Still There?</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.verificationButton,
                      styles.verificationButtonGone,
                      userVerification?.verification_type === 'cat_gone' && styles.verificationButtonActive,
                      loadingVerification && styles.verificationButtonDisabled,
                    ]}
                    onPress={() => handleVerifySighting('cat_gone')}
                    disabled={loadingVerification}
                  >
                    {loadingVerification ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="close" size={18} color="#ffffff" />
                        <Text style={styles.verificationButtonText}>Cat is Gone</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Status History */}
            {statusHistory.length > 0 && (
              <View style={styles.statusHistorySection}>
                <Text style={styles.sectionTitle}>Status History</Text>
                {statusHistory.map((history, index) => (
                  <View key={history.id} style={styles.statusHistoryItem}>
                    <View style={styles.statusHistoryIcon}>
                      <MaterialCommunityIcons
                        name="circle"
                        size={8}
                        color={getStatusColor(history.new_status)}
                      />
                    </View>
                    <View style={styles.statusHistoryContent}>
                      <Text style={styles.statusHistoryText}>
                        Changed to <Text style={{ fontWeight: '600' }}>{getStatusLabel(history.new_status)}</Text>
                        {history.old_status && ` from ${getStatusLabel(history.old_status)}`}
                      </Text>
                      <Text style={styles.statusHistoryTime}>
                        {formatDate(history.created_at)} by {history.user?.display_name || 'Unknown'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
          ) : (
            <View style={styles.commentsContainer}>
              <SightingComments
                sightingId={sighting.id}
                onCommentAdded={() => {
                  loadCommentCount();
                }}
              />
            </View>
          )}

          {/* Status Selector Modal */}
          <Modal
            visible={showStatusSelector}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowStatusSelector(false)}
          >
            <View style={styles.statusModalContainer}>
              <View style={styles.statusModalBackdrop} />
              <View style={styles.statusModalContent}>
                <View style={styles.statusModalHeader}>
                  <Text style={styles.statusModalTitle}>Update Status</Text>
                  <TouchableOpacity
                    onPress={() => setShowStatusSelector(false)}
                    style={styles.statusModalCloseButton}
                  >
                    <FontAwesome name="times" size={20} color={colors.textDark} />
                  </TouchableOpacity>
                </View>
                <View style={styles.statusOptions}>
                  {['sighting', 'fed', 'taken_to_vet', 'adopted', 'gone'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        displaySighting.status === status && styles.statusOptionActive,
                      ]}
                      onPress={() => handleUpdateStatus(status)}
                      disabled={updatingStatus}
                    >
                      <MaterialCommunityIcons
                        name="circle"
                        size={16}
                        color={displaySighting.status === status ? getStatusColor(status) : colors.textLight}
                      />
                      <Text
                        style={[
                          styles.statusOptionText,
                          displaySighting.status === status && { color: getStatusColor(status), fontWeight: '600' },
                        ]}
                      >
                        {getStatusLabel(status)}
                      </Text>
                      {displaySighting.status === status && (
                        <MaterialCommunityIcons name="check" size={18} color={getStatusColor(status)} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                {updatingStatus && (
                  <View style={styles.statusModalLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.statusModalLoadingText}>Updating status...</Text>
                  </View>
                )}
              </View>
            </View>
          </Modal>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            {/* Show in Map/Delete buttons (for My Sightings) */}
            {onEdit || onDelete ? (
              <>
                {onShowInMap && (
                  <TouchableOpacity
                    style={styles.showInMapButton}
                    onPress={() => {
                      if (onShowInMap && sighting) {
                        onShowInMap(sighting);
                        onClose();
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="map-marker" size={18} color="#ffffff" />
                    <Text style={styles.showInMapButtonText}>Show in Map</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.shareIconButton}
                  onPress={async () => {
                    try {
                      const { success, error } = await shareSighting(displaySighting, {
                        includePhoto: false,
                        includeDeepLink: true,
                      });
                      if (!success && error) {
                        Alert.alert('Error', error.message || 'Failed to share sighting. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error sharing sighting:', error);
                      Alert.alert('Error', 'Failed to share sighting. Please try again.');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="share-variant" size={20} color={colors.primary} />
                </TouchableOpacity>
                {onDelete && (
                  <TouchableOpacity
                    style={[styles.deleteIconButton, deleting && styles.deleteIconButtonDisabled]}
                    onPress={onDelete}
                    activeOpacity={0.7}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
                    )}
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {/* Get Directions button (for Map View) */}
                {onGetDirections && userLocation && (
                  <TouchableOpacity
                    style={[styles.directionButton, loadingDirections && styles.directionButtonDisabled]}
                    onPress={() => {
                      if (!loadingDirections) {
                        onGetDirections(sighting, userLocation);
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
                )}
                <TouchableOpacity
                  style={styles.shareIconButton}
                  onPress={async () => {
                    try {
                      const { success, error } = await shareSighting(displaySighting, {
                        includePhoto: false,
                        includeDeepLink: true,
                      });
                      if (!success && error) {
                        Alert.alert('Error', error.message || 'Failed to share sighting. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error sharing sighting:', error);
                      Alert.alert('Error', 'Failed to share sighting. Please try again.');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="share-variant" size={20} color={colors.primary} />
                </TouchableOpacity>
              </>
            )}
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  commentBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  commentBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  commentsContainer: {
    height: 500,
    flexDirection: 'column',
  },
  modalBody: {
    padding: theme.spacing.md,
    maxHeight: 500,
  },
  photoGalleryContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
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
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.primary,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  showInMapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.primary,
  },
  showInMapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.accent,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  shareIconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconButtonDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: theme.spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    backgroundColor: colors.cream,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusEditButton: {
    padding: theme.spacing.xs,
  },
  verificationSection: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: colors.cream,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verificationStats: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  verificationStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  verificationStatText: {
    fontSize: 14,
    color: colors.textDark,
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  verificationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.success,
  },
  verificationButtonGone: {
    backgroundColor: colors.error,
  },
  verificationButtonActive: {
    opacity: 0.8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  verificationButtonDisabled: {
    opacity: 0.5,
  },
  verificationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusHistorySection: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: colors.cream,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusHistoryItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  statusHistoryIcon: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  statusHistoryContent: {
    flex: 1,
  },
  statusHistoryText: {
    fontSize: 14,
    color: colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  statusHistoryTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  statusModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusModalContent: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.xl,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  statusModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  statusModalCloseButton: {
    padding: theme.spacing.xs,
  },
  statusOptions: {
    padding: theme.spacing.md,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  statusOptionActive: {
    backgroundColor: colors.cream,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
  },
  statusModalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusModalLoadingText: {
    fontSize: 14,
    color: colors.text,
  },
});

