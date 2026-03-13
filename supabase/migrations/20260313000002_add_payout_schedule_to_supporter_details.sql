-- Add payout_schedule columns to supporter_details
-- These columns exist on profiles but need to be on supporter_details for the payout function

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS payout_schedule TEXT DEFAULT 'manual'
CHECK (payout_schedule IN ('manual', 'daily', 'weekly', 'monthly'));

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS payout_schedule_day TEXT DEFAULT NULL;

-- Add stripe_payouts_enabled if it doesn't exist (needed for payout eligibility check)
ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false;

-- Comments
COMMENT ON COLUMN supporter_details.payout_schedule IS 'Automatic payout schedule: manual, daily, weekly, or monthly';
COMMENT ON COLUMN supporter_details.payout_schedule_day IS 'Day for scheduled payout. Weekly: monday-sunday. Monthly: 1-28';
COMMENT ON COLUMN supporter_details.stripe_payouts_enabled IS 'Whether Stripe payouts are enabled for this supporter';

-- Create index for efficient payout queries
CREATE INDEX IF NOT EXISTS idx_supporter_details_payout_schedule
ON supporter_details(payout_schedule)
WHERE payout_schedule != 'manual';
