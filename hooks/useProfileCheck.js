import { useState, useEffect } from 'react';
import { getProfile, isProfileComplete, getProfileCompletion } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to check if user profile is complete
 * @param {string} userId - The user's ID from Supabase Auth
 * @returns {object} - { profile, isComplete, loading, error, refetch }
 */
export const useProfileCheck = (userId) => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: profileError } = await getProfile(userId);

      if (profileError) {
        // If profile doesn't exist, that's okay - user needs to create one
        if (profileError.code === 'PGRST116') {
          setProfile(null);
          setIsComplete(false);
        } else {
          setError(profileError);
        }
      } else {
        setProfile(data);
        
        // Check email verification status from auth user
        const profileWithEmailStatus = {
          ...data,
          email_verified: authUser?.email_confirmed_at !== null,
        };
        
        const completionStatus = getProfileCompletion(profileWithEmailStatus);
        setIsComplete(completionStatus.isComplete);
      }
    } catch (err) {
      setError(err);
      setIsComplete(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authUser?.email_confirmed_at]);

  return {
    profile,
    isComplete,
    loading,
    error,
    refetch: checkProfile,
  };
};

