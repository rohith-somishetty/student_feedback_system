-- ============================================
-- NEXUS STUDENT ISSUE RESOLUTION PLATFORM
-- Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. DEPARTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  performance_score INTEGER DEFAULT 85,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'ADMIN')),
  credibility INTEGER DEFAULT 50 CHECK (credibility >= 0 AND credibility <= 100),
  department_id UUID REFERENCES departments(id),
  roll_number TEXT,
  admin_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ISSUES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ACADEMICS', 'HOSTEL', 'INFRASTRUCTURE', 'HARASSMENT', 'ADMINISTRATION', 'OTHER')),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CONTESTED', 'REOPENED', 'REJECTED', 'PENDING_REVALIDATION', 'RE_RESOLVED', 'FINAL_CLOSED')),
  urgency INTEGER NOT NULL CHECK (urgency IN (1, 2, 3, 5)),
  deadline TIMESTAMPTZ NOT NULL,
  priority_score REAL DEFAULT 0,
  priority_index REAL DEFAULT 0,
  evidence_url TEXT,
  resolution_evidence_url TEXT,
  resolution_summary TEXT,
  support_count INTEGER DEFAULT 0,
  contest_count INTEGER DEFAULT 0,
  contested_flag BOOLEAN DEFAULT FALSE,
  contest_window_end TIMESTAMPTZ,
  revalidation_window_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TIMELINE EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. SUPPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS supports (
  user_id UUID NOT NULL REFERENCES profiles(id),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, issue_id)
);

-- ============================================
-- 6. COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. PROPOSALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. CONTESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

-- ============================================
-- 9. REVALIDATION VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS revalidation_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('confirm', 'reject')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_department ON issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_creator ON issues(creator_id);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority_score DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE revalidation_votes ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Issues
CREATE POLICY "Issues are viewable by authenticated users" ON issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can create issues" ON issues FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Admins can update all issues" ON issues FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Creators can update own pending issues" ON issues FOR UPDATE TO authenticated USING (
    auth.uid() = creator_id AND status = 'PENDING_APPROVAL'
);

-- 3. Timeline
CREATE POLICY "Timeline is viewable by all" ON timeline_events FOR SELECT USING (true);
CREATE POLICY "System/Authenticated can insert timeline" ON timeline_events FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Supports
CREATE POLICY "Supports are viewable by all" ON supports FOR SELECT USING (true);
CREATE POLICY "Users can support once" ON supports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. Comments
CREATE POLICY "Comments are viewable by all" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. Contests
CREATE POLICY "Contests are viewable by all" ON contests FOR SELECT USING (true);
CREATE POLICY "Students can contest" ON contests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 7. Revalidation Votes
CREATE POLICY "Votes are viewable by all" ON revalidation_votes FOR SELECT USING (true);
CREATE POLICY "Students can vote" ON revalidation_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 8. Departments
CREATE POLICY "Departments are viewable by all" ON departments FOR SELECT USING (true);

-- ============================================
-- SEED DATA
-- ============================================

-- Seed departments
INSERT INTO departments (name, performance_score) VALUES
  ('Academic Affairs', 88),
  ('Student Welfare', 92),
  ('Infrastructure & Facilities', 75),
  ('Health Services', 81),
  ('Disciplinary Committee', 95),
  ('General Administration', 85)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Atomic function to support an issue and recalculate priority
CREATE OR REPLACE FUNCTION support_issue(p_issue_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_user_role TEXT;
    v_issue_status TEXT;
    v_urgency INTEGER;
    v_total_credibility NUMERIC;
    v_new_priority_index NUMERIC;
BEGIN
    -- 1. Check user role
    SELECT role INTO v_user_role FROM profiles WHERE id = p_user_id;
    IF v_user_role != 'STUDENT' THEN
        RETURN json_build_object('error', 'Only students can support issues', 'status', 403);
    END IF;

    -- 2. Check issue status and existence
    SELECT status, urgency INTO v_issue_status, v_urgency FROM issues WHERE id = p_issue_id;
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Issue not found', 'status', 404);
    END IF;

    -- Escalated issues: IN_REVIEW, CONTESTED
    -- Closed issues: RESOLVED, REJECTED
    IF v_issue_status IN ('RESOLVED', 'REJECTED', 'IN_REVIEW', 'CONTESTED') THEN
        RETURN json_build_object('error', 'Cannot support a closed or escalated issue', 'status', 400);
    END IF;

    -- 3. Check for existing support
    IF EXISTS (SELECT 1 FROM supports WHERE user_id = p_user_id AND issue_id = p_issue_id) THEN
        RETURN json_build_object('error', 'Already supported this issue', 'status', 409);
    END IF;

    -- 4. Insert support record
    INSERT INTO supports (user_id, issue_id) VALUES (p_user_id, p_issue_id);

    -- 5. Update support count
    UPDATE issues SET support_count = support_count + 1 WHERE id = p_issue_id;

    -- 6. Recalculate priority_index for THIS issue
    SELECT SUM(p.credibility) INTO v_total_credibility
    FROM supports s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.issue_id = p_issue_id;

    UPDATE issues 
    SET priority_index = (v_total_credibility * urgency) / (1 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)
    WHERE id = p_issue_id
    RETURNING priority_index INTO v_new_priority_index;

    -- 7. Log timeline event
    INSERT INTO timeline_events (issue_id, type, user_id, user_name, description)
    VALUES (p_issue_id, 'SUPPORT', p_user_id, 'Anonymous Student', 'Supported this issue');

    RETURN json_build_object(
        'message', 'Issue supported successfully',
        'support_count', (SELECT support_count FROM issues WHERE id = p_issue_id),
        'priority_index', v_new_priority_index
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
