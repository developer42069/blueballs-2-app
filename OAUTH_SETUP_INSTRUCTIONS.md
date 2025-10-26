# OAuth Setup Instructions

## Current Configuration

Your app currently uses this Supabase URL: `https://onigvijfusxtycronhhm.supabase.co`

## Google OAuth Setup

### Update Google Cloud Console

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID (the one you're currently using)
3. Click on it to edit
4. Under **Authorized redirect URIs**, make sure you have:
   - `https://onigvijfusxtycronhhm.supabase.co/auth/v1/callback`
5. Click **Save**

### What to tell users

The OAuth consent screen will show: `https://onigvijfusxtycronhhm.supabase.co`

This is the current limitation. To show a custom domain like "blueballs.lol", you would need to:
- Set up a custom domain (requires paid Supabase plan)
- Or use a vanity subdomain (free but still shows .supabase.co)

---

## Discord OAuth Setup

### Update Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **OAuth2** section
4. Under **Redirects**, make sure you have:
   - `https://onigvijfusxtycronhhm.supabase.co/auth/v1/callback`
5. Click **Save Changes**

---

## Testing Your OAuth Flow

After updating the settings above:

1. Go to your login page: http://localhost:5173/auth/login
2. Click "Continue with Google" or "Continue with Discord"
3. You should be redirected to the OAuth provider
4. After authorizing, you should be redirected back to your app
5. You should be automatically logged in

If you see any errors, check:
- The redirect URI is correctly set in both Google Cloud Console and Discord Developer Portal
- You've saved the changes in both platforms
- You're using the correct Client ID and Secret in your Supabase dashboard

---

## Optional: Setting Up Vanity Subdomain (Recommended for Better Branding)

To use a vanity subdomain like `blueballs-games.supabase.co` instead of the random characters:

1. Install Supabase CLI:
   - On Windows: Download from https://github.com/supabase/cli/releases
   - Or use Scoop: `scoop install supabase`

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Check if your desired subdomain is available:
   ```bash
   supabase vanity-subdomains --project-ref onigvijfusxtycronhhm check-availability --desired-subdomain blueballs-games --experimental
   ```

4. Activate the subdomain:
   ```bash
   supabase vanity-subdomains --project-ref onigvijfusxtycronhhm activate --desired-subdomain blueballs-games --experimental
   ```

5. Update your `.env` file:
   ```
   PUBLIC_SUPABASE_URL=https://blueballs-games.supabase.co
   ```

6. Update Google and Discord OAuth redirect URLs to:
   - `https://blueballs-games.supabase.co/auth/v1/callback`

Then users will see "blueballs-games.supabase.co" on the OAuth screen instead of random characters!
