-- Migration: Schedule weekly call allowance reset cron job
-- Runs every Monday at 00:00 UTC to reset phone/video allowances
-- Note: pg_cron extension is already enabled in this Supabase project

-- Create the cron job to reset weekly call allowances
-- Schedule: Every Monday at midnight UTC
SELECT cron.schedule(
  'reset-weekly-call-allowances',  -- job name
  '0 0 * * 1',                      -- cron expression: minute hour day month weekday
  $$SELECT reset_weekly_call_allowances()$$
);

-- Log that the cron job was created
DO $$
BEGIN
  RAISE LOG 'Created cron job "reset-weekly-call-allowances" to run every Monday at 00:00 UTC';
END $$;
