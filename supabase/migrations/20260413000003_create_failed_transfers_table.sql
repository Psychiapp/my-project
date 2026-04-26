-- Create failed_transfers table (referenced in transfer-to-supporter but never created)
-- Drop first in case of partial prior run
DROP TABLE IF EXISTS failed_transfers;

CREATE TABLE failed_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  payment_intent_id TEXT NOT NULL,
  supporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  supporter_stripe_account_id TEXT,
  amount INTEGER NOT NULL,
  error_message TEXT,
  error_code TEXT,
  reason TEXT,
  requires_admin_review BOOLEAN DEFAULT true,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE failed_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage failed_transfers" ON failed_transfers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX idx_failed_transfers_review ON failed_transfers (requires_admin_review, resolved);
