-- Add payment tracking columns to sessions table
-- These are needed to track Stripe payment intents for session bookings

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_sessions_payment_intent
ON sessions(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN sessions.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for this session booking';
COMMENT ON COLUMN sessions.payment_status IS 'Payment status: pending, completed, refunded, failed';
