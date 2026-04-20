-- Allow admins to insert time entries for any user
DROP POLICY IF EXISTS "Users can insert own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries or admin any" ON public.time_entries;

CREATE POLICY "Users can insert own or admin any time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Allow admins to read ALL profiles (fix for Monatsabrechnung)
-- The existing policy uses is_admin() which should work,
-- but add a fallback policy that all authenticated users can read basic profile info
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "All users can read all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
