-- Migration: Add weekly reset tracking for call allowances
-- Calls (phone/video) reset weekly, chats reset monthly (with subscription renewal)

-- Add column to track when calls were last reset
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS last_weekly_calls_reset TIMESTAMPTZ DEFAULT now();

-- Add comment explaining the reset schedule
COMMENT ON COLUMN subscriptions.last_weekly_calls_reset IS
'Timestamp of when phone/video allowances were last reset. Resets weekly.';

-- Create function to reset weekly call allowances
CREATE OR REPLACE FUNCTION reset_weekly_call_allowances()
RETURNS void AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Reset phone/video allowances based on tier
  -- Only reset if it's been more than 6 days since last reset (prevent double-reset)
  WITH updated AS (
    UPDATE subscriptions
    SET
      sessions_remaining = jsonb_set(
        jsonb_set(
          sessions_remaining,
          '{phone}',
          CASE tier
            WHEN 'basic' THEN '1'::jsonb
            WHEN 'standard' THEN '2'::jsonb
            WHEN 'premium' THEN '3'::jsonb
            ELSE '0'::jsonb
          END
        ),
        '{video}',
        '0'::jsonb  -- video shares quota with phone, tracked separately if needed
      ),
      last_weekly_calls_reset = now(),
      updated_at = now()
    WHERE status = 'active'
      AND (
        last_weekly_calls_reset IS NULL
        OR last_weekly_calls_reset < now() - interval '6 days'
      )
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;

  RAISE LOG 'Weekly call reset: Updated % active subscriptions', v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION reset_weekly_call_allowances() IS
'Resets phone/video session allowances to tier defaults. Called by weekly cron job.
Basic: 1 call/week, Standard: 2 calls/week, Premium: 3 calls/week.
Chat allowances are NOT reset here - they reset monthly with subscription renewal.';

-- Create helper function to get tier allowances (for consistency)
CREATE OR REPLACE FUNCTION get_tier_allowances(p_tier TEXT)
RETURNS TABLE (
  weekly_calls INTEGER,
  monthly_chats INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE p_tier
      WHEN 'basic' THEN 1
      WHEN 'standard' THEN 2
      WHEN 'premium' THEN 3
      ELSE 0
    END AS weekly_calls,
    CASE p_tier
      WHEN 'basic' THEN 2
      WHEN 'standard' THEN 3
      WHEN 'premium' THEN 999  -- unlimited
      ELSE 0
    END AS monthly_chats;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_tier_allowances(TEXT) IS
'Returns the weekly call and monthly chat allowances for a subscription tier.
Basic ($55/mo): 1 call/week, 2 chats/month
Standard ($109/mo): 2 calls/week, 3 chats/month
Premium ($149/mo): 3 calls/week, unlimited chats';

-- Initialize last_weekly_calls_reset for existing subscriptions
UPDATE subscriptions
SET last_weekly_calls_reset = created_at
WHERE last_weekly_calls_reset IS NULL;
