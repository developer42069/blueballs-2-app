# Cloudflare R2 CORS Setup Guide

This guide will help you configure CORS (Cross-Origin Resource Sharing) for your R2 bucket so uploads work from both localhost and production.

## Problem
- ✅ Uploads work on `http://localhost:5173`
- ❌ Uploads fail on `https://blueballs.lol` with "Failed to upload file to R2"

## Root Cause
Your R2 bucket needs CORS configuration to allow requests from your production domain.

---

## Solution: Configure CORS

### Method 1: Cloudflare Dashboard (Easiest)

1. **Login to Cloudflare**
   - Go to: https://dash.cloudflare.com/
   - Navigate to: **R2** → **Buckets** → **blueballs**

2. **Open Settings**
   - Click on the **Settings** tab
   - Scroll to **CORS Policy** section

3. **Add CORS Policy**
   - Click "Add CORS Policy" or "Edit"
   - Copy and paste this configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://blueballs.lol",
      "http://localhost:5173",
      "http://localhost:5174"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

4. **Save Changes**
   - Click "Save" or "Apply"

---

### Method 2: Using Wrangler CLI

If you have `wrangler` CLI installed:

```bash
# Install wrangler if you don't have it
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Apply CORS configuration (use the r2-cors-config.json file)
wrangler r2 bucket cors put blueballs --file r2-cors-config.json
```

---

### Method 3: Using AWS S3 SDK (via code)

Since you're using the S3-compatible API, you can also set CORS programmatically. Create a script:

```javascript
// setup-r2-cors.js
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: 'https://d8d7390ea59a7242035268cefde64cc4.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'aabdc4a49f01340b53bcbe6f6d3cdda0',
    secretAccessKey: 'a1b997930808c855017991b093a413ae8cfcafc0785ccba71d3db01e97ed7afd'
  }
});

const corsConfig = {
  Bucket: 'blueballs',
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: [
          'https://blueballs.lol',
          'http://localhost:5173',
          'http://localhost:5174'
        ],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
        MaxAgeSeconds: 3600
      }
    ]
  }
};

async function setupCORS() {
  try {
    const command = new PutBucketCorsCommand(corsConfig);
    await r2Client.send(command);
    console.log('✅ CORS configuration applied successfully!');
  } catch (error) {
    console.error('❌ Failed to apply CORS:', error);
  }
}

setupCORS();
```

Then run:
```bash
node setup-r2-cors.js
```

---

## Verify CORS Configuration

After applying CORS, test the upload again on `https://blueballs.lol/settings`

### Expected Result:
- ✅ Upload should now work on production
- ✅ Upload should still work on localhost
- ✅ No more "Failed to upload file to R2" errors

---

## Understanding the CORS Rules

**AllowedOrigins**: Which domains can make requests
- `https://blueballs.lol` - Your production site
- `http://localhost:5173` - Your dev server
- `http://localhost:5174` - Backup dev port

**AllowedMethods**: What HTTP methods are allowed
- `PUT` - Upload files
- `GET` - Download files
- `DELETE` - Remove files
- `POST`, `HEAD` - Additional operations

**AllowedHeaders**: All headers are allowed (`*`)

**ExposeHeaders**: Which headers the browser can access
- Important for file uploads and downloads

**MaxAgeSeconds**: How long to cache CORS preflight requests (1 hour)

---

## Troubleshooting

### Still getting errors after CORS setup?

1. **Check browser console** for specific CORS error messages
2. **Clear browser cache** (CORS responses are cached)
3. **Wait a few minutes** for CORS changes to propagate
4. **Verify bucket is public** (if you want CDN URLs to work)
5. **Check R2 Public Access** settings in Cloudflare dashboard

### How to check if CORS is working:

Open browser developer tools → Network tab → Try upload → Check for:
- ❌ CORS error in console = CORS not configured correctly
- ✅ 200 OK responses = CORS working properly

---

## Additional R2 Settings to Check

### Make Bucket Publicly Accessible (for CDN)

If you want your uploaded images to be accessible via `https://cdn.blueballs.lol`:

1. Go to R2 bucket settings
2. Enable **"Public Access"**
3. Connect a custom domain: `cdn.blueballs.lol`
4. Add DNS record in Cloudflare:
   - Type: `CNAME`
   - Name: `cdn`
   - Target: `<your-bucket>.r2.cloudflarestorage.com`

---

## Security Notes

⚠️ **Important**: The CORS configuration allows uploads from specific origins only:
- Only `blueballs.lol` and `localhost` can upload
- Public can only view images (if bucket is public)
- Your API still requires authentication via Supabase
- R2 credentials are only used server-side (never exposed to client)

This is secure! The actual upload happens through your API endpoint which validates the user's session.
