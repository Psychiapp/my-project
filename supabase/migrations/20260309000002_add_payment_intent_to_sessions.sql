-- Add stripe_payment_intent_id to sessions table for refund tracking
-- This column stores the Stripe payment intent ID so refunds can be processed

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Index for looking up sessions by payment intent (useful for webhooks)
CREATE INDEX IF NOT EXISTS idx_sessions_payment_intent
ON sessions (stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN sessions.stripe_payment_intent_id IS 'Stripe Payment Intent ID for processing refunds';
