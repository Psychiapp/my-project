-- Migration: Auto-reset in_session flag when session ends
-- This trigger ensures the supporter's in_session flag is always reset
-- even if the app fails to do so (crash, navigation, network issues)

-- Function to reset in_session when session status changes to ended state
CREATE OR REPLACE FUNCTION reset_supporter_in_session_on_session_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when status changes to an ending state
  IF NEW.status IN ('completed', 'cancelled', 'no_show')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'cancelled', 'no_show')) THEN

    -- Reset the supporter's in_session flag
    UPDATE profiles
    SET in_session = false
    WHERE id = NEW.supporter_id;

    RAISE LOG 'Auto-reset in_session for supporter % due to session % ending with status %',
      NEW.supporter_id, NEW.id, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on sessions table
DROP TRIGGER IF EXISTS trigger_reset_in_session_on_session_end ON sessions;
CREATE TRIGGER trigger_reset_in_session_on_session_end
  AFTER UPDATE OF status ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION reset_supporter_in_session_on_session_end();

-- Also create trigger for INSERT (in case session is created with ending status)
DROP TRIGGER IF EXISTS trigger_reset_in_session_on_session_insert ON sessions;
CREATE TRIGGER trigger_reset_in_session_on_session_insert
  AFTER INSERT ON sessions
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'cancelled', 'no_show'))
  EXECUTE FUNCTION reset_supporter_in_session_on_session_end();

-- Add comment
COMMENT ON FUNCTION reset_supporter_in_session_on_session_end() IS
'Automatically resets the supporter''s in_session flag when a session ends.
This acts as a safety net in case the app fails to reset the flag.';

-- Also add a cleanup query to fix any currently stuck supporters
-- (supporters marked in_session=true but with no active sessions)
DO $$
DECLARE
  stuck_count INTEGER;
BEGIN
  WITH stuck_supporters AS (
    SELECT p.id
    FROM profiles p
    WHERE p.role = 'supporter'
      AND p.in_session = true
      AND NOT EXISTS (
        SELECT 1 FROM sessions s
        WHERE s.supporter_id = p.id
          AND s.status = 'in_progress'
      )
  )
  UPDATE profiles
  SET in_session = false
  WHERE id IN (SELECT id FROM stuck_supporters)
  RETURNING id INTO stuck_count;

  GET DIAGNOSTICS stuck_count = ROW_COUNT;

  IF stuck_count > 0 THEN
    RAISE NOTICE 'Fixed % supporters with stuck in_session flag', stuck_count;
  END IF;
END $$;
