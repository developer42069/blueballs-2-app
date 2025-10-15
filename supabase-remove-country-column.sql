-- Remove the accidentally added country column
-- We should use country_code instead which already exists
ALTER TABLE profiles
DROP COLUMN IF EXISTS country;
