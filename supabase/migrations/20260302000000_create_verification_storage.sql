-- Create verification-documents storage bucket for supporter transcript and ID uploads
-- This bucket stores sensitive documents and should be private

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false, -- Private bucket - files require authenticated access
  52428800, -- 50MB file size limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for verification-documents bucket

-- Policy: Authenticated users can upload to their own folder
-- Path structure: {folder}/{user_id}/{filename}
-- e.g., transcripts/uuid-123/1234567890.pdf
CREATE POLICY "Users can upload own verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can view their own uploaded documents
CREATE POLICY "Users can view own verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can update (overwrite) their own documents
CREATE POLICY "Users can update own verification documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own verification documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Admins can view all verification documents (for review)
CREATE POLICY "Admins can view all verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add verification columns to supporter_details if they don't exist
-- These may already exist from initial schema, but ensure they're there
ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_submitted'
  CHECK (verification_status IN ('not_submitted', 'pending_review', 'approved', 'rejected'));

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS transcript_url TEXT;

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ;

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ;

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS verification_rejection_reason TEXT;

-- Add is_verified column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add verification_status column to profiles for quick lookup
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_submitted'
  CHECK (verification_status IN ('not_submitted', 'pending_review', 'approved', 'rejected'));

-- Create index for verification status queries
CREATE INDEX IF NOT EXISTS idx_supporter_details_verification_status
ON supporter_details(verification_status);

CREATE INDEX IF NOT EXISTS idx_profiles_verification_status
ON profiles(verification_status) WHERE role = 'supporter';

-- Add comment for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets including verification-documents for supporter ID and transcript uploads';
