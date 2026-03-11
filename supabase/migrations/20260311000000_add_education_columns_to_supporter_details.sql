-- Add education columns to supporter_details table
-- These fields are used during supporter onboarding/verification

ALTER TABLE supporter_details
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS years_attending INTEGER,
ADD COLUMN IF NOT EXISTS expected_graduation TEXT;

-- Comments for documentation
COMMENT ON COLUMN supporter_details.school_name IS 'Name of school/university the supporter attends';
COMMENT ON COLUMN supporter_details.major IS 'Supporter academic major';
COMMENT ON COLUMN supporter_details.years_attending IS 'Number of years attending school';
COMMENT ON COLUMN supporter_details.expected_graduation IS 'Expected graduation date/year';
