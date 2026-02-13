-- ============================================
-- MIGRATION: UPDATE STATUS CHECK CONSTRAINT
-- ============================================

-- Drop the old constraint
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_status_check;

-- Add the new constraint with ALL relevant statuses
ALTER TABLE issues ADD CONSTRAINT issues_status_check 
CHECK (status IN (
    'PENDING_APPROVAL', 
    'OPEN', 
    'IN_REVIEW', 
    'RESOLVED', 
    'RESOLVED_PENDING_REVIEW', -- New
    'CONTESTED',               -- New
    'REOPENED',                -- New (was in old list?)
    'RE_RESOLVED',             -- New
    'FINAL_CLOSED',            -- New
    'REJECTED'
));

-- Verify
-- SELECT status FROM issues; -- Should work
