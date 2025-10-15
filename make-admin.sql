-- Make canbeerliquor@gmail.com an admin
-- Run this in your Supabase SQL Editor

UPDATE profiles
SET is_admin = true
WHERE email = 'canbeerliquor@gmail.com';

-- Verify the update
SELECT id, email, username, is_admin
FROM profiles
WHERE email = 'canbeerliquor@gmail.com';
