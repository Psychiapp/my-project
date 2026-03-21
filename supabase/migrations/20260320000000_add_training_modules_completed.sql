-- Add training_modules_completed column to profiles table
-- This stores an array of completed module IDs for tracking training progress

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS training_modules_completed jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.training_modules_completed IS 'Array of completed training module IDs: confidentiality, mindfulness, cbt, validation, crisis, platform';
