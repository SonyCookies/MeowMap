# Profile Setup Feature

This feature ensures that users complete their profile before accessing the main app.

## Overview

After successful login, the app checks if the user has completed their profile. If not, they are redirected to a Profile Setup screen where they must provide:

1. **Display Name** ("Cat Guardian Name") - Required, 2-50 characters
2. **Avatar** - Required, uploaded image

Once the profile is complete, users can access the main app (HomeScreen).

## Implementation Details

### Files Created/Modified

1. **services/profileService.js**
   - `getProfile(userId)` - Fetches user profile from database
   - `isProfileComplete(profile)` - Checks if profile has required fields
   - `upsertProfile(userId, profileData)` - Creates or updates profile
   - `uploadAvatar(userId, imageUri)` - Uploads avatar to Supabase Storage
   - `deleteAvatar(filePath)` - Deletes avatar from storage

2. **hooks/useProfileCheck.js**
   - Custom hook that checks profile completeness
   - Returns: `{ profile, isComplete, loading, error, refetch }`

3. **screens/ProfileSetupScreen.js**
   - Profile setup UI with:
     - Avatar upload (camera or photo library)
     - Display name input with validation
     - Form submission handling

4. **App.js**
   - Updated navigation logic to check profile after login
   - Shows ProfileSetupScreen if profile incomplete
   - Shows HomeScreen if profile complete

5. **database/profiles-schema.sql**
   - SQL schema for profiles table
   - RLS policies for security
   - Storage bucket setup instructions

6. **database/SETUP_PROFILES.md**
   - Step-by-step setup instructions for Supabase

## Profile Schema

```sql
profiles (
  id UUID (references auth.users),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  total_meows INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Required Profile Fields

For a profile to be considered "complete":

- ✅ `display_name` must exist and be non-empty (2-50 characters)
- ✅ `avatar_url` must exist and be a valid URL

## Flow Diagram

```
User Logs In
    ↓
Auth Successful
    ↓
Check Profile (useProfileCheck)
    ↓
Profile Complete?
    ├─ YES → HomeScreen
    └─ NO  → ProfileSetupScreen
                ↓
            User Completes Profile
                ↓
            Profile Saved to Database
                ↓
            Redirect to HomeScreen
```

## Setup Instructions

1. **Run SQL Schema** in Supabase Dashboard:
   - Copy `database/profiles-schema.sql`
   - Execute in SQL Editor

2. **Create Storage Bucket**:
   - Name: `avatars`
   - Public: ✅ Yes

3. **Set Storage Policies** (see `database/SETUP_PROFILES.md`)

4. **Install Dependencies**:
   ```bash
   npm install expo-image-picker
   ```

## Usage

The feature works automatically after setup. When a user logs in:

1. App checks profile completeness
2. If incomplete, shows ProfileSetupScreen
3. User fills in required information
4. On submit, profile is saved
5. User is automatically redirected to HomeScreen

## Future Enhancements

- Allow users to edit their profile later
- Add more profile fields (bio, location preferences)
- Profile image cropping/editing
- Avatar deletion functionality

