-- Migration: Create live_support_requests table
-- Purpose: Track live support requests from clients to supporters

CREATE TABLE IF NOT EXISTS live_support_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_supporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'phone', 'video')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',       -- Waiting for supporter response
    'accepted',      -- Supporter accepted, session starting
    'declined',      -- Supporter declined (will route to next)
    'expired',       -- Request timed out
    'cancelled',     -- Client cancelled the request
    'completed',     -- Session completed
    'no_supporters'  -- No supporters available
  )),
  payment_intent_id TEXT,
  charged_as_payg BOOLEAN NOT NULL DEFAULT false,
  amount_charged INTEGER, -- in cents
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  decline_history JSONB DEFAULT '[]'::jsonb,
  attempt_count INTEGER NOT NULL DEFAULT 1
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_live_support_requests_client
ON live_support_requests (client_id, status);

CREATE INDEX IF NOT EXISTS idx_live_support_requests_supporter
ON live_support_requests (requested_supporter_id, status);

CREATE INDEX IF NOT EXISTS idx_live_support_requests_expires
ON live_support_requests (expires_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_live_support_requests_created
ON live_support_requests (created_at DESC);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE live_support_requests;

-- Enable Row Level Security
ALTER TABLE live_support_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own requests
CREATE POLICY "Clients can view own requests"
ON live_support_requests FOR SELECT
USING (auth.uid() = client_id);

-- Policy: Supporters can view requests assigned to them
CREATE POLICY "Supporters can view assigned requests"
ON live_support_requests FOR SELECT
USING (auth.uid() = requested_supporter_id);

-- Policy: Clients can create requests
CREATE POLICY "Clients can create requests"
ON live_support_requests FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Policy: Supporters can respond to requests (accept/decline)
CREATE POLICY "Supporters can respond to requests"
ON live_support_requests FOR UPDATE
USING (auth.uid() = requested_supporter_id)
WITH CHECK (status IN ('accepted', 'declined'));

-- Policy: Clients can cancel their pending requests
CREATE POLICY "Clients can cancel pending requests"
ON live_support_requests FOR UPDATE
USING (auth.uid() = client_id AND status = 'pending')
WITH CHECK (status = 'cancelled');

-- Policy: Service role can manage all requests
CREATE POLICY "Service role can manage requests"
ON live_support_requests FOR ALL
USING (auth.role() = 'service_role');

-- Function to route request to next available supporter
CREATE OR REPLACE FUNCTION route_to_next_supporter(p_request_id UUID)
RETURNS UUID AS $$
DECLARE
  v_request RECORD;
  v_exclude_ids UUID[];
  v_next_supporter_id UUID;
BEGIN
  -- Get current request
  SELECT * INTO v_request FROM live_support_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Build exclude list from decline history
  SELECT ARRAY_AGG((elem->>'supporterId')::UUID)
  INTO v_exclude_ids
  FROM jsonb_array_elements(v_request.decline_history) AS elem;

  -- Find next available supporter
  v_next_supporter_id := find_available_supporter(COALESCE(v_exclude_ids, '{}'::UUID[]));

  IF v_next_supporter_id IS NOT NULL THEN
    -- Update request with new supporter
    UPDATE live_support_requests
    SET
      requested_supporter_id = v_next_supporter_id,
      attempt_count = v_request.attempt_count + 1,
      expires_at = now() + INTERVAL '15 minutes'
    WHERE id = p_request_id;
  ELSE
    -- No supporters available
    UPDATE live_support_requests
    SET status = 'no_supporters'
    WHERE id = p_request_id;
  END IF;

  RETURN v_next_supporter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION route_to_next_supporter(UUID) TO authenticated;
