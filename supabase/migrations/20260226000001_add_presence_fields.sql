-- Migration: Add presence and live support fields to profiles table
-- Purpose: Track supporter online status, session state, and live support availability

-- Add presence tracking columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS in_session BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_for_live_support BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Index for efficiently finding available supporters
CREATE INDEX IF NOT EXISTS idx_profiles_live_support_availability
ON profiles (is_online, in_session, available_for_live_support)
WHERE role = 'supporter';

-- Index for last_seen cleanup queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles (last_seen);

-- Function to update heartbeat (called every 60 seconds by active users)
CREATE OR REPLACE FUNCTION update_heartbeat(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET is_online = true, last_seen = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get billing period start (weekly, from subscription start date)
CREATE OR REPLACE FUNCTION get_billing_period_start(p_client_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_subscription_start TIMESTAMPTZ;
  v_weeks_since_start INTEGER;
BEGIN
  SELECT COALESCE(subscription_started_at, created_at) INTO v_subscription_start
  FROM profiles WHERE id = p_client_id;

  IF v_subscription_start IS NULL THEN
    v_subscription_start := now();
  END IF;

  v_weeks_since_start := FLOOR(EXTRACT(EPOCH FROM (now() - v_subscription_start)) / 604800);
  RETURN v_subscription_start + (v_weeks_since_start * INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find an available supporter
CREATE OR REPLACE FUNCTION find_available_supporter(p_exclude_ids UUID[] DEFAULT '{}'::UUID[])
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM profiles
    WHERE role = 'supporter'
      AND is_online = true
      AND in_session = false
      AND available_for_live_support = true
      AND id != ALL(COALESCE(p_exclude_ids, '{}'::UUID[]))
    ORDER BY last_seen DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup stale presence (users offline if last_seen > 90 seconds ago)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE profiles SET is_online = false
  WHERE is_online = true AND last_seen < now() - INTERVAL '90 seconds';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_heartbeat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_billing_period_start(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION find_available_supporter(UUID[]) TO authenticated;
