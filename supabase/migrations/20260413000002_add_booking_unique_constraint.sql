-- Prevent double-booking: unique constraint on (supporter_id, scheduled_at)
-- Only applies to non-cancelled sessions so cancellations free up the slot.

-- First, resolve any existing duplicate bookings by cancelling the newer duplicate.
-- Keep the earliest-created session for each (supporter_id, scheduled_at) pair.
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY supporter_id, scheduled_at
      ORDER BY created_at ASC
    ) AS rn
  FROM sessions
  WHERE status NOT IN ('cancelled', 'no_show')
)
UPDATE sessions
SET status = 'cancelled'
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_no_double_booking
  ON sessions (supporter_id, scheduled_at)
  WHERE status NOT IN ('cancelled', 'no_show');

COMMENT ON INDEX idx_sessions_no_double_booking IS
  'Prevents two active sessions for the same supporter at the same time.
   Cancelled/no-show sessions are excluded so the slot can be re-booked.';
