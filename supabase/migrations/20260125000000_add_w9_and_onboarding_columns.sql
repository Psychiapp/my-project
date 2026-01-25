-- Add W-9 and onboarding status columns to profiles table

-- W-9 form completion status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS w9_completed BOOLEAN DEFAULT FALSE;

-- When W-9 was completed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS w9_completed_at TIMESTAMPTZ;

-- W-9 form data (encrypted/masked SSN, address, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS w9_data JSONB;

-- Overall onboarding status for supporters
-- This is a computed check: w9_completed AND stripe_payouts_enabled AND training_complete
-- Supporters cannot receive client assignments until this is true
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- When onboarding was marked complete
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create a function to check and update onboarding status
CREATE OR REPLACE FUNCTION update_supporter_onboarding_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only apply to supporters
  IF NEW.role = 'supporter' THEN
    -- Check if all requirements are met
    IF NEW.w9_completed = TRUE
       AND NEW.stripe_payouts_enabled = TRUE
       AND NEW.training_complete = TRUE THEN
      -- Mark onboarding as complete if not already
      IF NEW.onboarding_complete = FALSE OR NEW.onboarding_complete IS NULL THEN
        NEW.onboarding_complete := TRUE;
        NEW.onboarding_completed_at := NOW();
      END IF;
    ELSE
      -- Mark as incomplete if any requirement is missing
      NEW.onboarding_complete := FALSE;
      NEW.onboarding_completed_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update onboarding status
DROP TRIGGER IF EXISTS trigger_update_supporter_onboarding ON profiles;
CREATE TRIGGER trigger_update_supporter_onboarding
  BEFORE INSERT OR UPDATE OF w9_completed, stripe_payouts_enabled, training_complete
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_supporter_onboarding_status();

-- Create index for faster lookups of onboarding status
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete ON profiles(onboarding_complete) WHERE role = 'supporter';

-- Update RLS policy for W9 data - only the user can see their own W9 data
-- The w9_data column contains sensitive information
CREATE POLICY IF NOT EXISTS "Users can view own W9 data"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Add comment for documentation
COMMENT ON COLUMN profiles.w9_data IS 'Contains masked SSN (last 4 only), address, and tax classification. Full SSN handled by Stripe.';
COMMENT ON COLUMN profiles.onboarding_complete IS 'True when supporter has completed W9, bank setup, and training. Required before receiving client assignments.';
