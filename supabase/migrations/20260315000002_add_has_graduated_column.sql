-- Add has_graduated column to supporter_details
-- Indicates whether the supporter has already graduated from their institution

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS has_graduated BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN supporter_details.has_graduated IS 'Whether the supporter has graduated from their educational institution';
