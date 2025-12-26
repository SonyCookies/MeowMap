// 1. Third-party libraries
import { supabase } from '../lib/supabase';
import { uploadSightingPhoto } from './sightingService';

/**
 * Photo Service
 * Handles photo gallery operations for cat sightings
 */

/**
 * Get all photos for a sighting
 * @param {string} sightingId - Sighting ID
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const getSightingPhotos = async (sightingId) => {
  try {
    if (!sightingId) {
      return { data: [], error: { message: 'Sighting ID is required' } };
    }

    // First get photos
    const { data, error } = await supabase
      .from('sighting_photos')
      .select('*')
      .eq('sighting_id', sightingId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get user profiles separately
    const userIds = [...new Set((data || []).map(p => p.user_id))];
    let profileMap = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      (profiles || []).forEach(profile => {
        profileMap[profile.id] = profile;
      });
    }

    // Flatten the user data
    const flattenedData = (data || []).map((photo) => {
      const profile = profileMap[photo.user_id] || {};
      return {
        id: photo.id,
        sighting_id: photo.sighting_id,
        user_id: photo.user_id,
        photo_url: photo.photo_url,
        caption: photo.caption,
        created_at: photo.created_at,
        user: {
          id: photo.user_id,
          display_name: profile.display_name || `User ${photo.user_id.substring(0, 8)}`,
          avatar_url: profile.avatar_url || null,
        },
      };
    });

    return { data: flattenedData, error: null };
  } catch (error) {
    console.error('Error fetching sighting photos:', error);
    return { data: [], error };
  }
};

/**
 * Add a new photo to a sighting
 * @param {string} sightingId - Sighting ID
 * @param {string} userId - User ID
 * @param {string} photoUri - Local photo URI to upload
 * @param {string} caption - Optional caption
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const addSightingPhoto = async (sightingId, userId, photoUri, caption = '') => {
  try {
    if (!sightingId || !userId || !photoUri) {
      return { data: null, error: { message: 'Sighting ID, User ID, and photo URI are required' } };
    }

    // Upload photo to storage
    const { url, error: uploadError } = await uploadSightingPhoto(userId, photoUri);
    if (uploadError) {
      throw uploadError;
    }

    // Insert photo record into database
    const { data, error } = await supabase
      .from('sighting_photos')
      .insert({
        sighting_id: sightingId,
        user_id: userId,
        photo_url: url,
        caption: caption.trim() || null,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', userId)
      .single();

    const flattenedData = {
      id: data.id,
      sighting_id: data.sighting_id,
      user_id: data.user_id,
      photo_url: data.photo_url,
      caption: data.caption,
      created_at: data.created_at,
      user: {
        id: userId,
        display_name: profile?.display_name || `User ${userId.substring(0, 8)}`,
        avatar_url: profile?.avatar_url || null,
      },
    };

    return { data: flattenedData, error: null };
  } catch (error) {
    console.error('Error adding sighting photo:', error);
    return { data: null, error };
  }
};

/**
 * Delete a photo from a sighting (only by the user who uploaded it)
 * @param {string} photoId - Photo ID
 * @param {string} userId - User ID (must match photo owner)
 * @returns {Promise<{error: Object|null}>}
 */
export const deleteSightingPhoto = async (photoId, userId) => {
  try {
    if (!photoId || !userId) {
      return { error: { message: 'Photo ID and User ID are required' } };
    }

    // First verify the photo belongs to the user
    const { data: photo, error: fetchError } = await supabase
      .from('sighting_photos')
      .select('user_id, photo_url')
      .eq('id', photoId)
      .single();

    if (fetchError) throw fetchError;

    if (photo.user_id !== userId) {
      return { error: { message: 'You can only delete your own photos' } };
    }

    // Delete from database (storage file will be handled by cleanup if needed)
    const { error } = await supabase
      .from('sighting_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting sighting photo:', error);
    return { error };
  }
};

