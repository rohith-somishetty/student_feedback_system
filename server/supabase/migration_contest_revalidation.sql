-- ============================================
-- MIGRATION: SIMPLE CONTEST & REVALIDATION
-- Prototype — no credibility math
-- ============================================

-- 1. Add new columns to issues (safe IF NOT EXISTS)
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS contested_flag BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contest_window_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revalidation_window_end TIMESTAMPTZ;

-- 2. Update status CHECK constraint to include new statuses
-- Must drop and recreate since Postgres doesn't support ALTER CHECK
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE issues ADD CONSTRAINT issues_status_check
  CHECK (status IN (
    'PENDING_APPROVAL', 'OPEN', 'IN_REVIEW', 'RESOLVED',
    'CONTESTED', 'REOPENED', 'REJECTED',
    'PENDING_REVALIDATION', 'RE_RESOLVED', 'FINAL_CLOSED'
  ));

-- 3. Drop old contests table and recreate simpler version
DROP TABLE IF EXISTS contests CASCADE;
CREATE TABLE contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

-- RLS for contests
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contests viewable by authenticated" ON contests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can insert contests" ON contests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Contests deletable by service" ON contests FOR DELETE TO authenticated USING (true);

-- 4. Create revalidation_votes table
CREATE TABLE IF NOT EXISTS revalidation_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('confirm', 'reject')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

-- RLS for revalidation_votes
ALTER TABLE revalidation_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes viewable by authenticated" ON revalidation_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can insert votes" ON revalidation_votes FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_issues_contested_flag ON issues(contested_flag);
CREATE INDEX IF NOT EXISTS idx_contests_issue ON contests(issue_id);
CREATE INDEX IF NOT EXISTS idx_revalidation_votes_issue ON revalidation_votes(issue_id);

-- 6. Create audit_logs if not exists (kept from previous migration)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id),
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- Drop policies first to avoid conflicts
DROP POLICY IF EXISTS "Audit logs viewable by admin only" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "Audit logs viewable by admin only" ON audit_logs FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'ADMIN'));
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
