-- ============================================================================
-- COMMUNITY REPORTS SYSTEM
-- ============================================================================
-- This migration adds support for users to report inappropriate content
-- (posts, answers, comments) and for admins to review and action reports.
-- ============================================================================

-- Create community_reports table
CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reporter_name TEXT,
  reported_content_type TEXT NOT NULL CHECK (reported_content_type IN ('post', 'answer', 'comment')),
  reported_content_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_content ON community_reports(reported_content_type, reported_content_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON community_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON community_reports(created_at DESC);

-- Prevent duplicate reports (same user reporting same content while pending)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_report
  ON community_reports(reporter_id, reported_content_type, reported_content_id)
  WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert their own reports
CREATE POLICY "Users can create reports" ON community_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- RLS Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports" ON community_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- RLS Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports" ON community_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policy: Admins can update all reports
CREATE POLICY "Admins can update all reports" ON community_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policy: Admins can delete reports
CREATE POLICY "Admins can delete reports" ON community_reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_community_reports_updated_at
  BEFORE UPDATE ON community_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_community_reports_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration to verify)
-- ============================================================================

-- Verify table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables
--   WHERE table_name = 'community_reports'
-- );

-- Verify indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'community_reports';

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'community_reports';

-- View all policies
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'community_reports';
