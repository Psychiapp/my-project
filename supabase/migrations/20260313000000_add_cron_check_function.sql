-- Temporary function to check cron job status (for verification)
-- Can be removed after launch verification

CREATE OR REPLACE FUNCTION public.get_cron_job_status()
RETURNS TABLE (
  jobid BIGINT,
  schedule TEXT,
  command TEXT,
  active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT j.jobid, j.schedule, j.command, j.active
  FROM cron.job j;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION public.get_cron_job_status() TO service_role;

-- Function to check last cron run
CREATE OR REPLACE FUNCTION public.get_last_cron_runs()
RETURNS TABLE (
  jobid BIGINT,
  status TEXT,
  return_message TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT jr.jobid, jr.status, jr.return_message, jr.start_time, jr.end_time
  FROM cron.job_run_details jr
  ORDER BY jr.start_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION public.get_last_cron_runs() TO service_role;
