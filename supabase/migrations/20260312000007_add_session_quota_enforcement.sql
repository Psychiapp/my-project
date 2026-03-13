-- Migration: Add server-side session quota enforcement
-- Purpose: Defense in depth - enforce quotas at database level even if frontend is bypassed

-- First, ensure the session_usage table exists
CREATE TABLE IF NOT EXISTS session_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own session usage" ON session_usage;
DROP POLICY IF EXISTS "Service role can manage session usage" ON session_usage;
DROP POLICY IF EXISTS "Users can insert own session usage" ON session_usage;

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

-- Function to get billing period start for a client (weekly billing periods)
CREATE OR REPLACE FUNCTION get_billing_period_start(p_client_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_subscription_started TIMESTAMPTZ;
  v_current_period_start TIMESTAMPTZ;
  v_weeks_elapsed INTEGER;
BEGIN
  -- Get subscription start date
  SELECT subscription_started_at INTO v_subscription_started
  FROM profiles
  WHERE id = p_client_id;

  -- If no subscription or no start date, use start of current week
  IF v_subscription_started IS NULL THEN
    -- Start of current week (Monday)
    RETURN date_trunc('week', now());
  END IF;

  -- Calculate how many weeks have elapsed since subscription started
  v_weeks_elapsed := EXTRACT(DAYS FROM (now() - v_subscription_started))::INTEGER / 7;

  -- Current billing period start
  v_current_period_start := v_subscription_started + (v_weeks_elapsed * INTERVAL '7 days');

  RETURN v_current_period_start;
END;
$$ LANGUAGE plpgsql STABLE;

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

-- Tier allowances per week (matching liveSupport.ts TIER_ALLOWANCES)
-- Tier 1 (basic): 1 voice/video + 2 chats
-- Tier 2 (standard): 2 voice/video + 3 chats
-- Tier 3 (premium): 3 voice/video + unlimited chats

-- Function to get tier allowances
CREATE OR REPLACE FUNCTION get_tier_allowances(p_tier INTEGER)
RETURNS TABLE (voice_video_allowed INTEGER, chat_allowed INTEGER) AS $$
BEGIN
  RETURN QUERY SELECT
    CASE p_tier
      WHEN 1 THEN 1
      WHEN 2 THEN 2
      WHEN 3 THEN 3
      ELSE 0
    END AS voice_video_allowed,
    CASE p_tier
      WHEN 1 THEN 2
      WHEN 2 THEN 3
      WHEN 3 THEN 999  -- Effectively unlimited
      ELSE 0
    END AS chat_allowed;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to map subscription tier string to number
CREATE OR REPLACE FUNCTION get_tier_number(p_tier_string TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE p_tier_string
    WHEN 'basic' THEN 1
    WHEN 'tier-1' THEN 1
    WHEN 'standard' THEN 2
    WHEN 'tier-2' THEN 2
    WHEN 'premium' THEN 3
    WHEN 'tier-3' THEN 3
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if a client has remaining allowance for a session type
-- Returns: remaining count (0 or negative if over quota, positive if has allowance)
CREATE OR REPLACE FUNCTION check_session_allowance(
  p_client_id UUID,
  p_session_type TEXT
)
RETURNS TABLE (
  has_allowance BOOLEAN,
  remaining INTEGER,
  subscription_tier INTEGER,
  requires_payg BOOLEAN
) AS $$
DECLARE
  v_tier INTEGER;
  v_tier_string TEXT;
  v_subscription_status TEXT;
  v_period_start TIMESTAMPTZ;
  v_current_usage INTEGER;
  v_allowed INTEGER;
BEGIN
  -- Get client's subscription tier and status
  SELECT subscription_tier, subscription_status
  INTO v_tier_string, v_subscription_status
  FROM profiles
  WHERE id = p_client_id;

  -- Map tier string to number
  v_tier := get_tier_number(COALESCE(v_tier_string, ''));

  -- If no active subscription, no allowance
  IF v_tier = 0 OR v_subscription_status IS DISTINCT FROM 'active' THEN
    RETURN QUERY SELECT false, 0, 0, true;
    RETURN;
  END IF;

  -- Get current billing period start
  v_period_start := get_billing_period_start(p_client_id);

  -- Count current period usage (excluding PAYG)
  IF p_session_type = 'chat' THEN
    SELECT COUNT(*)::INTEGER INTO v_current_usage
    FROM session_usage
    WHERE client_id = p_client_id
      AND session_type = 'chat'
      AND billing_period_start = v_period_start
      AND charged_as_payg = false;

    -- Get chat allowance for tier
    SELECT chat_allowed INTO v_allowed
    FROM get_tier_allowances(v_tier);
  ELSE
    -- voice/video share the same quota
    SELECT COUNT(*)::INTEGER INTO v_current_usage
    FROM session_usage
    WHERE client_id = p_client_id
      AND session_type IN ('phone', 'video')
      AND billing_period_start = v_period_start
      AND charged_as_payg = false;

    -- Get voice/video allowance for tier
    SELECT voice_video_allowed INTO v_allowed
    FROM get_tier_allowances(v_tier);
  END IF;

  -- Return result
  RETURN QUERY SELECT
    (v_current_usage < v_allowed) AS has_allowance,
    GREATEST(0, v_allowed - v_current_usage) AS remaining,
    v_tier AS subscription_tier,
    (v_current_usage >= v_allowed) AS requires_payg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate session booking (called by RPC from frontend as extra check)
-- This can be called before createSession to double-check allowance server-side
CREATE OR REPLACE FUNCTION validate_session_booking(
  p_client_id UUID,
  p_session_type TEXT,
  p_is_payg BOOLEAN DEFAULT false
)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT,
  remaining_allowance INTEGER
) AS $$
DECLARE
  v_allowance_check RECORD;
BEGIN
  -- Get current allowance status
  SELECT * INTO v_allowance_check
  FROM check_session_allowance(p_client_id, p_session_type);

  -- If PAYG, always allowed (payment will be validated by Stripe)
  IF p_is_payg THEN
    RETURN QUERY SELECT true, 'PAYG booking allowed'::TEXT, 0;
    RETURN;
  END IF;

  -- If has allowance, allowed
  IF v_allowance_check.has_allowance THEN
    RETURN QUERY SELECT true, 'Covered by subscription'::TEXT, v_allowance_check.remaining;
    RETURN;
  END IF;

  -- No allowance and not PAYG - reject
  RETURN QUERY SELECT
    false,
    'Session quota exceeded. Upgrade your plan or pay-as-you-go.'::TEXT,
    0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_billing_period_start(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_period_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tier_allowances(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tier_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_session_allowance(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_session_booking(UUID, TEXT, BOOLEAN) TO authenticated;

-- Trigger function to enforce quotas on session_usage insert
-- This prevents inserting a non-PAYG usage record if quota is exceeded
CREATE OR REPLACE FUNCTION enforce_session_quota()
RETURNS TRIGGER AS $$
DECLARE
  v_allowance_check RECORD;
BEGIN
  -- Skip check for PAYG sessions (they paid)
  IF NEW.charged_as_payg = true THEN
    RETURN NEW;
  END IF;

  -- Check if client has allowance
  SELECT * INTO v_allowance_check
  FROM check_session_allowance(NEW.client_id, NEW.session_type);

  -- If no allowance, reject the insert
  IF NOT v_allowance_check.has_allowance THEN
    RAISE EXCEPTION 'Session quota exceeded for this billing period. Remaining allowance: %. Please upgrade your plan or use pay-as-you-go.',
      v_allowance_check.remaining
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on session_usage to enforce quotas
DROP TRIGGER IF EXISTS enforce_session_quota_trigger ON session_usage;
CREATE TRIGGER enforce_session_quota_trigger
  BEFORE INSERT ON session_usage
  FOR EACH ROW
  EXECUTE FUNCTION enforce_session_quota();

-- Add comment explaining the enforcement
COMMENT ON FUNCTION check_session_allowance IS
'Checks if a client has remaining session allowance for a given session type based on their subscription tier and current period usage.';

COMMENT ON FUNCTION validate_session_booking IS
'Server-side validation for session booking. Call this before creating a session to verify quota compliance.';

COMMENT ON TRIGGER enforce_session_quota_trigger ON session_usage IS
'Prevents inserting session usage records that would exceed quota (unless marked as PAYG).';
