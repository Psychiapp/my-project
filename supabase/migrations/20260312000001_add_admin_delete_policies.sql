-- Add DELETE policies for admin users on profiles and supporter_details tables
-- This serves as a backup layer alongside the Edge Function approach

-- Policy: Admins can delete any profile
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
CREATE POLICY "Admins can delete any profile"
ON profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admins can delete any supporter_details
DROP POLICY IF EXISTS "Admins can delete any supporter_details" ON supporter_details;
CREATE POLICY "Admins can delete any supporter_details"
ON supporter_details FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add comments for documentation
COMMENT ON POLICY "Admins can delete any profile" ON profiles IS 'Allows admin users to delete any user profile';
COMMENT ON POLICY "Admins can delete any supporter_details" ON supporter_details IS 'Allows admin users to delete any supporter details record';
