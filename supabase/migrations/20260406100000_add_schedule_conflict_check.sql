-- Migration: Add schedule conflict check to live support eligibility
-- Ensures supporters are not notified if they have an upcoming scheduled session
-- that would conflict with the requested live session duration
--
-- Session durations:
-- - chat: 30 minutes
-- - phone: 45 minutes
-- - video: 45 minutes

CREATE OR REPLACE FUNCTION get_all_eligible_supporters(
  p_timezone TEXT DEFAULT NULL,
  p_session_type TEXT DEFAULT 'chat'
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  expo_push_token TEXT
) AS $$
DECLARE
  v_count INTEGER;
  v_required_minutes INTEGER;
BEGIN
  -- Determine how much free time is needed based on session type
  -- Add 15 minute buffer for session setup/wrap-up
  v_required_minutes := CASE p_session_type
    WHEN 'chat' THEN 45   -- 30 min session + 15 min buffer
    WHEN 'phone' THEN 60  -- 45 min session + 15 min buffer
    WHEN 'video' THEN 60  -- 45 min session + 15 min buffer
    ELSE 45               -- Default to chat duration
  END;

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
      -- Check for schedule conflicts: no upcoming sessions within required time window
      AND NOT EXISTS (
        SELECT 1 FROM sessions s
        WHERE s.supporter_id = p.id
          AND s.status = 'scheduled'  -- Only check scheduled (not completed/cancelled)
          AND s.scheduled_at > NOW()  -- Session is in the future
          AND s.scheduled_at < NOW() + (v_required_minutes || ' minutes')::INTERVAL
      )
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
    -- Check for schedule conflicts: no upcoming sessions within required time window
    AND NOT EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.supporter_id = p.id
        AND s.status = 'scheduled'  -- Only check scheduled (not completed/cancelled)
        AND s.scheduled_at > NOW()  -- Session is in the future
        AND s.scheduled_at < NOW() + (v_required_minutes || ' minutes')::INTERVAL
    )
  ORDER BY RANDOM()  -- Randomize selection for fairness
  LIMIT 15;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the function
COMMENT ON FUNCTION get_all_eligible_supporters(TEXT, TEXT) IS
'Returns eligible supporters for live support requests.
Checks: verified, not suspended, not in session, has push token, no schedule conflicts.
p_timezone: Optional timezone filter (falls back to all timezones if no matches)
p_session_type: chat/phone/video - determines required free time window';
