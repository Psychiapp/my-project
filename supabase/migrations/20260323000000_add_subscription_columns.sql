-- Add subscription columns to profiles table
-- These are used by the client booking flow to check session allowances

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.subscription_tier IS 'Client subscription tier: basic, standard, premium, or null for no subscription';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status: active, cancelled, expired, or null';
