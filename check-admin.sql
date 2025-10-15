-- Check if canbeerliquor@gmail.com is admin
SELECT id, email, username, is_admin, membership_tier, created_at
FROM profiles
WHERE email = 'canbeerliquor@gmail.com';
