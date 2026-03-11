-- Add missing columns to profiles table that are referenced by the onboarding checklist
-- These columns were expected in profiles but only existed in supporter_details

-- Training status (also exists in supporter_details for detailed tracking)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS training_complete BOOLEAN DEFAULT FALSE;

-- Verification status
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_submitted';

-- Create index for verification status queries
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status
ON profiles(verification_status);

-- Comment for documentation
COMMENT ON COLUMN profiles.training_complete IS 'Whether supporter has completed training. Updated when training is finished.';
COMMENT ON COLUMN profiles.verification_status IS 'Status of document verification: not_submitted, pending_review, approved, rejected';
