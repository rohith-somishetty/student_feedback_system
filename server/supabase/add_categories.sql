-- 1. Update CHECK constraint for categories
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_category_check;
ALTER TABLE issues ADD CONSTRAINT issues_category_check CHECK (category IN ('ACADEMICS', 'HOSTEL', 'INFRASTRUCTURE', 'HARASSMENT', 'ADMINISTRATION', 'CAREER_PLACEMENTS', 'DIGITAL_SERVICES', 'SPORTS_WELLNESS', 'FINANCIAL_SERVICES', 'TRANSPORTATION', 'OTHER'));

-- 2. Seed NEW departments
-- Note: Using standard IDs that match constants.ts for simplicity in this institutional setup
INSERT INTO departments (name, performance_score) VALUES
  ('Placement & Corporate Relations', 90),
  ('IT & Network Operations', 82),
  ('Physical Education & Sports', 87),
  ('Finance & Accounts', 84),
  ('Library Management', 89)
ON CONFLICT (name) DO UPDATE SET performance_score = EXCLUDED.performance_score;
