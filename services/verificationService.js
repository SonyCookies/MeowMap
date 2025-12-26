// 1. Third-party libraries
import { supabase } from '../lib/supabase';

/**
 * Verification Service
 * Handles sighting verification operations (Still There? / Cat is Gone)
 */

/**
 * Verify a sighting (add a verification vote)
 * @param {string} sightingId - Sighting ID
 * @param {string} userId - User ID
 * @param {string} type - Verification type: 'still_there' or 'cat_gone'
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const verifySighting = async (sightingId, userId, type) => {
  try {
    if (!sightingId || !userId) {
      return { data: null, error: { message: 'Sighting ID and User ID are required' } };
    }

    if (!['still_there', 'cat_gone'].includes(type)) {
      return { data: null, error: { message: 'Invalid verification type. Must be "still_there" or "cat_gone"' } };
    }

    // Check if user already verified this sighting
    const { data: existing } = await supabase
      .from('sighting_verifications')
      .select('id, verification_type')
      .eq('sighting_id', sightingId)
      .eq('user_id', userId)
      .single();

    let verificationData;

    if (existing) {
      // Update existing verification
      const { data, error } = await supabase
        .from('sighting_verifications')
        .update({ verification_type: type })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      verificationData = data;
    } else {
      // Create new verification
      const { data, error } = await supabase
        .from('sighting_verifications')
        .insert({
          sighting_id: sightingId,
          user_id: userId,
          verification_type: type,
        })
        .select()
        .single();

      if (error) throw error;
      verificationData = data;
    }

    // Update sighting verification count and last_verified_at if "still_there"
    if (type === 'still_there') {
      const { data: counts } = await getVerificationCounts(sightingId);
      const stillThereCount = counts?.still_there || 0;

      await supabase
        .from('cat_sightings')
        .update({
          verification_count: stillThereCount,
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', sightingId);
    }

    // Check if auto-removal is needed
    await checkAutoRemove(sightingId);

    return { data: verificationData, error: null };
  } catch (error) {
    console.error('Error verifying sighting:', error);
    return { data: null, error };
  }
};

/**
 * Get verification counts for a sighting
 * @param {string} sightingId - Sighting ID
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const getVerificationCounts = async (sightingId) => {
  try {
    if (!sightingId) {
      return { data: null, error: { message: 'Sighting ID is required' } };
    }

    const { data, error } = await supabase
      .from('sighting_verifications')
      .select('verification_type')
      .eq('sighting_id', sightingId);

    if (error) throw error;

    const counts = {
      still_there: 0,
      cat_gone: 0,
    };

    (data || []).forEach((verification) => {
      if (verification.verification_type === 'still_there') {
        counts.still_there++;
      } else if (verification.verification_type === 'cat_gone') {
        counts.cat_gone++;
      }
    });

    return { data: counts, error: null };
  } catch (error) {
    console.error('Error getting verification counts:', error);
    return { data: null, error };
  }
};

/**
 * Get user's verification for a sighting (if any)
 * @param {string} sightingId - Sighting ID
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export const getUserVerification = async (sightingId, userId) => {
  try {
    if (!sightingId || !userId) {
      return { data: null, error: null };
    }

    const { data, error } = await supabase
      .from('sighting_verifications')
      .select('verification_type')
      .eq('sighting_id', sightingId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      throw error;
    }

    return { data: data || null, error: null };
  } catch (error) {
    console.error('Error getting user verification:', error);
    return { data: null, error };
  }
};

/**
 * Check if sighting should be auto-removed (3+ "cat_gone" votes)
 * @param {string} sightingId - Sighting ID
 * @returns {Promise<{removed: boolean, error: Object|null}>}
 */
export const checkAutoRemove = async (sightingId) => {
  try {
    if (!sightingId) {
      return { removed: false, error: { message: 'Sighting ID is required' } };
    }

    const { data: counts, error } = await getVerificationCounts(sightingId);
    if (error) throw error;

    if (counts && counts.cat_gone >= 3) {
      // Update sighting status to "gone" and mark as inactive
      const { error: updateError } = await supabase
        .from('cat_sightings')
        .update({
          status: 'gone',
        })
        .eq('id', sightingId);

      if (updateError) throw updateError;

      return { removed: true, error: null };
    }

    return { removed: false, error: null };
  } catch (error) {
    console.error('Error checking auto-remove:', error);
    return { removed: false, error };
  }
};

