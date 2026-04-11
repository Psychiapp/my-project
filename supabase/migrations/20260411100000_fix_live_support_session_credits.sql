-- Migration: Fix live support sessions to properly deduct from subscription credits
-- Issue: When a live support session is accepted for a subscribed user,
-- the sessions_remaining in subscriptions table was never decremented.

-- Update accept_live_support_request to decrement subscription credits
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

  v_session_type := v_request.session_type;

  -- If NOT charged as PAYG, decrement subscription credits
  IF v_request.charged_as_payg = false THEN
    -- Get current sessions_remaining
    SELECT sessions_remaining INTO v_current_remaining
    FROM subscriptions
    WHERE user_id = v_request.client_id
      AND status = 'active';

    IF v_current_remaining IS NOT NULL THEN
      -- Get current count for this session type
      v_type_remaining := COALESCE((v_current_remaining->>v_session_type)::INTEGER, 0);

      -- Only decrement if there are credits remaining
      IF v_type_remaining > 0 THEN
        -- Build new remaining object with decremented value
        v_new_remaining := v_current_remaining ||
          jsonb_build_object(v_session_type, v_type_remaining - 1);

        -- Update subscriptions table
        UPDATE subscriptions
        SET
          sessions_remaining = v_new_remaining,
          updated_at = now()
        WHERE user_id = v_request.client_id
          AND status = 'active';

        RAISE LOG 'Decremented % session credit for user %. Remaining: %',
          v_session_type, v_request.client_id, v_type_remaining - 1;
      ELSE
        -- No credits remaining but charged_as_payg was false
        -- This shouldn't happen if the client-side check worked correctly
        RAISE WARNING 'User % has no % credits remaining but was not charged as PAYG',
          v_request.client_id, v_session_type;
      END IF;
    END IF;
  END IF;

  -- Create the session with 'in_progress' status
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

-- Add comment explaining the credit deduction logic
COMMENT ON FUNCTION accept_live_support_request(UUID, UUID) IS
'Atomically accepts a live support request (first come first served).
When charged_as_payg is false, decrements the appropriate session type
from the client''s sessions_remaining in subscriptions table.
Returns the request if successfully accepted, NULL if already taken.';
