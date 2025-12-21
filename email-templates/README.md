# MeowMap Email Templates

This folder contains custom HTML email templates that match your MeowMap app's design style and branding.

## Design Features

These templates use your MeowMap brand colors:
- **Primary Brown**: `#d0854f` - Used for buttons and headings
- **Accent Yellow**: `#f2cd89` - Used for accent borders and highlights
- **Beige**: `#dec4a9` - Used for borders and lighter text
- **Dark Gray**: `#6f6d6b` - Used for body text
- **Cream**: `#f8f1e4` - Used for background and info boxes

## How to Use in Supabase

### Step 1: Access Email Templates
1. Go to your Supabase Dashboard: [https://app.supabase.com](https://app.supabase.com)
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Copy Template
1. Open `meowmap-email-templates.html`
2. Find the template you need (they're separated by HTML comments)
3. Copy the entire template HTML (from `<!DOCTYPE html>` to `</html>`)

### Step 3: Paste into Supabase
1. In Supabase, select the template type (e.g., "Confirm Signup")
2. Paste the HTML into the **Body** field
3. Set the **Subject** line (suggested subjects are in the template comments)
4. Click **Save**

## Available Templates

### 1. Confirm Signup (Email Verification)
**Subject**: `Welcome to MeowMap! 🐱 Please verify your email`

Use this template for the "Confirm Signup" email template.

### 2. Magic Link (Passwordless Login)
**Subject**: `Sign in to MeowMap`

Use this template for the "Magic Link" email template.

### 3. Reset Password
**Subject**: `Reset Your MeowMap Password`

Use this template for the "Reset Password" email template.

### 4. Change Email Address
**Subject**: `Confirm Email Change`

Use this template for the "Change Email Address" email template.

### 5. Invite User
**Subject**: `You've been invited to MeowMap`

Use this template for the "Invite User" email template.

## Template Variables

These templates use Supabase's built-in variables that are automatically replaced:

- `{{ .ConfirmationURL }}` - The verification/confirmation link
- `{{ .Token }}` - The confirmation token (if needed)
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address
- `{{ .RedirectTo }}` - Redirect URL after confirmation

**Important**: Do not remove these variables - they are required for the emails to work correctly!

## Customization Tips

1. **Colors**: All colors are defined inline in the templates. Search and replace if you need to update them.
2. **Text**: Feel free to customize the text content to match your tone and messaging.
3. **Logo**: Currently using emoji (🐱). If you want to add your logo image, upload it to a CDN and replace the emoji with an `<img>` tag.
4. **Fonts**: Templates use system fonts for best compatibility. You can change these if needed.

## Testing

After implementing the templates:

1. **Test each template** by triggering the action (sign up, reset password, etc.)
2. **Check different email clients**: Gmail, Outlook, Apple Mail, etc.
3. **Test on mobile**: Most users read emails on mobile devices
4. **Verify links work**: Make sure all buttons and links function correctly

## Notes

- Templates are designed to work with most email clients
- Uses inline CSS for better compatibility
- Responsive design works on desktop and mobile
- All links use the primary brown color (`#d0854f`) for consistency

## Support

For more information, see:
- [CUSTOMIZE_SUPABASE_EMAILS.md](../CUSTOMIZE_SUPABASE_EMAILS.md) - Detailed setup guide
- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)

