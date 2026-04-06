-- Migration: Add fallback when no supporters found in same timezone
-- Issue: If no supporters are in the client's timezone, the live support request fails
-- Fix: First try same timezone, then fall back to any eligible supporter

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
    LIMIT 10;

    -- Check if we found any
    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- If we found supporters in the same timezone, we're done
    IF v_count > 0 THEN
      RETURN;
    END IF;
  END IF;

  -- Fallback: Return any eligible supporter regardless of timezone
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
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
