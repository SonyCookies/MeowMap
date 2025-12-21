# Authentication Setup Guide

This app uses Supabase Auth for user authentication with Email/Password and Social Auth (Google/GitHub).

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to be fully provisioned

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy your **Project URL** and **anon/public key**
3. Create a `.env` file in the root of your project:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Or update the values directly in `lib/supabase.js`

### 3. Configure Email Authentication

Email/Password authentication works out of the box with Supabase. No additional configuration needed!

### 4. Configure Google OAuth

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Google** provider
3. You'll need to create OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable Google+ API
   - Go to **Credentials** > **Create Credentials** > **OAuth client ID**
   - Select **Web application**
   - Add authorized redirect URIs:
     - `https://[your-project-ref].supabase.co/auth/v1/callback`
     - You can find your project ref in your Supabase project URL
   - Copy the **Client ID** and **Client Secret**
   - Paste them into Supabase Google provider settings

### 5. Configure GitHub OAuth

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **GitHub** provider
3. You'll need to create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click **New OAuth App**
   - Fill in:
     - **Application name**: Your app name
     - **Homepage URL**: Your app URL (can be a placeholder for mobile apps)
     - **Authorization callback URL**: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Click **Register application**
   - Copy the **Client ID**
   - Generate and copy a **Client Secret**
   - Paste them into Supabase GitHub provider settings

### 6. Configure Redirect URLs (Important for Mobile)

1. In Supabase dashboard, go to **Authentication** > **URL Configuration**
2. Add your redirect URLs:
   - For Expo: `exp://127.0.0.1:8081` (development)
   - For production, you'll need your app's deep link scheme

### 7. Run the App

```bash
npm start
```

## Features

- ✅ Email/Password sign up and sign in
- ✅ Social authentication with Google
- ✅ Social authentication with GitHub
- ✅ Persistent sessions
- ✅ Auto token refresh
- ✅ Sign out functionality

## File Structure

```
├── lib/
│   └── supabase.js          # Supabase client configuration
├── contexts/
│   └── AuthContext.js       # Authentication context and provider
├── screens/
│   ├── AuthScreen.js        # Sign in/Sign up UI
│   └── HomeScreen.js        # Protected home screen
└── App.js                   # Main app component with auth routing
```

## Usage

The authentication state is available throughout your app via the `useAuth` hook:

```javascript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, signOut, signIn, signUp, signInWithOAuth } = useAuth();
  
  // user is null when not authenticated
  // user is an object with user data when authenticated
}
```

## Troubleshooting

- **OAuth not working**: Make sure redirect URLs are correctly configured in Supabase
- **"Invalid API key"**: Check that your `.env` file has the correct Supabase credentials
- **Email verification**: Supabase sends verification emails by default. You can disable this in Supabase settings if needed for development

