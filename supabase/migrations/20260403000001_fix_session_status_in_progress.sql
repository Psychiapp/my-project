-- Migration: Fix session status value from 'active' to 'in_progress'

CREATE OR REPLACE FUNCTION accept_live_support_request(
  p_request_id UUID,
  p_supporter_id UUID
)
RETURNS live_support_requests AS $$
DECLARE
  v_request live_support_requests;
  v_session_id UUID;
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

  -- Create the session with 'in_progress' status (valid status value)
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
    30,  -- Default 30 minute session
    CASE WHEN v_request.charged_as_payg THEN 'completed' ELSE 'not_required' END
  )
  RETURNING id INTO v_session_id;

  -- Update the live support request with the session_id
  UPDATE live_support_requests
  SET session_id = v_session_id
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  -- Mark supporter as in_session
  UPDATE profiles
  SET in_session = true
  WHERE id = p_supporter_id;

  RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
