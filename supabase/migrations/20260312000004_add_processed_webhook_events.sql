-- Migration: Add processed_webhook_events table for idempotency
-- Prevents duplicate processing when Stripe retries webhook delivery

CREATE TABLE IF NOT EXISTS processed_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by Stripe event ID
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_stripe_event_id
    ON processed_webhook_events(stripe_event_id);

-- Index for cleanup queries (delete old events)
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_processed_at
    ON processed_webhook_events(processed_at);

-- No RLS needed - this table is only accessed by service role from Edge Functions
-- Keep events for 30 days for debugging, then they can be cleaned up
COMMENT ON TABLE processed_webhook_events IS 'Tracks processed Stripe webhook events for idempotency. Events older than 30 days can be safely deleted.';
