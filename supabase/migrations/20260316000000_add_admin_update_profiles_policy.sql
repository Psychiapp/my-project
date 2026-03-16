-- Add UPDATE policy for admin users on profiles table
-- This allows admins to update verification_status, is_verified, and other fields for any user

-- Policy: Admins can update any profile
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
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

COMMENT ON POLICY "Admins can update all profiles" ON profiles IS 'Allows admin users to update any profile (e.g., verification status, account status)';
