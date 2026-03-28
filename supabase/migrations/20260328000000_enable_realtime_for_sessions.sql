-- Enable realtime for sessions table
-- This allows real-time subscription to session status changes
-- so when one participant ends a session, the other is notified immediately

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
