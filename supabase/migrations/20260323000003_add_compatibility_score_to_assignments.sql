-- Add compatibility_score column to client_assignments
-- This stores the actual match score from the matching algorithm

ALTER TABLE client_assignments
ADD COLUMN IF NOT EXISTS compatibility_score INTEGER DEFAULT NULL;

COMMENT ON COLUMN client_assignments.compatibility_score IS 'Compatibility score (0-100) from the matching algorithm when the assignment was created';
