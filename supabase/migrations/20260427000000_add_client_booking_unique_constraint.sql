-- Prevent clients from double-booking the same time slot
-- (existing constraint only covers supporters)

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_no_client_double_booking
  ON sessions (client_id, scheduled_at)
  WHERE status NOT IN ('cancelled', 'no_show');

COMMENT ON INDEX idx_sessions_no_client_double_booking IS
  'Prevents a client from booking two active sessions at the same time.
   Cancelled/no-show sessions are excluded so the slot can be re-booked.';
