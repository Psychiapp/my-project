-- Add UPDATE policy for admin users on supporter_details table
-- This allows admins to update verification_status and other fields for any supporter

-- Policy: Admins can update any supporter_details
DROP POLICY IF EXISTS "Admins can update any supporter_details" ON supporter_details;
CREATE POLICY "Admins can update any supporter_details"
ON supporter_details FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

COMMENT ON POLICY "Admins can update any supporter_details" ON supporter_details IS 'Allows admin users to update any supporter details record (e.g., verification status)';
