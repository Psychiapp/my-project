-- Fix get_all_eligible_supporters: two corrections
--
-- 1. Remove expo_push_token IS NOT NULL requirement.
--    This was blocking request creation entirely when a supporter hadn't registered
--    a push token (Expo Go, permissions not granted, token save failure, etc.).
--    The Edge Function already filters supporters.filter(s => s.expo_push_token)
--    before calling the Expo Push API, so this guard is redundant there and harmful
--    in the pre-check: a supporter with their toggle ON but no token caused the
--    pre-check to return 0, preventing the request from ever being created and
--    suppressing the in-app realtime card too.
--
-- 2. Add available_for_live_support = true requirement.
--    The availability toggle has never been checked, meaning supporters with their
--    toggle OFF were still being push-notified and counted in the eligibility
--    pre-check.

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
  v_required_minutes := CASE p_session_type
    WHEN 'chat'  THEN 45
    WHEN 'phone' THEN 60
    WHEN 'video' THEN 60
    ELSE 45
  END;

  -- First pass: supporters in the same timezone
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
      AND p.in_session = false
      AND p.onboarding_complete = true
      AND p.available_for_live_support = true
      AND sd.is_verified = true
      AND sd.suspended_at IS NULL
      AND p.timezone = p_timezone
      AND NOT EXISTS (
        SELECT 1 FROM sessions s
        WHERE s.supporter_id = p.id
          AND s.status = 'scheduled'
          AND s.scheduled_at > NOW()
          AND s.scheduled_at < NOW() + (v_required_minutes || ' minutes')::INTERVAL
      )
    ORDER BY RANDOM()
    LIMIT 15;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    IF v_count > 0 THEN
      RETURN;
    END IF;
  END IF;

  -- Fallback: any timezone
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.expo_push_token
  FROM profiles p
  LEFT JOIN supporter_details sd ON sd.supporter_id = p.id
  WHERE p.role = 'supporter'
    AND p.in_session = false
    AND p.onboarding_complete = true
    AND p.available_for_live_support = true
    AND sd.is_verified = true
    AND sd.suspended_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.supporter_id = p.id
        AND s.status = 'scheduled'
        AND s.scheduled_at > NOW()
        AND s.scheduled_at < NOW() + (v_required_minutes || ' minutes')::INTERVAL
    )
  ORDER BY RANDOM()
  LIMIT 15;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_all_eligible_supporters(TEXT, TEXT) IS
'Returns eligible supporters for live support requests.
Checks: verified, not suspended, not in session, availability toggle ON, no schedule conflicts.
Push token is NOT required here — the Edge Function filters for that separately.
p_timezone: optional timezone filter (falls back to all timezones if no matches).
p_session_type: chat/phone/video — determines the required conflict-free window.';
