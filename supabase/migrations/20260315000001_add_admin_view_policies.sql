-- Add RLS policies allowing admins to view all sessions and payouts
-- Required for admin dashboard functionality

-- Policy: Admins can view all sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON sessions;
CREATE POLICY "Admins can view all sessions"
ON sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admins can view all payouts
DROP POLICY IF EXISTS "Admins can view all payouts" ON payouts;
CREATE POLICY "Admins can view all payouts"
ON payouts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add comments for documentation
COMMENT ON POLICY "Admins can view all sessions" ON sessions IS 'Allows admin users to view all sessions for dashboard analytics';
COMMENT ON POLICY "Admins can view all payouts" ON payouts IS 'Allows admin users to view all payouts for revenue tracking';
