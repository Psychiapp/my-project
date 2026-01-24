-- Add Stripe Connect columns to profiles table for supporter payouts

-- Stripe Connect account ID (from Stripe)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;

-- Connect account status: pending, pending_verification, active, restricted, disabled
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_status TEXT;

-- Whether the account can accept charges
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;

-- Whether the account can receive payouts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- Payout schedule preference: manual, daily, weekly, monthly
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_schedule TEXT DEFAULT 'weekly';

-- Day for payout schedule (e.g., 'friday' for weekly, '1' for monthly)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_schedule_day TEXT DEFAULT 'friday';

-- Create payouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in cents
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payouts_supporter_id ON payouts(supporter_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_connect_id ON profiles(stripe_connect_id);

-- Enable RLS on payouts table
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Policy: Supporters can view their own payouts
CREATE POLICY IF NOT EXISTS "Supporters can view own payouts"
  ON payouts FOR SELECT
  USING (auth.uid() = supporter_id);

-- Policy: Only service role can insert/update payouts (via Edge Functions)
CREATE POLICY IF NOT EXISTS "Service role can manage payouts"
  ON payouts FOR ALL
  USING (auth.role() = 'service_role');
