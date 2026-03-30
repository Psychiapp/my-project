-- Migration: Add timezone to profiles and limit broadcast to 10 supporters in same timezone

-- 1. Add timezone column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- 2. Update function to filter by timezone and limit to 10 supporters
CREATE OR REPLACE FUNCTION get_all_eligible_supporters(p_timezone TEXT DEFAULT NULL)
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
    AND p.expo_push_token IS NOT NULL  -- Has push token for notifications
    AND (p_timezone IS NULL OR p.timezone = p_timezone)  -- Same timezone as client (if specified)
  ORDER BY RANDOM()  -- Randomize selection for fairness
  LIMIT 10;  -- Only notify 10 supporters at a time
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to get client timezone
CREATE OR REPLACE FUNCTION get_client_timezone(p_client_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_timezone TEXT;
BEGIN
  SELECT timezone INTO v_timezone
  FROM profiles
  WHERE id = p_client_id;

  RETURN COALESCE(v_timezone, 'America/New_York');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_client_timezone(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_timezone(UUID) TO service_role;
