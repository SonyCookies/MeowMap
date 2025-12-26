// 1. Third-party libraries
import { supabase } from '../lib/supabase';

/**
 * Status Service
 * Handles sighting status updates and history
 */

/**
 * Update sighting status
 * @param {string} sightingId - Sighting ID
 * @param {string} userId - User ID
 * @param {string} newStatus - New status: 'sighting', 'fed', 'taken_to_vet', 'adopted', 'gone'
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const updateSightingStatus = async (sightingId, userId, newStatus) => {
  try {
    if (!sightingId || !userId) {
      return { data: null, error: { message: 'Sighting ID and User ID are required' } };
    }

    const validStatuses = ['sighting', 'fed', 'taken_to_vet', 'adopted', 'gone'];
    if (!validStatuses.includes(newStatus)) {
      return { data: null, error: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` } };
    }

    // Get current status
    const { data: currentSighting, error: fetchError } = await supabase
      .from('cat_sightings')
      .select('status, user_id')
      .eq('id', sightingId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentSighting) {
      return { data: null, error: { message: 'Sighting not found' } };
    }

    const oldStatus = currentSighting.status;

    // Update the sighting status
    const { data, error } = await supabase
      .from('cat_sightings')
      .update({ status: newStatus })
      .eq('id', sightingId)
      .select()
      .single();

    if (error) throw error;

    // Record status change in history
    const { error: historyError } = await supabase
      .from('sighting_status_history')
      .insert({
        sighting_id: sightingId,
        user_id: userId,
        old_status: oldStatus,
        new_status: newStatus,
      });

    if (historyError) {
      console.error('Error recording status history:', historyError);
      // Don't fail the whole operation if history recording fails
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating sighting status:', error);
    return { data: null, error };
  }
};

/**
 * Get status history for a sighting
 * @param {string} sightingId - Sighting ID
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export const getStatusHistory = async (sightingId) => {
  try {
    if (!sightingId) {
      return { data: [], error: { message: 'Sighting ID is required' } };
    }

    // Get status history
    const { data: historyData, error } = await supabase
      .from('sighting_status_history')
      .select('*')
      .eq('sighting_id', sightingId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get unique user IDs
    const userIds = [...new Set((historyData || []).map(h => h.user_id))];
    
    // Get profiles for all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    // Create profile map
    const profileMap = {};
    (profiles || []).forEach(profile => {
      profileMap[profile.id] = profile;
    });

    // Combine history with profile data
    const flattenedData = (historyData || []).map((history) => {
      const profile = profileMap[history.user_id] || {};

      return {
        id: history.id,
        sighting_id: history.sighting_id,
        user_id: history.user_id,
        old_status: history.old_status,
        new_status: history.new_status,
        created_at: history.created_at,
        user: {
          id: history.user_id,
          display_name: profile.display_name || `User ${history.user_id?.substring(0, 8)}`,
          avatar_url: profile.avatar_url || null,
        },
      };
    });

    return { data: flattenedData, error: null };
  } catch (error) {
    console.error('Error getting status history:', error);
    return { data: [], error };
  }
};

/**
 * Check if user can update status (original poster or trusted user)
 * @param {string} sightingId - Sighting ID
 * @param {string} userId - User ID
 * @returns {Promise<{canUpdate: boolean, error: Object|null}>}
 */
export const canUpdateStatus = async (sightingId, userId) => {
  try {
    if (!sightingId || !userId) {
      return { canUpdate: false, error: null };
    }

    const { data, error } = await supabase
      .from('cat_sightings')
      .select('user_id')
      .eq('id', sightingId)
      .single();

    if (error) throw error;

    // Original poster can always update
    if (data?.user_id === userId) {
      return { canUpdate: true, error: null };
    }

    // TODO: Add trusted user check here if needed
    // For now, only original poster can update

    return { canUpdate: false, error: null };
  } catch (error) {
    console.error('Error checking status update permission:', error);
    return { canUpdate: false, error };
  }
};

