-- Fix the process-scheduled-payouts cron job
-- The old job was failing due to:
-- 1. Wrong URL (missing 'd' in project ref)
-- 2. Using current_setting('app.settings.service_role_key') which doesn't exist
--
-- This migration:
-- 1. Removes the old broken cron job
-- 2. Creates a new function that uses vault for the service role key
-- 3. Schedules a new cron job using the fixed function

-- First, unschedule the old broken job (job ID 1)
-- Using a DO block to handle the case where the job might not exist
DO $$
BEGIN
  -- Try to unschedule by job ID
  PERFORM cron.unschedule(1);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Job ID 1 not found or already removed: %', SQLERRM;
END $$;

-- Create a function to call the process-scheduled-payouts edge function
-- Uses vault for secure service role key storage (same pattern as cleanup-stale-sessions)
CREATE OR REPLACE FUNCTION public.invoke_process_scheduled_payouts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key TEXT;
  project_url TEXT := 'https://oockipafkvgarldpgzac.supabase.co';
BEGIN
  -- Get the service role key from vault
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF service_role_key IS NULL THEN
    RAISE WARNING 'service_role_key not found in vault. Cannot process scheduled payouts.';
    RETURN;
  END IF;

  -- Call the edge function using pg_net
  PERFORM net.http_post(
    url := project_url || '/functions/v1/process-scheduled-payouts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{"action": "process_all_payouts"}'::jsonb
  );

  RAISE NOTICE 'Process scheduled payouts function invoked';
END;
$$;

-- Schedule the payout job to run every Monday at 9 AM UTC
-- This matches the original schedule: 0 9 * * 1
SELECT cron.schedule(
  'process-scheduled-payouts',          -- job name
  '0 9 * * 1',                          -- every Monday at 9 AM UTC
  'SELECT public.invoke_process_scheduled_payouts();'
);

-- Add a comment explaining the job
COMMENT ON FUNCTION public.invoke_process_scheduled_payouts() IS
'Invokes the process-scheduled-payouts Edge Function to automatically process supporter payouts based on their configured schedule (daily/weekly/monthly). Requires service_role_key in vault.';
