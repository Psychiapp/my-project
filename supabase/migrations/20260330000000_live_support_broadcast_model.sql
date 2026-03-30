-- Migration: Change live support to broadcast model
-- Instead of assigning to one supporter, notify ALL eligible supporters
-- First to accept wins

-- 1. Function to get ALL eligible supporters (not just one)
-- Returns supporters who are verified, not in session, not suspended, completed onboarding
CREATE OR REPLACE FUNCTION get_all_eligible_supporters()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  expo_push_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.expo_push_token
  FROM profiles p
  LEFT JOIN supporter_details sd ON sd.supporter_id = p.id
  WHERE p.role = 'supporter'
    AND p.in_session = false  -- Not currently in a session
    AND p.onboarding_complete = true  -- Completed onboarding
    AND sd.is_verified = true  -- Admin verified
    AND sd.suspended_at IS NULL  -- Not suspended
    AND p.expo_push_token IS NOT NULL;  -- Has push token for notifications
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_eligible_supporters() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_eligible_supporters() TO service_role;

-- 2. Function to atomically accept a live support request (first come first served)
-- Returns the request if successfully accepted, NULL if already taken
CREATE OR REPLACE FUNCTION accept_live_support_request(
  p_request_id UUID,
  p_supporter_id UUID
)
RETURNS live_support_requests AS $$
DECLARE
  v_request live_support_requests;
BEGIN
  -- Try to claim the request atomically
  -- Only succeeds if status is still 'pending'
  UPDATE live_support_requests
  SET
    status = 'accepted',
    requested_supporter_id = p_supporter_id,
    accepted_at = now()
  WHERE id = p_request_id
    AND status = 'pending'
  RETURNING * INTO v_request;

  IF v_request IS NULL THEN
    -- Request was already accepted by someone else or doesn't exist
    RETURN NULL;
  END IF;

  -- Mark supporter as in_session
  UPDATE profiles
  SET in_session = true
  WHERE id = p_supporter_id;

  RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION accept_live_support_request(UUID, UUID) TO authenticated;

-- 3. Make requested_supporter_id nullable (for broadcast model)
-- The column should already allow NULL, but let's ensure it
ALTER TABLE live_support_requests
  ALTER COLUMN requested_supporter_id DROP NOT NULL;

-- 4. Add index for finding pending requests efficiently
CREATE INDEX IF NOT EXISTS idx_live_support_requests_pending
ON live_support_requests (status)
WHERE status = 'pending';

-- 5. Update RLS policies for supporters to see ALL pending requests
DROP POLICY IF EXISTS "Supporters can view requests assigned to them" ON live_support_requests;

CREATE POLICY "Supporters can view pending and their requests" ON live_support_requests
FOR SELECT USING (
  auth.uid() = client_id
  OR (
    -- Supporters can see ALL pending requests (broadcast model)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supporter'
    )
    AND (status = 'pending' OR requested_supporter_id = auth.uid())
  )
);
