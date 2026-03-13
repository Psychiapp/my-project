-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role (required for pg_cron)
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a function to call the cleanup edge function
-- This function retrieves the service role key from vault and makes the HTTP request
CREATE OR REPLACE FUNCTION public.invoke_cleanup_stale_sessions()
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
    RAISE WARNING 'service_role_key not found in vault. Please add it using: SELECT vault.create_secret(''your-service-role-key'', ''service_role_key'');';
    RETURN;
  END IF;

  -- Call the edge function using pg_net
  PERFORM net.http_post(
    url := project_url || '/functions/v1/cleanup-stale-sessions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );

  RAISE NOTICE 'Cleanup stale sessions function invoked';
END;
$$;

-- Schedule the cleanup job to run every 15 minutes
-- Cron expression: minute hour day month day-of-week
SELECT cron.schedule(
  'cleanup-stale-sessions',           -- job name
  '*/15 * * * *',                     -- every 15 minutes
  'SELECT public.invoke_cleanup_stale_sessions();'
);

-- Add a comment explaining the job
COMMENT ON FUNCTION public.invoke_cleanup_stale_sessions() IS
'Invokes the cleanup-stale-sessions Edge Function to mark stale in_progress sessions as completed and no-show sessions. Requires service_role_key in vault.';

-- IMPORTANT: After running this migration, you must add your service role key to the vault:
--
-- Run this SQL in the Supabase SQL Editor (replace with your actual key):
--
--   SELECT vault.create_secret(
--     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key-here',
--     'service_role_key',
--     'Service role key for invoking edge functions from pg_cron'
--   );
--
-- You can find your service role key in:
-- Supabase Dashboard > Project Settings > API > service_role key
