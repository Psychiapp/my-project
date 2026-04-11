-- Migration: Add flags to track if session entered notifications have been sent
-- This prevents duplicate "joined the chat" notifications on component remounts

-- Add columns to track notification status for each participant
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS client_entered_notified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS supporter_entered_notified BOOLEAN NOT NULL DEFAULT false;

-- Add comments
COMMENT ON COLUMN sessions.client_entered_notified IS
'True when the client has entered the session and the supporter was notified';
COMMENT ON COLUMN sessions.supporter_entered_notified IS
'True when the supporter has entered the session and the client was notified';

-- Create index for potential queries filtering by notification status
CREATE INDEX IF NOT EXISTS idx_sessions_notification_status
ON sessions (id)
WHERE client_entered_notified = false OR supporter_entered_notified = false;
