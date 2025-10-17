# R2 Profile Image Upload Setup Guide

## ✅ What's Been Done

I've implemented a complete Cloudflare R2 integration for profile image uploads. Here's what's been set up:

### 1. Dependencies Installed ✅
- `@aws-sdk/client-s3` - AWS S3 SDK for R2 compatibility
- `sharp` - Image optimization and resizing

### 2. Files Created ✅

**R2 Utility Functions** (`src/lib/r2.ts`):
- `uploadToR2()` - Upload files to R2 bucket
- `deleteFromR2()` - Delete files from R2
- `fileExistsInR2()` - Check if file exists
- `generateProfileImageKey()` - Generate unique filenames
- `extractKeyFromUrl()` - Parse CDN URLs

**Upload API Endpoint** (`src/routes/api/upload-profile-image/+server.ts`):
- Handles multipart form data uploads
- Validates file type (JPEG, PNG, WebP)
- Validates file size (max 5MB)
- Resizes and optimizes images to 400x400px WebP
- Auto-deletes old profile images
- Updates Supabase profiles table

**Upload UI Component** (`src/lib/components/ProfileImageUpload.svelte`):
- Beautiful circular profile image preview
- Hover overlay for upload button
- Client-side validation
- Progress indication
- Error handling

**Database Migration** (`supabase-migrations/add-profile-image-url.sql`):
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_profile_image_url ON profiles(profile_image_url);
```

### 3. Environment Variables Setup ✅
All R2 credentials are configured in `.env`:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME=blueballs`
- `R2_PUBLIC_URL=https://cdn.blueballs.lol`
- `R2_ENDPOINT_URL`

## 🔧 What You Need to Do

### Step 1: Run the Supabase Migration

Go to your Supabase Dashboard → SQL Editor and run:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_profile_image_url
ON profiles(profile_image_url);

COMMENT ON COLUMN profiles.profile_image_url IS 'CDN URL of user profile image hosted on Cloudflare R2 (cdn.blueballs.lol)';
```

### Step 2: Configure R2 Bucket for Public Access

1. Go to Cloudflare Dashboard → R2
2. Click on your `blueballs` bucket
3. Go to **Settings** → **Public Access**
4. Enable **Public URL Access** or add custom domain `cdn.blueballs.lol`
5. Make sure the `user-profiles/` folder is publicly accessible

### Step 3: Update Settings Page ✅ COMPLETED

The settings page has been successfully updated with the new R2 upload component:
- ✅ Replaced old Supabase Storage upload UI with ProfileImageUpload component
- ✅ Removed premium tier restriction (now free for all users)
- ✅ Added new info banner about free CDN hosting
- ✅ Removed unused variables (`uploadingImage`)
- ✅ Added `handleImageUploadSuccess()` callback

### Step 4: Deploy to Cloudflare Pages

Make sure your Cloudflare Pages environment has all the R2 environment variables set:

1. Go to Cloudflare Pages → Your Project → Settings → Environment Variables
2. Add all R2 variables from your `.env` file

### Step 5: Test the Upload

1. Go to Settings → Profile tab
2. Click the profile image area
3. Select an image file
4. Upload should:
   - Resize to 400x400px
   - Convert to WebP format
   - Upload to R2 at `user-profiles/{userId}/profile-{timestamp}.webp`
   - Serve from `https://cdn.blueballs.lol/user-profiles/...`
   - Delete old profile image automatically

## 📁 Folder Structure in R2

The system automatically creates this folder structure:

```
blueballs (bucket)/
└── user-profiles/
    ├── {user-id-1}/
    │   └── profile-{timestamp}.webp
    ├── {user-id-2}/
    │   └── profile-{timestamp}.webp
    └── ...
```

You can add more folders in the future for other assets:
- `game-assets/` - Game sprites, backgrounds
- `community-uploads/` - User-generated content
- `avatars/` - Custom avatar frames
- etc.

## 🎯 Key Features

### For Users:
- ✅ **FREE for all users** (no membership tier restriction)
- ✅ Auto-resized to 400x400px for consistency
- ✅ Converted to WebP for smaller file size
- ✅ Instant preview before upload
- ✅ Old images auto-deleted to save space

### For You:
- ✅ 10GB free R2 storage (plenty for profile images)
- ✅ Unlimited CDN bandwidth (huge savings vs S3)
- ✅ Custom CDN domain (cdn.blueballs.lol)
- ✅ Automatic folder organization by user ID
- ✅ S3-compatible API (easy migration if needed)

## 🐛 Troubleshooting

**Upload fails with "Failed to upload file to R2":**
- Check R2 credentials in environment variables
- Verify R2 bucket exists and is named `blueballs`
- Check R2 API token permissions

**Images upload but don't display:**
- Enable public access on R2 bucket
- Verify custom domain `cdn.blueballs.lol` is configured
- Check CORS settings in R2 bucket

**"profile_image_url is not defined" error:**
- Run the Supabase migration (Step 1 above)
- Refresh your Supabase schema cache

## 🚀 Next Steps

Once this is working, you can:
1. Add profile image display to leaderboards
2. Show profile images in chat
3. Add profile image to game UI
4. Allow users to upload custom game skins (future R2 folders)

## 💰 Cost Estimate

With 10,000 users uploading profile images:
- Storage: ~2GB (200KB avg × 10,000) = **FREE** (under 10GB limit)
- Uploads: 10,000 = **FREE** (under 1M/month limit)
- Downloads: Varies, but likely **FREE** (under 10M/month limit)
- **Total: $0/month** ✅

---

Let me know if you run into any issues!
