-- Create client_assignments table for supporter-client matching
-- This table tracks which supporter is assigned to which client

CREATE TABLE IF NOT EXISTS client_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_session_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each client can only have one active assignment at a time
  CONSTRAINT unique_active_client_assignment UNIQUE (client_id, status)
    DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for efficient querying
CREATE INDEX idx_client_assignments_client_id ON client_assignments(client_id);
CREATE INDEX idx_client_assignments_supporter_id ON client_assignments(supporter_id);
CREATE INDEX idx_client_assignments_status ON client_assignments(status);

-- Enable RLS
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
-- Clients can view their own assignments
CREATE POLICY "Clients can view own assignments"
  ON client_assignments FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Supporters can view assignments where they are the supporter
CREATE POLICY "Supporters can view their client assignments"
  ON client_assignments FOR SELECT
  TO authenticated
  USING (supporter_id = auth.uid());

-- Admins can do everything (assuming admin role check via profiles)
CREATE POLICY "Admins can manage all assignments"
  ON client_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow authenticated users to insert (for matching flow)
CREATE POLICY "Allow assignment creation"
  ON client_assignments FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

-- Allow updates to own assignments
CREATE POLICY "Clients can update own assignments"
  ON client_assignments FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid());

-- Comment
COMMENT ON TABLE client_assignments IS 'Tracks supporter-client pairings for the matching system';
