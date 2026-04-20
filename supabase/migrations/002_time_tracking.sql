-- Project status enum
create type public.project_status as enum ('active', 'completed', 'archived');

-- Projects table
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  status project_status not null default 'active',
  color text not null default '#3B82F6',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- All authenticated users can read projects
create policy "All users can read projects"
  on public.projects for select
  using (auth.uid() is not null);

-- Only admins can insert projects
create policy "Admins can insert projects"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can update projects
create policy "Admins can update projects"
  on public.projects for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can delete projects
create policy "Admins can delete projects"
  on public.projects for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Updated_at trigger for projects
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at();

-- Time entries table
create table public.time_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  duration_minutes integer,
  is_manual boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.time_entries enable row level security;

-- All authenticated users can read all time entries (team overview)
create policy "All users can read time entries"
  on public.time_entries for select
  using (auth.uid() is not null);

-- Users can insert their own time entries
create policy "Users can insert own time entries"
  on public.time_entries for insert
  with check (auth.uid() = user_id);

-- Users can update their own entries, admins can update all
create policy "Users can update own time entries"
  on public.time_entries for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can delete their own entries, admins can delete all
create policy "Users can delete own time entries"
  on public.time_entries for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Updated_at trigger for time entries
create trigger time_entries_updated_at
  before update on public.time_entries
  for each row execute function public.update_updated_at();

-- Indexes for performance
create index idx_time_entries_user_start on public.time_entries (user_id, start_time desc);
create index idx_time_entries_project_start on public.time_entries (project_id, start_time desc);

-- Helper function: get monthly hours for a user
create or replace function public.get_monthly_hours(
  p_user_id uuid,
  p_year integer,
  p_month integer
)
returns numeric
language sql
stable
security definer
as $$
  select coalesce(
    sum(duration_minutes) / 60.0,
    0
  )
  from public.time_entries
  where user_id = p_user_id
    and end_time is not null
    and extract(year from start_time) = p_year
    and extract(month from start_time) = p_month;
$$;
