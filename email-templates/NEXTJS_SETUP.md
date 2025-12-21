# Setting Up Email Verification Success Page in Next.js

## Step 1: Choose Your Next.js Router

### Option A: App Router (Next.js 13+)

Create the file: `app/auth/verify-email/page.tsx`

Use the code from: `nextjs-app-router-page.tsx`

### Option B: Pages Router (Next.js 12 and below)

Create the file: `pages/auth/verify-email.tsx`

Use the code from: `nextjs-email-verified-page.tsx`

## Step 2: Create the Page

### For App Router:

1. Create directory structure:
   ```
   app/
     auth/
       verify-email/
         page.tsx
   ```

2. Copy the content from `nextjs-app-router-page.tsx` into `app/auth/verify-email/page.tsx`

### For Pages Router:

1. Create directory structure:
   ```
   pages/
     auth/
       verify-email.tsx
   ```

2. Copy the content from `nextjs-email-verified-page.tsx` into `pages/auth/verify-email.tsx`

## Step 3: Add Styling (if needed)

The components use inline styles (styled-jsx for Pages Router, inline CSS for App Router). If you prefer CSS modules:

1. Create `styles/EmailVerified.module.css` (use content from `nextjs-styles.module.css`)
2. Import and use the classes in your component

## Step 4: Configure Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel deployment URL:
   ```
   https://your-app-name.vercel.app
   ```
3. In the `signUp` function, you can optionally set:
   ```javascript
   emailRedirectTo: 'https://your-app-name.vercel.app/auth/verify-email'
   ```

## Step 5: Deploy to Vercel

1. **Push your code to GitHub** (or GitLab, Bitbucket)
2. **Go to Vercel**: [https://vercel.com](https://vercel.com)
3. **Import your repository**
4. **Deploy** - Vercel will automatically detect Next.js
5. **Copy your deployment URL** (e.g., `https://meowmap.vercel.app`)

## Step 6: Update Supabase Site URL

After deploying to Vercel:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://your-app-name.vercel.app`
3. Save

## Step 7: Optional - Update Code to Use Specific Route

In `contexts/AuthContext.js`, you can update the `signUp` function:

```javascript
const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'https://your-app-name.vercel.app/auth/verify-email',
    },
  });
  return { data, error };
};
```

Replace `your-app-name.vercel.app` with your actual Vercel domain.

## Testing

1. Sign up a new user in your mobile app
2. Click the email verification link
3. You should see the beautiful success page at:
   `https://your-app-name.vercel.app/auth/verify-email#access_token=...`

## Customization

You can customize:
- Colors (update the hex codes in the styles)
- Messaging
- Add your logo
- Add app download links
- Add animations or transitions

The page matches your MeowMap brand colors:
- Primary: `#d0854f`
- Background: `#f8f1e4`
- Accent: `#dec4a9`
- Text: `#6f6d6b`
- Success: `#34C759`

## Notes

- The page extracts tokens from the URL hash but doesn't use them (for security)
- Users verify email, then sign in to the app manually
- The page is mobile-responsive
- Works with both App Router and Pages Router

