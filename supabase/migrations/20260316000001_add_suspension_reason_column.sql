-- Add suspension_reason column to supporter_details
-- Stores the reason provided by admin when suspending a supporter account

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

COMMENT ON COLUMN supporter_details.suspension_reason IS 'Reason provided by admin for account suspension';
COMMENT ON COLUMN supporter_details.suspended_at IS 'Timestamp when the account was suspended';
