-- Add service role key to vault for pg_cron edge function invocation
-- The actual key must be set MANUALLY via the Supabase Dashboard after deployment.
-- NEVER hardcode the service role key here — it would be committed to git.
--
-- To set this up after a fresh deploy:
--   1. Go to Supabase Dashboard → Settings → API → copy the service_role key
--   2. Run in SQL editor:
--      SELECT vault.create_secret(
--        '<your-service-role-key>',
--        'service_role_key',
--        'Service role key for invoking edge functions from pg_cron'
--      );
--
-- This migration intentionally does NOT insert the key.
-- The live key was previously hardcoded here (security issue — now removed).
-- If upgrading from an existing deployment, update the vault entry:
--   SELECT vault.update_secret(id, '<new-key>')
--   FROM vault.secrets WHERE name = 'service_role_key';

SELECT 1; -- no-op placeholder so this migration applies cleanly
