-- Create user_reports table for handling user reports
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'inappropriate_content',
    'harassment',
    'spam',
    'unprofessional_behavior',
    'safety_concern',
    'other'
  )),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created ON user_reports(created_at DESC);

-- Enable RLS
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports
CREATE POLICY "Users can create reports"
  ON user_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON user_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON user_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update reports
CREATE POLICY "Admins can update reports"
  ON user_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_reports_updated_at
  BEFORE UPDATE ON user_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_user_reports_updated_at();

-- Grant permissions
GRANT ALL ON user_reports TO authenticated;
GRANT ALL ON user_reports TO service_role;
