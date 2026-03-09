-- Add preferences JSONB column to profiles table for storing client preferences
-- This stores timezone, preferred session types, and other matching preferences

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB;

-- Add comment for documentation
COMMENT ON COLUMN profiles.preferences IS 'Client preferences including timezone, preferred session types, communication style, etc.';

-- Update the RLS policy to allow users to update their own preferences
-- (existing "Users can update own profile" policy should already cover this)
