-- Create avatars storage bucket for user profile photos
-- This bucket is public so avatar URLs can be displayed without authentication

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket - avatars are publicly viewable
  5242880, -- 5MB file size limit for avatars
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for avatars bucket

-- Policy: Authenticated users can upload their own avatar
-- File naming convention: {user_id}-{timestamp}.{ext}
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.filename(name) LIKE auth.uid()::text || '-%')
);

-- Policy: Anyone can view avatars (public bucket)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Users can update (overwrite) their own avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.filename(name) LIKE auth.uid()::text || '-%')
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.filename(name) LIKE auth.uid()::text || '-%')
);

-- Policy: Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.filename(name) LIKE auth.uid()::text || '-%')
);
