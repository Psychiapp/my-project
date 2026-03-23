-- Migration: Recreate live_support_requests table (if not exists)
-- This migration ensures the table exists even if previous migration was marked as applied but failed

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS live_support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_supporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'phone', 'video')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'accepted',
    'declined',
    'expired',
    'cancelled',
    'completed',
    'no_supporters'
  )),
  payment_intent_id TEXT,
  charged_as_payg BOOLEAN NOT NULL DEFAULT false,
  amount_charged INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  decline_history JSONB DEFAULT '[]'::jsonb,
  attempt_count INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_live_support_requests_client
ON live_support_requests (client_id, status);

CREATE INDEX IF NOT EXISTS idx_live_support_requests_supporter
ON live_support_requests (requested_supporter_id, status);

CREATE INDEX IF NOT EXISTS idx_live_support_requests_expires
ON live_support_requests (expires_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_live_support_requests_created
ON live_support_requests (created_at DESC);

-- Enable realtime (ignore error if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE live_support_requests;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE live_support_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Clients can view own requests" ON live_support_requests;
DROP POLICY IF EXISTS "Supporters can view assigned requests" ON live_support_requests;
DROP POLICY IF EXISTS "Clients can create requests" ON live_support_requests;
DROP POLICY IF EXISTS "Supporters can respond to requests" ON live_support_requests;
DROP POLICY IF EXISTS "Clients can cancel pending requests" ON live_support_requests;
DROP POLICY IF EXISTS "Service role can manage requests" ON live_support_requests;

CREATE POLICY "Clients can view own requests"
ON live_support_requests FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Supporters can view assigned requests"
ON live_support_requests FOR SELECT
USING (auth.uid() = requested_supporter_id);

CREATE POLICY "Clients can create requests"
ON live_support_requests FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Supporters can respond to requests"
ON live_support_requests FOR UPDATE
USING (auth.uid() = requested_supporter_id);

CREATE POLICY "Clients can cancel pending requests"
ON live_support_requests FOR UPDATE
USING (auth.uid() = client_id AND status = 'pending')
WITH CHECK (status = 'cancelled');

CREATE POLICY "Service role can manage requests"
ON live_support_requests FOR ALL
USING (auth.role() = 'service_role');

-- Function to route request to next supporter
CREATE OR REPLACE FUNCTION route_to_next_supporter(p_request_id UUID)
RETURNS UUID AS $$
DECLARE
  v_request RECORD;
  v_exclude_ids UUID[];
  v_next_supporter_id UUID;
BEGIN
  SELECT * INTO v_request FROM live_support_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT ARRAY_AGG((elem->>'supporterId')::UUID)
  INTO v_exclude_ids
  FROM jsonb_array_elements(v_request.decline_history) AS elem;

  v_next_supporter_id := find_available_supporter(COALESCE(v_exclude_ids, '{}'::UUID[]));

  IF v_next_supporter_id IS NOT NULL THEN
    UPDATE live_support_requests
    SET
      requested_supporter_id = v_next_supporter_id,
      attempt_count = v_request.attempt_count + 1,
      expires_at = now() + INTERVAL '15 minutes'
    WHERE id = p_request_id;
  ELSE
    UPDATE live_support_requests
    SET status = 'no_supporters'
    WHERE id = p_request_id;
  END IF;

  RETURN v_next_supporter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION route_to_next_supporter(UUID) TO authenticated;
