-- ============================================
-- NEXUS STUDENT ISSUE RESOLUTION PLATFORM
-- Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. DEPARTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
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
  department_id TEXT REFERENCES departments(id),
  roll_number TEXT,
  admin_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ISSUES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY DEFAULT 'iss-' || substr(md5(random()::text), 1, 8),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ACADEMICS', 'HOSTEL', 'INFRASTRUCTURE', 'HARASSMENT', 'ADMINISTRATION', 'OTHER')),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  department_id TEXT NOT NULL REFERENCES departments(id),
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CONTESTED', 'REOPENED', 'REJECTED')),
  urgency INTEGER NOT NULL CHECK (urgency IN (1, 2, 3, 5)),
  deadline TIMESTAMPTZ NOT NULL,
  priority_score REAL DEFAULT 0,
  evidence_url TEXT,
  resolution_evidence_url TEXT,
  support_count INTEGER DEFAULT 0,
  contest_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TIMELINE EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY DEFAULT 'tl-' || substr(md5(random()::text), 1, 8),
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('CREATED', 'STATUS_CHANGE', 'EVIDENCE_UPLOAD', 'CONTEST', 'ADMIN_UPDATE', 'SUPPORT', 'APPROVED', 'REJECTED')),
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. SUPPORTS TABLE (endorsements)
-- ============================================
CREATE TABLE IF NOT EXISTS supports (
  user_id UUID NOT NULL REFERENCES profiles(id),
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, issue_id)
);

-- ============================================
-- 6. COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY DEFAULT 'cmt-' || substr(md5(random()::text), 1, 8),
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. PROPOSALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY DEFAULT 'prp-' || substr(md5(random()::text), 1, 8),
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. FILE UPLOADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_department ON issues(department_id);
CREATE INDEX IF NOT EXISTS idx_issues_creator ON issues(creator_id);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_issue ON timeline_events(issue_id);
CREATE INDEX IF NOT EXISTS idx_comments_issue ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_supports_issue ON supports(issue_id);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Issues: all authenticated can read, students can create
CREATE POLICY "Issues are viewable by authenticated users"
  ON issues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create issues"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (true);

-- Timeline: all authenticated can read & insert
CREATE POLICY "Timeline viewable by authenticated users"
  ON timeline_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add timeline events"
  ON timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Supports: all authenticated can read & insert
CREATE POLICY "Supports viewable by authenticated users"
  ON supports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add supports"
  ON supports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Comments: all authenticated can read & insert
CREATE POLICY "Comments viewable by authenticated users"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Proposals: all authenticated can read & insert
CREATE POLICY "Proposals viewable by authenticated users"
  ON proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- File uploads: all authenticated can read & insert
CREATE POLICY "File uploads viewable by authenticated users"
  ON file_uploads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload files"
  ON file_uploads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Departments: all authenticated can read
CREATE POLICY "Departments viewable by authenticated users"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- SEED DATA
-- ============================================

-- Seed departments
INSERT INTO departments (id, name, performance_score) VALUES
  ('dept-1', 'Academic Affairs', 88),
  ('dept-2', 'Student Welfare', 92),
  ('dept-3', 'Infrastructure & Facilities', 75),
  ('dept-4', 'Health Services', 81),
  ('dept-5', 'Disciplinary Committee', 95),
  ('dept-6', 'General Administration', 85)
ON CONFLICT (id) DO NOTHING;
