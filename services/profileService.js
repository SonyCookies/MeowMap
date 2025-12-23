import { supabase } from '../lib/supabase';
import { File } from 'expo-file-system';
import { Buffer } from 'buffer';

/**
 * Profile Service
 * Handles user profile operations in Supabase
 */

/**
 * Get user profile by user ID
 */
export const getProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is expected for new users
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { data: null, error };
  }
};

/**
 * Get profile completion status and count
 * Required fields for completion: display_name, avatar_url, email_verified
 * Optional but recommended: bio, location, phone_number
 */
export const getProfileCompletion = (profile) => {
  if (!profile) {
    return {
      isComplete: false,
      completedCount: 0,
      totalCount: 6,
      completedTasks: [],
      pendingTasks: [
        'Add your display name',
        'Upload your avatar',
        'Confirm your email',
        'Add your bio',
        'Add your location',
        'Add your phone number',
      ],
    };
  }

  const tasks = [
    {
      id: 'display_name',
      title: 'Add your display name',
      completed: !!(profile.display_name && profile.display_name.trim().length > 0),
    },
    {
      id: 'avatar_url',
      title: 'Upload your avatar',
      completed: !!(profile.avatar_url && profile.avatar_url.trim().length > 0),
    },
    {
      id: 'email_verified',
      title: 'Confirm your email',
      completed: profile.email_verified === true,
    },
    {
      id: 'bio',
      title: 'Add your bio',
      completed: !!(profile.bio && profile.bio.trim().length >= 10),
    },
    {
      id: 'location',
      title: 'Add your location',
      completed: !!(profile.location && profile.location.trim().length > 0),
    },
    {
      id: 'phone_number',
      title: 'Add your phone number',
      completed: !!(profile.phone_number && profile.phone_number.trim().length > 0 && profile.phone_number.startsWith('+63')),
    },
  ];

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;

  // Profile is considered complete if all fields are filled (all are now required)
  // Required: display_name, avatar_url, email_verified, bio, location, phone_number
  const requiredTasks = ['display_name', 'avatar_url', 'email_verified', 'bio', 'location', 'phone_number'];
  const isComplete = requiredTasks.every(taskId => 
    tasks.find(t => t.id === taskId)?.completed
  );

  return {
    isComplete,
    completedCount,
    totalCount,
    completedTasks,
    pendingTasks,
    tasks,
  };
};

/**
 * Check if user profile is complete (backward compatibility)
 * Required fields: display_name, avatar_url, email_verified
 */
export const isProfileComplete = (profile) => {
  const completion = getProfileCompletion(profile);
  return completion.isComplete;
};

/**
 * Create or update user profile
 */
export const upsertProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error upserting profile:', error);
    return { data: null, error };
  }
};

/**
 * Upload avatar image to Supabase Storage
 * Uses the new File API from expo-file-system
 */
export const uploadAvatar = async (userId, imageUri) => {
  try {
    // Create filename with user ID
    const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Determine content type based on file extension
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    // Use the new File API from expo-file-system
    // Read the file as base64 using the new API method
    const file = new File(imageUri);
    const base64String = await file.base64();

    // Convert base64 to Uint8Array for Supabase Storage
    // Use Buffer for React Native compatibility
    const bytes = new Uint8Array(Buffer.from(base64String, 'base64'));

    // Upload to Supabase Storage
    // Use Uint8Array directly - Supabase Storage accepts this in React Native
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, bytes, {
        contentType: contentType,
        upsert: true, // Allow overwriting if same user uploads again
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { 
      data: { path: filePath, url: urlData.publicUrl }, 
      error: null 
    };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    // Return more detailed error information
    return { 
      data: null, 
      error: {
        message: error.message || 'Failed to upload avatar',
        originalError: error
      }
    };
  }
};

/**
 * Delete avatar from Supabase Storage
 */
export const deleteAvatar = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return { error };
  }
};

