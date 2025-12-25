// 1. Third-party libraries
import { supabase } from '../lib/supabase';
import { File } from 'expo-file-system';
import { Buffer } from 'buffer';

/**
 * Sighting Service
 * Handles cat sighting operations in Supabase
 */

/**
 * Upload sighting photo to Supabase Storage
 * @param {string} userId - User ID
 * @param {string} imageUri - Local image URI
 * @returns {Promise<{url: string, error: Object|null}>}
 */
export const uploadSightingPhoto = async (userId, imageUri) => {
  try {
    if (!userId || !imageUri) {
      return { url: null, error: { message: 'User ID and image URI are required' } };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Determine content type based on file extension
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    // Use the new File API from expo-file-system
    const file = new File(imageUri);
    const base64String = await file.base64();

    // Convert base64 to Uint8Array for Supabase Storage
    const bytes = new Uint8Array(Buffer.from(base64String, 'base64'));

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('cat-sighting-photos')
      .upload(filePath, bytes, {
        contentType: contentType,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cat-sighting-photos')
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading sighting photo:', error);
    return { url: null, error };
  }
};

/**
 * Create a new cat sighting
 * @param {string} userId - User ID
 * @param {Object} sightingData - Sighting data
 * @param {string} sightingData.catName - Cat name/nickname
 * @param {string} sightingData.description - Description
 * @param {string} sightingData.urgencyLevel - Urgency level
 * @param {string} sightingData.coatPattern - Coat pattern (optional)
 * @param {string} sightingData.primaryColor - Primary color (optional)
 * @param {number} sightingData.latitude - Latitude
 * @param {number} sightingData.longitude - Longitude
 * @param {string|null} sightingData.photoUri - Optional local photo URI to upload
 * @returns {Promise<{data: Object, error: Object|null}>}
 */
export const createSighting = async (userId, sightingData) => {
  try {
    if (!userId) {
      return { data: null, error: { message: 'User ID is required' } };
    }

    let photoUrl = null;

    // Upload photo if provided
    if (sightingData.photoUri) {
      const { url, error: uploadError } = await uploadSightingPhoto(userId, sightingData.photoUri);
      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        // Continue without photo if upload fails
      } else {
        photoUrl = url;
      }
    }

    // Prepare sighting data
    const insertData = {
      user_id: userId,
      cat_name: sightingData.catName.trim(),
      description: sightingData.description?.trim() || null,
      urgency_level: sightingData.urgencyLevel,
      coat_pattern: sightingData.coatPattern?.trim() || null,
      primary_color: sightingData.primaryColor?.trim() || null,
      latitude: sightingData.latitude,
      longitude: sightingData.longitude,
      photo_url: photoUrl,
    };

    // Insert into database
    const { data, error } = await supabase
      .from('cat_sightings')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating sighting:', error);
    return { data: null, error };
  }
};

/**
 * Get all cat sightings
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit number of results
 * @param {number} options.latitude - Optional: filter by latitude bounds
 * @param {number} options.longitude - Optional: filter by longitude bounds
 * @param {number} options.radius - Optional: radius in kilometers for location-based filtering
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const getSightings = async (options = {}) => {
  try {
    let query = supabase
      .from('cat_sightings')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    // TODO: Add location-based filtering if needed
    // For now, we'll get all sightings and filter on the client side if needed

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching sightings:', error);
    return { data: [], error };
  }
};

/**
 * Get sightings by user ID
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const getSightingsByUser = async (userId) => {
  try {
    if (!userId) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('cat_sightings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user sightings:', error);
    return { data: [], error };
  }
};

/**
 * Delete a sighting
 * @param {string} sightingId - Sighting ID
 * @returns {Promise<{error: Object|null}>}
 */
export const deleteSighting = async (sightingId) => {
  try {
    const { error } = await supabase
      .from('cat_sightings')
      .delete()
      .eq('id', sightingId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting sighting:', error);
    return { error };
  }
};

