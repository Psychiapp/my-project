-- Fix payout cron schedule to run daily
-- The function has logic to determine who should be paid based on their
-- payout_schedule setting (daily/weekly/monthly), so the cron needs to
-- run every day to support all schedule types.

-- Unschedule the current Monday-only job
SELECT cron.unschedule('process-scheduled-payouts');

-- Reschedule to run daily at 9 AM UTC
SELECT cron.schedule(
  'process-scheduled-payouts',
  '0 9 * * *',  -- Every day at 9 AM UTC
  'SELECT public.invoke_process_scheduled_payouts();'
);

COMMENT ON FUNCTION public.invoke_process_scheduled_payouts() IS
'Invokes the process-scheduled-payouts Edge Function daily at 9 AM UTC. The function determines which supporters should be paid based on their payout_schedule setting (daily, weekly on specific day, or monthly on specific date).';
