-- Fix: Infinite recursion in RLS policies
-- The admin policies on profiles query profiles itself, causing recursion.
-- Solution: Create a security definer function that bypasses RLS.

-- Helper function to check admin role (bypasses RLS)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =====================
-- Fix profiles policies
-- =====================
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

-- Admins can read all profiles (using function instead of subquery)
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Users can update own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can update all profiles
create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- =====================
-- Fix projects policies
-- =====================
drop policy if exists "Admins can insert projects" on public.projects;
drop policy if exists "Admins can update projects" on public.projects;
drop policy if exists "Admins can delete projects" on public.projects;

create policy "Admins can insert projects"
  on public.projects for insert
  with check (public.is_admin());

create policy "Admins can update projects"
  on public.projects for update
  using (public.is_admin());

create policy "Admins can delete projects"
  on public.projects for delete
  using (public.is_admin());

-- ========================
-- Fix time_entries policies
-- ========================
drop policy if exists "Users can update own time entries" on public.time_entries;
drop policy if exists "Users can delete own time entries" on public.time_entries;

create policy "Users can update own time entries"
  on public.time_entries for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can delete own time entries"
  on public.time_entries for delete
  using (auth.uid() = user_id or public.is_admin());
