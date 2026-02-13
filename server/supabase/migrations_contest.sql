-- ============================================
-- MIGRATION: CONTEST LIFECYCLE SYSTEM
-- ============================================

-- 1. Create Contests Table
-- References 'profiles' instead of 'users' based on schema.sql
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    credibility_stake INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

-- Enable RLS for Contests
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contests viewable by authenticated users"
  ON contests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create contests"
  ON contests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id),
    target_id TEXT, -- Can be issue_id or contest_id
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit logs viewable by admin only"
  ON audit_logs FOR SELECT TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'ADMIN'));
  
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);


-- 3. Update Issues Table with new columns
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS contest_window_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contest_weight INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reopen_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resolution_summary TEXT;


-- 4. RPC Function for Student Contest (Atomic Transaction)
-- Replaced 'users' with 'profiles' table usage
CREATE OR REPLACE FUNCTION contest_issue(
    p_issue_id TEXT,
    p_user_id UUID,
    p_reason TEXT,
    p_stake INTEGER,
    p_reopen_threshold INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_user_credibility INTEGER;
    v_issue_status TEXT;
    v_window_end TIMESTAMPTZ;
    v_new_weight INTEGER;
    v_university_penalty INTEGER := 10;
    v_student_bonus INTEGER := 5;
BEGIN
    -- 1. Lock User (Profile) and Issue rows
    SELECT credibility INTO v_user_credibility FROM profiles WHERE id = p_user_id FOR UPDATE;
    SELECT status, contest_window_end, contest_weight INTO v_issue_status, v_window_end, v_new_weight 
    FROM issues WHERE id = p_issue_id FOR UPDATE;

    -- 2. Validations
    IF v_issue_status NOT IN ('RESOLVED_PENDING_REVIEW', 'CONTESTED') THEN
        RETURN jsonb_build_object('error', 'Issue is not open for contest');
    END IF;

    IF NOW() > v_window_end THEN
        RETURN jsonb_build_object('error', 'Contest window has expired');
    END IF;

    IF v_user_credibility < p_stake THEN
        RETURN jsonb_build_object('error', 'Insufficient credibility points');
    END IF;

    -- 3. Process Contest
    -- Deduct stake from PROFILE
    UPDATE profiles SET credibility = credibility - p_stake WHERE id = p_user_id;

    -- Insert contest record
    INSERT INTO contests (issue_id, user_id, reason, credibility_stake)
    VALUES (p_issue_id, p_user_id, p_reason, p_stake);

    -- Recalculate weight
    v_new_weight := v_new_weight + p_stake;
    
    -- 4. Check Reopen Threshold
    IF v_new_weight >= p_reopen_threshold THEN
        -- AUTO REOPEN
        UPDATE issues 
        SET status = 'REOPENED',
            contest_weight = v_new_weight,
            reopen_count = reopen_count + 1
        WHERE id = p_issue_id;

        -- Refund stake + bonus to ALL contesters (update profiles)
        UPDATE profiles p
        SET credibility = p.credibility + c.credibility_stake + v_student_bonus
        FROM contests c
        WHERE c.user_id = p.id AND c.issue_id = p_issue_id;

        -- Log
        INSERT INTO audit_logs (action_type, target_id, details)
        VALUES ('AUTO_REOPEN', p_issue_id, jsonb_build_object('weight', v_new_weight, 'trigger_user', p_user_id));

        RETURN jsonb_build_object(
            'status', 'REOPENED',
            'message', 'Contest threshold reached. Issue automatically reopened.'
        );
    ELSE
        -- Update issue status to CONTESTED if it was pending
        UPDATE issues 
        SET status = 'CONTESTED',
            contest_weight = v_new_weight
        WHERE id = p_issue_id;

        -- Log
        INSERT INTO audit_logs (action_type, user_id, target_id, details)
        VALUES ('CONTEST_SUBMITTED', p_user_id, p_issue_id, jsonb_build_object('stake', p_stake));

        RETURN jsonb_build_object(
            'status', 'CONTESTED',
            'message', 'Contest submitted. Stake deducted.'
        );
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
