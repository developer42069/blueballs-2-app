-- Add profile_image_url column to profiles table
-- This stores the CDN URL of the user's profile image hosted on R2

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profile_image_url
ON profiles(profile_image_url);

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_image_url IS 'CDN URL of user profile image hosted on Cloudflare R2 (cdn.blueballs.lol)';
