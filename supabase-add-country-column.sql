-- Add country column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN profiles.country IS 'User''s country of residence';

-- Optional: Add an index if you plan to filter by country frequently
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
