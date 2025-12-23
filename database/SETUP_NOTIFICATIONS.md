# Setup Notifications Table in Supabase

This guide will help you set up the `notifications` table in your Supabase database.

## Steps

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run the Schema SQL**
   - Copy the contents of `notifications-schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the query

3. **Verify the Table**
   - Go to "Table Editor" in the left sidebar
   - You should see a new `notifications` table
   - Verify the columns:
     - `id` (UUID, primary key)
     - `user_id` (UUID, foreign key to auth.users)
     - `title` (text)
     - `message` (text, nullable)
     - `type` (text, default: 'system')
     - `read` (boolean, default: false)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

4. **Verify RLS Policies**
   - Go to "Authentication" > "Policies" in the left sidebar
   - Select the `notifications` table
   - You should see 4 policies:
     - Users can view their own notifications
     - Users can insert their own notifications
     - Users can update their own notifications
     - Users can delete their own notifications

## Testing

After setting up the table, test it by:

1. Creating a notification through the app (update your profile)
2. Checking the `notifications` table in Supabase Table Editor
3. Verifying the notification appears for the correct user

## Notes

- Notifications are user-specific (filtered by `user_id`)
- Each user can only see and manage their own notifications
- The `type` field can be: 'cat', 'community', 'achievement', 'message', 'profile', or 'system'
- Notifications are sorted by `created_at` in descending order (newest first)

