# Supabase Setup Guide

This guide will walk you through setting up Supabase for your MeowMap app.

## Step 1: Create a Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign up"**
3. Sign up with GitHub, Google, or email
4. Once logged in, click **"New Project"**
5. Fill in:
   - **Name**: Your project name (e.g., "MeowMap")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Start with Free tier
6. Click **"Create new project"** and wait for it to provision (takes 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on **Settings** (gear icon in the left sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (a long JWT token starting with `eyJ...`)

## Step 3: Create Your .env File

1. In your project root directory (`D:\PERSONAL PROJECT\MeowMap`), create a new file named `.env`
2. Copy the contents from `.env.example`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
3. Replace the placeholder values with your actual credentials:

   **Example:**
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjoxOTQ1NTc2MDAwfQ.example_key_here
   ```

## Step 4: Important Notes

### ⚠️ Security Reminder
- **Never commit your `.env` file to Git!** 
- The `.env` file is already in `.gitignore` to prevent accidental commits
- The `anon` key is safe to use in client-side code (that's why it's called "anon/public")
- Never expose your `service_role` key (keep it secret, server-side only)

### 🔄 Restart Required
After creating or updating your `.env` file:
1. **Stop** your Expo development server (Ctrl+C)
2. **Restart** it with: `npx expo start --clear`
   - The `--clear` flag clears the cache to pick up new environment variables

### ✅ Verify It's Working
Once you've set up your `.env` file and restarted Expo:
1. Open your app
2. Try to sign up with an email/password
3. Check your Supabase dashboard → **Authentication** → **Users** to see if the user was created

## Step 5: Enable Authentication Providers (Optional)

### Email/Password (Already Enabled)
Email/Password authentication works out of the box! No additional setup needed.

### Google OAuth (Optional)
1. In Supabase dashboard → **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Enable the toggle
4. You'll need to create OAuth credentials in Google Cloud Console:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase

### GitHub OAuth (Optional)
1. In Supabase dashboard → **Authentication** → **Providers**
2. Find **GitHub** and click to expand
3. Enable the toggle
4. Create GitHub OAuth App:
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Create new OAuth App
   - Set callback URL: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Copy Client ID and generate Client Secret
   - Add them to Supabase

## Troubleshooting

### "Invalid API key" error
- Double-check that your `.env` file has the correct values
- Make sure there are no extra spaces or quotes around the values
- Restart Expo with `--clear` flag

### Environment variables not loading
- Make sure the file is named exactly `.env` (not `.env.txt` or `.env.local`)
- Make sure it's in the root directory (same level as `package.json`)
- Restart Expo development server
- Use `EXPO_PUBLIC_` prefix (required for Expo)

### Can't find API settings
- Make sure you're in the correct Supabase project
- Click the gear icon (⚙️) in the left sidebar → **API**

## Next Steps

Once your `.env` file is set up:
1. Test email/password sign up
2. Test email/password sign in
3. (Optional) Set up and test Google/GitHub OAuth
4. Check your Supabase dashboard to see users being created

Happy coding! 🐱🗺️

