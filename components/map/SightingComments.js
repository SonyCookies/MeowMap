// 1. React and React Native
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// 2. Third-party libraries
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 3. Local utilities and hooks
import { getComments, createComment, updateComment, deleteComment } from '../../services/commentService';
import { useAuth } from '../../contexts/AuthContext';
import { useImagePicker } from '../../hooks/useImagePicker';
import { uploadCommentImage } from '../../services/sightingService';

// 4. Local components
// (None)

// 5. Constants and contexts
import { colors, theme } from '../../constants/theme';

export default function SightingComments({ sightingId, onCommentAdded }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' or 'oldest'
  const scrollViewRef = useRef(null);

  // Image picker hook
  const { imageUri: pickedImageUri, showImagePickerOptions, setImageUri: setPickedImageUri } = useImagePicker({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  // Update comment image when image is picked
  useEffect(() => {
    if (pickedImageUri) {
      setCommentImage(pickedImageUri);
    }
  }, [pickedImageUri]);

  // Load comments
  useEffect(() => {
    if (sightingId) {
      loadComments();
    }
  }, [sightingId]);

  const loadComments = async () => {
    if (!sightingId) return;

    setLoading(true);
    try {
      const { data, error } = await getComments(sightingId);
      if (error) {
        console.error('Error loading comments:', error);
        Alert.alert('Error', 'Failed to load comments. Please try again.');
      } else {
        setComments(data || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Sort comments based on sortOrder
  const sortedComments = React.useMemo(() => {
    if (!comments || comments.length === 0) return [];
    
    const sorted = [...comments];
    if (sortOrder === 'latest') {
      // Newest first (default)
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      // Oldest first
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
  }, [comments, sortOrder]);

  const handleSubmitComment = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to comment.');
      return;
    }

    if (!commentText.trim() && !commentImage) {
      Alert.alert('Error', 'Please enter a comment or add an image.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = null;

      // Upload image if provided
      if (commentImage) {
        const uploadResult = await uploadCommentImage(user.id, commentImage);
        if (uploadResult.error) {
          throw new Error('Failed to upload image. Please try again.');
        }
        imageUrl = uploadResult.url;
      }

      // Create comment with text and optional image
      const { data, error } = await createComment(sightingId, user.id, commentText.trim() || '', imageUrl);
      if (error) {
        throw error;
      }

      // Add new comment to list (will be sorted by sortOrder)
      setComments((prev) => [...prev, data]);
      setCommentText('');
      setCommentImage(null);
      setPickedImageUri(null);
      
      // If sorting by latest, scroll to top; if oldest, scroll to bottom
      setTimeout(() => {
        if (sortOrder === 'latest') {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);

      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded();
      }

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', error.message || 'Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.comment_text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await updateComment(commentId, user.id, editText);
      if (error) {
        throw error;
      }

      // Update comment in list
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? data : c))
      );
      setEditingCommentId(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating comment:', error);
      Alert.alert('Error', error.message || 'Failed to update comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const { error } = await deleteComment(commentId, user.id);
              if (error) {
                throw error;
              }

              // Remove comment from list
              setComments((prev) => prev.filter((c) => c.id !== commentId));
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', error.message || 'Failed to delete comment. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const canEditComment = (comment) => {
    if (!user?.id || comment.user_id !== user.id) return false;
    const createdAt = new Date(comment.created_at);
    const now = new Date();
    const minutesDiff = (now - createdAt) / (1000 * 60);
    return minutesDiff < 15; // 15 minute edit window
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : (
        <>
      {/* Sort Controls */}
      {comments.length > 0 && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortOrder === 'latest' && styles.sortButtonActive]}
            onPress={() => setSortOrder('latest')}
          >
            <MaterialCommunityIcons
              name="sort-clock-descending"
              size={16}
              color={sortOrder === 'latest' ? '#ffffff' : colors.text}
            />
            <Text style={[styles.sortButtonText, sortOrder === 'latest' && styles.sortButtonTextActive]}>
              Latest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOrder === 'oldest' && styles.sortButtonActive]}
            onPress={() => setSortOrder('oldest')}
          >
            <MaterialCommunityIcons
              name="sort-clock-ascending"
              size={16}
              color={sortOrder === 'oldest' ? '#ffffff' : colors.text}
            />
            <Text style={[styles.sortButtonText, sortOrder === 'oldest' && styles.sortButtonTextActive]}>
              Oldest
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Comment Input */}
      {user?.id && (
        <View style={styles.inputContainer}>
          {/* Image Preview */}
          {commentImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: commentImage }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setCommentImage(null);
                  setPickedImageUri(null);
                }}
              >
                <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={showImagePickerOptions}
              disabled={submitting}
            >
              <MaterialCommunityIcons name="image" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={commentText}
              onChangeText={setCommentText}
              placeholder={commentImage ? "Add a caption..." : "Add a comment..."}
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.submitButton, ((!commentText.trim() && !commentImage) || submitting) && styles.submitButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={(!commentText.trim() && !commentImage) || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!user?.id && (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Please log in to comment</Text>
        </View>
      )}

      {/* Comments List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.commentsList}
        contentContainerStyle={[
          styles.commentsListContent,
          sortedComments.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sortedComments.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="comment-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyStateText}>No comments yet</Text>
            <Text style={styles.emptyStateSubtext}>Be the first to comment!</Text>
          </View>
        ) : (
          sortedComments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              {/* User Avatar */}
              <View style={styles.avatarContainer}>
                {comment.user?.avatar_url ? (
                  <Image
                    source={{ uri: comment.user.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color={colors.textLight}
                    />
                  </View>
                )}
              </View>

              {/* Comment Content */}
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>
                    {comment.user?.display_name || 'Anonymous'}
                  </Text>
                  <Text style={styles.commentTime}>
                    {formatTimeAgo(comment.created_at)}
                    {comment.updated_at !== comment.created_at && ' (edited)'}
                  </Text>
                </View>

                {editingCommentId === comment.id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      placeholder="Edit your comment..."
                      placeholderTextColor={colors.textLight}
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleSaveEdit(comment.id)}
                        disabled={submitting}
                      >
                        <Text style={styles.editButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelEdit}
                        disabled={submitting}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    {comment.comment_text && (
                      <Text style={styles.commentText}>{comment.comment_text}</Text>
                    )}
                    {comment.image_url && (
                      <View style={styles.commentImageContainer}>
                        <Image
                          source={{ uri: comment.image_url }}
                          style={styles.commentImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                  </>
                )}

                {/* Comment Actions */}
                {!editingCommentId && user?.id === comment.user_id && (
                  <View style={styles.commentActions}>
                    {canEditComment(comment) && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleStartEdit(comment)}
                      >
                        <MaterialCommunityIcons
                          name="pencil"
                          size={14}
                          color={colors.text}
                        />
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(comment.id)}
                    >
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={14}
                        color={colors.error}
                      />
                      <Text style={[styles.actionButtonText, { color: colors.error }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    zIndex: 1,
    width: '100%',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: colors.text,
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: theme.spacing.sm,
  },
  sortLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginRight: theme.spacing.xs,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: theme.spacing.xs,
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
  commentsList: {
    flex: 1,
    flexShrink: 1,
  },
  commentsListContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
    width: '100%',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.text,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    flexShrink: 0,
    width: '100%',
    paddingHorizontal: theme.spacing.sm,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    marginRight: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginRight: theme.spacing.sm,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  commentText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.text,
    flexShrink: 0,
  },
  editContainer: {
    marginBottom: theme.spacing.xs,
  },
  editInput: {
    backgroundColor: colors.cream,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: 14,
    color: colors.textDark,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: colors.cream,
    borderRadius: theme.borderRadius.sm,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'column',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: theme.spacing.sm,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: 14,
    color: colors.textDark,
    minHeight: 44,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  loginPrompt: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cream,
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 14,
    color: colors.text,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: colors.cream,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  imageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentImageContainer: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.cream,
  },
});

