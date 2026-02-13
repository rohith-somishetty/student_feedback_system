-- ============================================
-- SEED USERS (run AFTER creating auth users in Supabase dashboard)
-- ============================================
-- NOTE: You must first create users in the Supabase Auth dashboard or via the API.
-- Then insert their profiles here using the UUID from auth.users.
--
-- For development, create these users in Supabase Dashboard > Authentication > Users:
--   1. alex@student.edu / password: 000000 (min 6 chars for Supabase)
--   2. sarah@admin.edu / password: 000000
--   3. sam@student.edu / password: 000000
--   4. leadership@institution.edu / password: 000000
--
-- Then replace the UUIDs below with the actual UUIDs from Supabase:

-- INSERT INTO profiles (id, name, email, role, credibility, roll_number, admin_id, department_id) VALUES
--   ('<alex-uuid>', 'Alex Johnson', 'alex@student.edu', 'STUDENT', 72, '123456789012', NULL, NULL),
--   ('<sarah-uuid>', 'Sarah Chen', 'sarah@admin.edu', 'ADMIN', 100, NULL, 'ADM001', 'dept-1'),
--   ('<sam-uuid>', 'Sam Rivera', 'sam@student.edu', 'STUDENT', 85, '987654321098', NULL, NULL),
--   ('<leadership-uuid>', 'Leadership Council', 'leadership@institution.edu', 'SUPER_ADMIN', 100, NULL, 'SA001', NULL);

-- ============================================
-- ALTERNATIVE: Auto-create profile on signup via trigger
-- ============================================
-- This trigger automatically creates a profile when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, credibility)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT'),
    50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
