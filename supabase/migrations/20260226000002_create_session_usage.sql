-- Migration: Create session_usage table for tracking per-billing-period usage
-- Purpose: Track session usage against weekly subscription allowances

CREATE TABLE IF NOT EXISTS session_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('chat', 'phone', 'video')),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  billing_period_start TIMESTAMPTZ NOT NULL,
  subscription_tier INTEGER NOT NULL CHECK (subscription_tier BETWEEN 0 AND 3),
  charged_as_payg BOOLEAN NOT NULL DEFAULT false,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_session_usage_client_period
ON session_usage (client_id, billing_period_start);

CREATE INDEX IF NOT EXISTS idx_session_usage_client_type_period
ON session_usage (client_id, session_type, billing_period_start);

-- Enable Row Level Security
ALTER TABLE session_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own session usage
CREATE POLICY "Users can view own session usage"
ON session_usage FOR SELECT
USING (auth.uid() = client_id);

-- Policy: Service role can manage all session usage
CREATE POLICY "Service role can manage session usage"
ON session_usage FOR ALL
USING (auth.role() = 'service_role');

-- Policy: Authenticated users can insert their own usage
CREATE POLICY "Users can insert own session usage"
ON session_usage FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Function to get current period usage summary
CREATE OR REPLACE FUNCTION get_current_period_usage(p_client_id UUID)
RETURNS TABLE (
  chat_count INTEGER,
  voice_video_count INTEGER,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ
) AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
BEGIN
  v_period_start := get_billing_period_start(p_client_id);

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN su.session_type = 'chat' THEN 1 ELSE 0 END)::INTEGER, 0) AS chat_count,
    COALESCE(SUM(CASE WHEN su.session_type IN ('phone', 'video') THEN 1 ELSE 0 END)::INTEGER, 0) AS voice_video_count,
    v_period_start AS billing_period_start,
    v_period_start + INTERVAL '7 days' AS billing_period_end
  FROM session_usage su
  WHERE su.client_id = p_client_id
    AND su.billing_period_start = v_period_start
    AND su.charged_as_payg = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_current_period_usage(UUID) TO authenticated;
