// 1. Third-party libraries
import { supabase } from '../lib/supabase';
import { File } from 'expo-file-system';
import { Buffer } from 'buffer';
import { createSightingCreationNotification } from './notificationService';

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
 * Upload comment image to Supabase Storage
 * Uses the same bucket but organizes in a 'comments' subfolder
 * @param {string} userId - User ID
 * @param {string} imageUri - Local image URI
 * @returns {Promise<{url: string, error: Object|null}>}
 */
export const uploadCommentImage = async (userId, imageUri) => {
  try {
    if (!userId || !imageUri) {
      return { url: null, error: { message: 'User ID and image URI are required' } };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    // Organize comment images in a 'comments' subfolder
    const filePath = `${userId}/comments/${fileName}`;

    // Determine content type based on file extension
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    // Use the new File API from expo-file-system
    const file = new File(imageUri);
    const base64String = await file.base64();

    // Convert base64 to Uint8Array for Supabase Storage
    const bytes = new Uint8Array(Buffer.from(base64String, 'base64'));

    // Upload to Supabase Storage (same bucket, different folder)
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
    console.error('Error uploading comment image:', error);
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

    // Create notification for the creator (async, don't wait for it)
    createSightingCreationNotification(userId, data).catch((err) => {
      console.error('Error creating sighting creation notification:', err);
      // Don't fail the sighting creation if notification fails
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error creating sighting:', error);
    return { data: null, error };
  }
};

/**
 * Get all sightings for a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {string} options.dateFilter - Optional: filter by date ('today', 'yesterday', '7days', '30days', '365days', 'all')
 * @param {string} options.urgencyFilter - Optional: filter by urgency level
 * @param {string} options.searchQuery - Optional: search in cat name and description
 * @param {string} options.sortBy - Optional: sort option ('newest', 'oldest', 'location')
 * @param {number} options.limit - Optional: limit number of results
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const getUserSightings = async (userId, options = {}) => {
  try {
    if (!userId) {
      return { data: [], error: { message: 'User ID is required' } };
    }

    let query = supabase
      .from('cat_sightings')
      .select('*')
      .eq('user_id', userId);

    // Apply date filter if provided
    if (options.dateFilter && options.dateFilter !== 'all') {
      const now = new Date();
      let startDate;
      let endDate;

      switch (options.dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '365days':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          break;
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lt('created_at', endDate.toISOString());
      }
    }

    // Apply urgency filter if provided
    if (options.urgencyFilter && options.urgencyFilter !== 'all') {
      query = query.eq('urgency_level', options.urgencyFilter);
    }

    // Apply search query if provided
    if (options.searchQuery && options.searchQuery.trim()) {
      const searchTerm = options.searchQuery.trim();
      query = query.or(`cat_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Apply sorting
    if (options.sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (options.sortBy === 'location') {
      // Sort by latitude then longitude (approximate location sorting)
      query = query.order('latitude', { ascending: true }).order('longitude', { ascending: true });
    } else {
      // Default: newest first
      query = query.order('created_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user sightings:', error);
    return { data: [], error };
  }
};

/**
 * Update an existing cat sighting
 * @param {string} sightingId - Sighting ID
 * @param {Object} sightingData - Updated sighting data
 * @param {string} sightingData.catName - Cat name
 * @param {string} sightingData.description - Description
 * @param {string} sightingData.urgencyLevel - Urgency level
 * @param {string} sightingData.coatPattern - Coat pattern
 * @param {string} sightingData.primaryColor - Primary color
 * @param {string} sightingData.photoUri - Optional: new photo URI to upload
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const updateSighting = async (sightingId, sightingData) => {
  try {
    if (!sightingId) {
      return { data: null, error: { message: 'Sighting ID is required' } };
    }

    // Handle photo upload if new photo provided
    let photoUrl = sightingData.photoUrl; // Keep existing photo if no new one
    if (sightingData.photoUri && sightingData.photoUri !== photoUrl) {
      // Get user_id from existing sighting first
      const { data: existingSighting } = await supabase
        .from('cat_sightings')
        .select('user_id')
        .eq('id', sightingId)
        .single();

      if (existingSighting?.user_id) {
        const uploadResult = await uploadSightingPhoto(existingSighting.user_id, sightingData.photoUri);
        if (uploadResult.error) {
          throw uploadResult.error;
        }
        photoUrl = uploadResult.url;
      }
    }

    // Prepare update data
    const updateData = {
      cat_name: sightingData.catName?.trim() || null,
      description: sightingData.description?.trim() || null,
      urgency_level: sightingData.urgencyLevel,
      coat_pattern: sightingData.coatPattern?.trim() || null,
      primary_color: sightingData.primaryColor?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Only update photo_url if a new photo was uploaded
    if (photoUrl) {
      updateData.photo_url = photoUrl;
    }

    // Update in database
    const { data, error } = await supabase
      .from('cat_sightings')
      .update(updateData)
      .eq('id', sightingId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating sighting:', error);
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
 * @param {string} options.dateFilter - Optional: filter by date ('today', 'yesterday', '7days', '30days', '365days', 'all')
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const getSightings = async (options = {}) => {
  try {
    let query = supabase
      .from('cat_sightings')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply date filter if provided
    if (options.dateFilter && options.dateFilter !== 'all') {
      const now = new Date();
      let startDate;
      let endDate;

      switch (options.dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '365days':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          break;
      }

      // Apply date filter
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lt('created_at', endDate.toISOString());
      }
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

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
/**
 * Get count of sightings for a user
 * @param {string} userId - User ID
 * @returns {Promise<{count: number, error: Object|null}>}
 */
export const getUserSightingsCount = async (userId) => {
  try {
    if (!userId) {
      return { count: 0, error: null };
    }

    const { count, error } = await supabase
      .from('cat_sightings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting user sightings count:', error);
    return { count: 0, error };
  }
};

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
 * @param {Object} sightingData - Full sighting data to store for undo (optional)
 * @returns {Promise<{error: Object|null, notificationId: string|null}>}
 */
export const deleteSighting = async (sightingId, sightingData = null) => {
  try {
    // If sightingData is provided, we'll store it in notification for undo
    // Otherwise, just delete normally
    const { error } = await supabase
      .from('cat_sightings')
      .delete()
      .eq('id', sightingId);

    if (error) throw error;

    return { error: null, notificationId: null };
  } catch (error) {
    console.error('Error deleting sighting:', error);
    return { error, notificationId: null };
  }
};

/**
 * Restore a deleted sighting
 * @param {Object} sightingData - Full sighting data to restore
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const restoreSighting = async (sightingData) => {
  try {
    if (!sightingData) {
      return { data: null, error: { message: 'Sighting data is required to restore' } };
    }

    // Extract the data we need to restore
    const {
      id,
      user_id,
      cat_name,
      description,
      latitude,
      longitude,
      urgency_level,
      coat_pattern,
      primary_color,
      photo_url,
      created_at,
    } = sightingData;

    if (!user_id || !cat_name || !description || latitude === undefined || longitude === undefined) {
      return { data: null, error: { message: 'Missing required fields to restore sighting' } };
    }

    // Insert the sighting back
    // Note: We don't restore the original ID to avoid conflicts
    // The sighting will get a new ID, but all other data is preserved
    const { data, error } = await supabase
      .from('cat_sightings')
      .insert({
        user_id,
        cat_name,
        description,
        latitude,
        longitude,
        urgency_level: urgency_level || 'Just chilling',
        coat_pattern: coat_pattern || '',
        primary_color: primary_color || '',
        photo_url: photo_url || null,
        // Use original created_at if available, otherwise use current time
        created_at: created_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error restoring sighting:', error);
    return { data: null, error };
  }
};

