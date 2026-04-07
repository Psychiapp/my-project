-- Migration: Update live support eligibility function
-- Changes:
-- 1. Increase supporter limit from 10 to 15
-- 2. Remove is_online check (supporters are notified via push, don't need to be online)
-- 3. Clarify timezone fallback logic

CREATE OR REPLACE FUNCTION get_all_eligible_supporters(p_timezone TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  expo_push_token TEXT
) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- First, try to find supporters in the same timezone (if specified)
  IF p_timezone IS NOT NULL THEN
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
      AND p.timezone = p_timezone  -- Same timezone as client
    ORDER BY RANDOM()  -- Randomize selection for fairness
    LIMIT 15;

    -- Check if we found any
    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- If we found supporters in the same timezone, we're done
    IF v_count > 0 THEN
      RETURN;
    END IF;
  END IF;

  -- Fallback: Return any eligible supporter regardless of timezone
  -- This ensures clients can always find support even if no one is in their timezone
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
  ORDER BY RANDOM()  -- Randomize selection for fairness
  LIMIT 15;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

