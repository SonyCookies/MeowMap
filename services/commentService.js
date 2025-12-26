// 1. Third-party libraries
import { supabase } from '../lib/supabase';
import { createCommentNotifications } from './notificationService';

/**
 * Comment Service
 * Handles comment operations for cat sightings
 */

/**
 * Get all comments for a sighting
 * @param {string} sightingId - Sighting ID
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const getComments = async (sightingId) => {
  try {
    if (!sightingId) {
      return { data: [], error: { message: 'Sighting ID is required' } };
    }

    // First get comments
    const { data: comments, error } = await supabase
      .from('sighting_comments')
      .select('*')
      .eq('sighting_id', sightingId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Then get profiles for all unique user IDs
    const userIds = [...new Set((comments || []).map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    // Create a map of user_id to profile
    const profileMap = {};
    (profiles || []).forEach(profile => {
      profileMap[profile.id] = profile;
    });

    // Combine comments with profile data
    const flattenedData = (comments || []).map((comment) => {
      const profile = profileMap[comment.user_id] || {};
      
      return {
        id: comment.id,
        sighting_id: comment.sighting_id,
        user_id: comment.user_id,
        comment_text: comment.comment_text,
        image_url: comment.image_url || null,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: {
          id: comment.user_id,
          display_name: profile.display_name || `User ${comment.user_id.substring(0, 8)}`,
          avatar_url: profile.avatar_url || null,
        },
      };
    });

    return { data: flattenedData, error: null };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { data: [], error };
  }
};

/**
 * Create a new comment
 * @param {string} sightingId - Sighting ID
 * @param {string} userId - User ID
 * @param {string} commentText - Comment text (optional if image is provided)
 * @param {string} imageUrl - Optional image URL
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const createComment = async (sightingId, userId, commentText = '', imageUrl = null) => {
  try {
    if (!sightingId || !userId) {
      return { data: null, error: { message: 'Sighting ID and User ID are required' } };
    }

    if ((!commentText || !commentText.trim()) && !imageUrl) {
      return { data: null, error: { message: 'Comment text or image is required' } };
    }

    // Ensure comment_text is never null (database constraint)
    // If only image is provided, use empty string or a default message
    const finalCommentText = commentText.trim() || (imageUrl ? '📷' : '');

    const { data, error } = await supabase
      .from('sighting_comments')
      .insert({
        sighting_id: sightingId,
        user_id: userId,
        comment_text: finalCommentText,
        image_url: imageUrl || null,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Get profile for the user
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single();
    
    const commenterName = profile?.display_name || `User ${userId.substring(0, 8)}`;
    
    const flattenedData = {
      id: data.id,
      sighting_id: data.sighting_id,
      user_id: data.user_id,
      comment_text: data.comment_text,
      image_url: data.image_url || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user: {
        id: userId,
        display_name: commenterName,
        avatar_url: profile?.avatar_url || null,
      },
    };

    // Create notifications for the sighting creator and previous commenters (async, don't wait)
    // Get cat name from sighting for the notification
    supabase
      .from('cat_sightings')
      .select('cat_name')
      .eq('id', sightingId)
      .single()
      .then(({ data: sighting }) => {
        createCommentNotifications(
          sightingId,
          userId,
          commenterName,
          sighting?.cat_name || null
        ).catch((err) => {
          console.error('Error creating comment notifications:', err);
          // Don't fail the comment creation if notification fails
        });
      })
      .catch((err) => {
        console.error('Error fetching sighting for notification:', err);
      });

    return { data: flattenedData, error: null };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { data: null, error };
  }
};

/**
 * Update a comment (only by the owner and within time limit)
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID (to verify ownership)
 * @param {string} commentText - Updated comment text
 * @param {number} timeLimitMinutes - Time limit in minutes (default: 15)
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const updateComment = async (commentId, userId, commentText, timeLimitMinutes = 15) => {
  try {
    if (!commentId || !userId) {
      return { data: null, error: { message: 'Comment ID and User ID are required' } };
    }

    if (!commentText || !commentText.trim()) {
      return { data: null, error: { message: 'Comment text is required' } };
    }

    // First, verify the comment exists and belongs to the user
    const { data: existingComment, error: fetchError } = await supabase
      .from('sighting_comments')
      .select('*')
      .eq('id', commentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingComment) {
      return { data: null, error: { message: 'Comment not found or you do not have permission to edit it' } };
    }

    // Check if within time limit
    const createdAt = new Date(existingComment.created_at);
    const now = new Date();
    const minutesDiff = (now - createdAt) / (1000 * 60);

    if (minutesDiff > timeLimitMinutes) {
      return { data: null, error: { message: `Comments can only be edited within ${timeLimitMinutes} minutes of posting` } };
    }

    // Update the comment
    const { data, error } = await supabase
      .from('sighting_comments')
      .update({
        comment_text: commentText.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select('*')
      .single();

    if (error) throw error;

    // Get profile for the user
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', data.user_id)
      .single();
    
    const flattenedData = {
      id: data.id,
      sighting_id: data.sighting_id,
      user_id: data.user_id,
      comment_text: data.comment_text,
      image_url: data.image_url || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user: {
        id: data.user_id,
        display_name: profile?.display_name || `User ${data.user_id.substring(0, 8)}`,
        avatar_url: profile?.avatar_url || null,
      },
    };

    return { data: flattenedData, error: null };
  } catch (error) {
    console.error('Error updating comment:', error);
    return { data: null, error };
  }
};

/**
 * Delete a comment (only by the owner)
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID (to verify ownership)
 * @returns {Promise<{error: Object|null}>}
 */
export const deleteComment = async (commentId, userId) => {
  try {
    if (!commentId || !userId) {
      return { error: { message: 'Comment ID and User ID are required' } };
    }

    // First, verify the comment exists and belongs to the user
    const { data: existingComment, error: fetchError } = await supabase
      .from('sighting_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingComment) {
      return { error: { message: 'Comment not found or you do not have permission to delete it' } };
    }

    // Delete the comment
    const { error } = await supabase
      .from('sighting_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { error };
  }
};

/**
 * Get comment count for a sighting
 * @param {string} sightingId - Sighting ID
 * @returns {Promise<{count: number, error: Object|null}>}
 */
export const getCommentCount = async (sightingId) => {
  try {
    if (!sightingId) {
      return { count: 0, error: null };
    }

    const { count, error } = await supabase
      .from('sighting_comments')
      .select('*', { count: 'exact', head: true })
      .eq('sighting_id', sightingId);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting comment count:', error);
    return { count: 0, error };
  }
};

