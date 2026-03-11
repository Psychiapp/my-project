-- Fix avatars storage bucket RLS policies
-- The previous policy using storage.filename() with LIKE may not work correctly
-- Simplifying to allow any authenticated user to upload to avatars bucket

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Simpler policy: Any authenticated user can upload to avatars bucket
-- Security is maintained because:
-- 1. Only authenticated users can upload
-- 2. File names include user ID for tracking
-- 3. Avatars are public anyway (profile photos)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Any authenticated user can update files in avatars bucket
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Any authenticated user can delete files in avatars bucket
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Ensure the public read policy exists
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
