# Cloudflare Pages Deployment Instructions

## Changes Deployed

✅ **Fixed Authentication Issues:**
- Logout now properly clears session and prevents restoration
- Session management race conditions fixed
- Better handling of auth state changes

✅ **Fixed Stripe Payment Issues:**
- Switched to hosted checkout (redirects to Stripe's page)
- No more cookie conflicts
- Pressing "back" from Stripe now works correctly
- Cleaner, simpler payment flow

✅ **OAuth Configuration:**
- Updated OAuth flows for better reliability
- Added instructions for Google and Discord setup

---

## Deploy to Cloudflare Pages

### Option 1: Automatic Deployment (Recommended)

Since your GitHub repo is already connected to Cloudflare Pages, the deployment should happen automatically:

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
2. Select your **blueballs-2** project
3. The latest commit should automatically trigger a build
4. Wait for the build to complete (usually 2-5 minutes)
5. Once deployed, test the authentication flow

### Option 2: Manual Deployment via Wrangler

If you need to deploy manually:

```bash
# Make sure wrangler is installed
npm install -g wrangler

# Login to Cloudflare
npx wrangler login

# Deploy
npx wrangler pages deploy .svelte-kit/output/client --project-name=blueballs-2
```

---

## Environment Variables

Make sure these environment variables are set in Cloudflare Pages:

1. Go to your project in Cloudflare Dashboard
2. Go to **Settings** > **Environment variables**
3. Add/verify these variables:

### Required Variables:

```
PUBLIC_SUPABASE_URL=https://onigvijfusxtycronhhm.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PRICE_ID_MID=your-mid-tier-price-id
STRIPE_PRICE_ID_BIG=your-big-tier-price-id
CLOUDFLARE_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=blueballs
```

### Optional (for test mode):

```
STRIPE_TEST_SECRET_KEY=your-test-secret-key
STRIPE_TEST_PRICE_ID_MID=your-test-mid-price
STRIPE_TEST_PRICE_ID_BIG=your-test-big-price
```

---

## Post-Deployment Testing

After deployment, test these critical flows:

### 1. Authentication Flow
- ✅ Login with email/password
- ✅ Login with Google OAuth
- ✅ Login with Discord OAuth
- ✅ Logout (verify you're actually logged out)
- ✅ Try to login again after logout

### 2. Payment Flow
- ✅ Click "Upgrade to Mid" or "Upgrade to Big"
- ✅ Verify redirect to Stripe's hosted checkout page
- ✅ Press browser back button - should return to subscribe page safely
- ✅ Complete a test payment (if in test mode)
- ✅ Verify redirect back to success page
- ✅ Check that subscription is active in your account

### 3. Session Persistence
- ✅ Refresh the page while logged in
- ✅ Open in new tab - should still be logged in
- ✅ Close and reopen browser - should still be logged in
- ✅ Logout and verify session is cleared

---

## OAuth Configuration Updates

**IMPORTANT:** Update your OAuth provider settings:

### Google Cloud Console
1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Make sure **Authorized redirect URIs** includes:
   - `https://onigvijfusxtycronhhm.supabase.co/auth/v1/callback`
   - `https://your-cloudflare-pages-domain.pages.dev/auth/callback` (if needed)

### Discord Developer Portal
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **OAuth2** section
4. Make sure **Redirects** includes:
   - `https://onigvijfusxtycronhhm.supabase.co/auth/v1/callback`

See `OAUTH_SETUP_INSTRUCTIONS.md` for detailed instructions.

---

## Troubleshooting

### If logout doesn't work:
1. Clear browser cache and cookies
2. Try in incognito/private mode
3. Check browser console for errors
4. Verify Supabase URL is correct in environment variables

### If Stripe redirects fail:
1. Check Stripe Dashboard > Developers > Webhooks
2. Verify webhook endpoint is configured
3. Check success_url and cancel_url in Stripe checkout settings
4. Make sure environment variables are set correctly

### If OAuth fails:
1. Verify callback URLs in Google/Discord console
2. Check Supabase Auth settings in dashboard
3. Ensure Client ID and Secret are correct
4. Test in incognito mode to rule out cookie issues

---

## Need Help?

- Check the browser console for errors (F12 > Console)
- Check Cloudflare Pages build logs
- Check Supabase logs in dashboard
- Review the code changes in the latest commit

---

## Summary of Fixes

**Before:**
- Logout was inconsistent
- Stripe checkout caused cookie conflicts
- Pressing back from Stripe broke authentication

**After:**
- Logout works reliably every time
- Stripe hosted checkout - no cookie issues
- Pressing back from Stripe works correctly
- Cleaner, simpler code with better error handling

🎉 **Your authentication and payment issues should now be fixed!**
