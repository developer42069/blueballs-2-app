# Cloudflare R2 Production Deployment Guide

This guide helps you deploy the Blueballs app with Cloudflare R2 profile image uploads to production.

---

## Prerequisites

Before deploying to production, ensure you have:

1. ✅ Cloudflare R2 bucket created (`blueballs`)
2. ✅ CORS policy configured on R2 bucket (see `setup-r2-cors.md`)
3. ✅ R2 API tokens generated from Cloudflare dashboard
4. ✅ Custom domain configured for R2 CDN (optional but recommended)

---

## Required Environment Variables

Your production hosting platform (Vercel, Netlify, etc.) **MUST** have these R2 environment variables configured:

### R2 Configuration Variables

| Variable Name | Description | Example Value | Secret? |
|--------------|-------------|---------------|---------|
| `R2_ACCOUNT_ID` | Your Cloudflare account ID | `d8d7390ea59a7242035268cefde64cc4` | No |
| `R2_ACCESS_KEY_ID` | R2 API access key ID | `aabdc4a49f01340b53bcbe6f6d3cdda0` | **YES** |
| `R2_SECRET_ACCESS_KEY` | R2 API secret access key | `a1b997930808c855017991b093a413ae8cfcafc0785ccba71d3db01e97ed7afd` | **YES** |
| `R2_BUCKET_NAME` | Name of your R2 bucket | `blueballs` | No |
| `R2_PUBLIC_URL` | CDN URL for public access | `https://cdn.blueballs.lol` | No |
| `R2_ENDPOINT_URL` | R2 S3-compatible endpoint | `https://<account-id>.r2.cloudflarestorage.com` | No |

### How to Find These Values

#### 1. R2_ACCOUNT_ID
- Go to: https://dash.cloudflare.com/
- Your account ID is in the URL or dashboard sidebar

#### 2. R2_ACCESS_KEY_ID & R2_SECRET_ACCESS_KEY
- Go to: **R2** → **Manage R2 API Tokens**
- Click "Create API Token"
- **Permissions**: Object Read & Write
- **Bucket**: `blueballs` (or "Apply to all buckets")
- Copy both the Access Key ID and Secret Access Key
- ⚠️ **Important**: Save the secret immediately - you won't be able to see it again!

#### 3. R2_BUCKET_NAME
- This is simply the name of your bucket: `blueballs`

#### 4. R2_PUBLIC_URL
- If using custom domain: `https://cdn.blueballs.lol`
- If using R2.dev subdomain: `https://pub-xxxxx.r2.dev`
- Go to your bucket → **Settings** → **Public Access** to find this

#### 5. R2_ENDPOINT_URL
- Format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- Replace `<ACCOUNT_ID>` with your actual account ID
- Example: `https://d8d7390ea59a7242035268cefde64cc4.r2.cloudflarestorage.com`

---

## Platform-Specific Setup

### Vercel

1. Go to your project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each R2 variable:
   - **Key**: Variable name (e.g., `R2_ACCESS_KEY_ID`)
   - **Value**: Variable value
   - **Environments**: Select "Production" (and "Preview" if needed)
   - **Secret**: Enable for `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`
4. Redeploy your project to apply changes

### Netlify

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Click "Edit variables"
3. Add each R2 variable as a new entry
4. **Important**: Mark `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` as "Sensitive"
5. Trigger a new deploy

### Other Platforms

Refer to your hosting platform's documentation for setting environment variables:
- **Railway**: Settings → Variables
- **Render**: Environment → Environment Variables
- **Fly.io**: `fly secrets set VARIABLE_NAME=value`

---

## Verification Steps

After deploying with environment variables configured:

### Step 1: Check Build Logs

Watch your deployment build logs for these messages:

✅ **Success**: No errors about missing R2 variables
❌ **Failure**: `Missing required R2 environment variables: ...`

If you see the failure message, the listed variables are not configured in your environment.

### Step 2: Test Upload on Production

1. Visit `https://blueballs.lol/settings`
2. Try uploading a profile image
3. Check browser console for errors

### Step 3: Check Error Messages

If upload fails, the error message now provides detailed information:

| Error Message | Problem | Solution |
|--------------|---------|----------|
| `Missing required R2 environment variables` | Variables not set in production | Add missing variables to hosting platform |
| `R2 authentication failed` | Invalid access key or secret | Regenerate R2 API token and update variables |
| `R2 bucket 'blueballs' does not exist` | Bucket name wrong or deleted | Check bucket name in Cloudflare dashboard |
| `R2 access denied` | Token lacks permissions | Regenerate token with "Object Read & Write" |
| `R2 network error` | Cannot reach endpoint URL | Verify endpoint URL format |
| `CORS policy` | CORS not configured | Follow `setup-r2-cors.md` |

### Step 4: Test Health Check (Optional)

If you added the health check endpoint:

```bash
curl https://blueballs.lol/api/health/r2
```

Expected response:
```json
{
  "status": "ok",
  "r2": {
    "configured": true,
    "bucket": "blueballs"
  }
}
```

---

## Troubleshooting

### Problem: "Missing required R2 environment variables"

**Solution**:
1. Double-check all 6 variables are set in production
2. Ensure variable names match exactly (case-sensitive)
3. Redeploy after adding variables

### Problem: "R2 authentication failed"

**Solution**:
1. Verify `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are correct
2. Check if API token was deleted/revoked in Cloudflare
3. Generate a new API token and update both variables
4. Ensure token has "Object Read & Write" permissions

### Problem: "R2 network error - Cannot reach endpoint"

**Solution**:
1. Check `R2_ENDPOINT_URL` format: `https://<account-id>.r2.cloudflarestorage.com`
2. Ensure account ID in URL matches your actual account ID
3. No trailing slashes in endpoint URL

### Problem: Uploads work on localhost but fail on production

**Checklist**:
- [ ] All 6 R2 environment variables set in production?
- [ ] Variables marked as "secret" where needed?
- [ ] CORS policy configured with production domain?
- [ ] R2 bucket has public access enabled (for CDN)?
- [ ] Custom domain DNS configured correctly?
- [ ] Redeployed after adding environment variables?

### Problem: Getting CORS errors in browser console

This means CORS is not configured correctly. Follow `setup-r2-cors.md`:
1. Go to Cloudflare R2 dashboard
2. Select bucket → Settings → CORS Policy
3. Add production domain to AllowedOrigins
4. Wait a few minutes for changes to propagate

---

## Security Best Practices

### 1. Protect Your Secrets
- ✅ Mark `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` as secrets
- ✅ Never commit `.env` file to git
- ✅ Use different API tokens for dev and production

### 2. Limit Token Permissions
- ✅ Create token with only "Object Read & Write"
- ❌ Don't use admin tokens or tokens with excessive permissions
- ✅ Scope token to specific bucket if possible

### 3. Monitor Usage
- Periodically check R2 usage in Cloudflare dashboard
- Set up alerts for unusual activity
- Rotate API tokens regularly (every 3-6 months)

### 4. CORS Configuration
- Only allow your production domain
- Don't use wildcards (`*`) in production
- Keep AllowedMethods to only what's needed

---

## Quick Reference: .env.example

Create this file for new developers (don't commit actual values):

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=blueballs
R2_PUBLIC_URL=https://cdn.blueballs.lol
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com
```

---

## Support

If you're still experiencing issues after following this guide:

1. Check production server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test R2 connectivity using the health check endpoint
4. Review Cloudflare R2 dashboard for access logs
5. Contact your hosting platform's support if deployment issues persist

---

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 CORS Setup Guide](./setup-r2-cors.md)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-static-private)
