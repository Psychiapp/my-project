-- Add service role key to vault for pg_cron edge function invocation
-- This migration adds the service role key so the cleanup job can authenticate

SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vY2tpcGFma3ZnYXJsZHBnemFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzMyODU1OCwiZXhwIjoyMDgyOTA0NTU4fQ.JrJ9SpYuD2S4albBz2iXpX5jNdBYbJe67keB241RaQw',
  'service_role_key',
  'Service role key for invoking edge functions from pg_cron'
);
