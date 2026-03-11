-- Add missing columns to supporter_details that are queried by getAdminStats and other functions
-- These columns were referenced in code but never added via migration

-- Training status
ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS training_complete BOOLEAN DEFAULT FALSE;

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS training_completed_at TIMESTAMPTZ;

-- Client acceptance status
ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS accepting_clients BOOLEAN DEFAULT TRUE;

-- Availability status
ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

-- Verification status (separate from profiles.is_verified for detailed tracking)
ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Earnings tracking
ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0;

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS pending_payout INTEGER DEFAULT 0;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_supporter_details_training_complete
ON supporter_details(training_complete);

CREATE INDEX IF NOT EXISTS idx_supporter_details_accepting_clients
ON supporter_details(accepting_clients);

CREATE INDEX IF NOT EXISTS idx_supporter_details_is_verified
ON supporter_details(is_verified);
