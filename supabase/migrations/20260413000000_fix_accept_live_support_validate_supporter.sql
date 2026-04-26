-- Fix: validate supporter availability and in_session state before accepting
-- Previously a supporter with their toggle OFF or already in a session could accept
-- a request via a stale realtime card.

CREATE OR REPLACE FUNCTION accept_live_support_request(
  p_request_id UUID,
  p_supporter_id UUID
)
RETURNS live_support_requests AS $$
DECLARE
  v_request live_support_requests;
  v_session_id UUID;
  v_session_type TEXT;
  v_current_remaining JSONB;
  v_new_remaining JSONB;
  v_type_remaining INTEGER;
  v_supporter_available BOOLEAN;
  v_supporter_in_session BOOLEAN;
BEGIN
  -- Validate supporter is still available and not in another session
  SELECT
    available_for_live_support,
    in_session
  INTO
    v_supporter_available,
    v_supporter_in_session
  FROM profiles
  WHERE id = p_supporter_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supporter profile not found';
  END IF;

  IF v_supporter_in_session THEN
    RAISE EXCEPTION 'Supporter is already in a session';
  END IF;

  IF NOT v_supporter_available THEN
    RAISE EXCEPTION 'Supporter is not available for live support';
  END IF;

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

  v_session_type := v_request.session_type;

  -- If NOT charged as PAYG, decrement subscription credits
  IF v_request.charged_as_payg = false THEN
    SELECT sessions_remaining INTO v_current_remaining
    FROM subscriptions
    WHERE user_id = v_request.client_id
      AND status = 'active';

    IF v_current_remaining IS NOT NULL THEN
      v_type_remaining := COALESCE((v_current_remaining->>v_session_type)::INTEGER, 0);

      IF v_type_remaining > 0 THEN
        v_new_remaining := v_current_remaining ||
          jsonb_build_object(v_session_type, v_type_remaining - 1);

        UPDATE subscriptions
        SET
          sessions_remaining = v_new_remaining,
          updated_at = now()
        WHERE user_id = v_request.client_id
          AND status = 'active';
      ELSE
        RAISE WARNING 'User % has no % credits remaining but was not charged as PAYG',
          v_request.client_id, v_session_type;
      END IF;
    END IF;
  END IF;

  -- Create the session
  INSERT INTO sessions (
    client_id,
    supporter_id,
    session_type,
    status,
    scheduled_at,
    duration_minutes,
    payment_status
  ) VALUES (
    v_request.client_id,
    p_supporter_id,
    v_request.session_type,
    'in_progress',
    now(),
    30,
    CASE WHEN v_request.charged_as_payg THEN 'completed' ELSE 'not_required' END
  )
  RETURNING id INTO v_session_id;

  -- Link session to request
  UPDATE live_support_requests
  SET session_id = v_session_id
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  -- Mark supporter as in_session and not available (prevents double-accept)
  UPDATE profiles
  SET
    in_session = true,
    available_for_live_support = false
  WHERE id = p_supporter_id;

  RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION accept_live_support_request(UUID, UUID) IS
'Atomically accepts a live support request.
Validates: supporter is not in_session and has available_for_live_support=true.
Decrements subscription credit if not PAYG.
Sets supporter in_session=true and available_for_live_support=false on acceptance.';
