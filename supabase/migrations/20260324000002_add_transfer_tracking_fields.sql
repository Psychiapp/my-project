-- Add transfer tracking fields to sessions table
-- These fields track the deferred transfer to supporter after session completion

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS transfer_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transfer_failed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transfer_id TEXT,
ADD COLUMN IF NOT EXISTS transfer_amount INTEGER,
ADD COLUMN IF NOT EXISTS transfer_error TEXT;

-- Create index for finding sessions that need transfer processing
CREATE INDEX IF NOT EXISTS idx_sessions_transfer_pending
ON sessions (status, transfer_completed)
WHERE status = 'completed' AND transfer_completed = FALSE;

-- Create failed_transfers table for admin review
CREATE TABLE IF NOT EXISTS failed_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  payment_intent_id TEXT NOT NULL,
  supporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  supporter_stripe_account_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  error_message TEXT,
  error_code TEXT,
  reason TEXT NOT NULL, -- 'session_completed', 'no_refund_cancellation', 'partial_refund_retained'
  requires_admin_review BOOLEAN DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for finding unresolved failed transfers
CREATE INDEX IF NOT EXISTS idx_failed_transfers_unresolved
ON failed_transfers (requires_admin_review, created_at)
WHERE requires_admin_review = TRUE;

-- RLS policies for failed_transfers (admin only)
ALTER TABLE failed_transfers ENABLE ROW LEVEL SECURITY;

-- Only admins can view failed transfers
CREATE POLICY "Admins can view failed transfers"
ON failed_transfers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can update failed transfers (to mark as resolved)
CREATE POLICY "Admins can update failed transfers"
ON failed_transfers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add session_id column to payouts table if not exists (for linking transfers to sessions)
ALTER TABLE payouts
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index for finding payouts by session
CREATE INDEX IF NOT EXISTS idx_payouts_session_id
ON payouts (session_id)
WHERE session_id IS NOT NULL;
