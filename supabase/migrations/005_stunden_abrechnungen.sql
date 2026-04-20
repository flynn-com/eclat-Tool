-- Tracks hours used in profit distribution calculations
-- When hours are "used" in a Gewinnverteilung, they get deducted from the user's account
create table public.stunden_abrechnungen (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stunden numeric not null,
  beschreibung text,
  created_at timestamptz not null default now()
);

alter table public.stunden_abrechnungen enable row level security;

-- All authenticated users can read
create policy "All users can read stunden_abrechnungen"
  on public.stunden_abrechnungen for select
  using (auth.uid() is not null);

-- Only admins can insert (only through Gewinnverteilung)
create policy "Admins can insert stunden_abrechnungen"
  on public.stunden_abrechnungen for insert
  with check (public.is_admin());

-- Only admins can delete
create policy "Admins can delete stunden_abrechnungen"
  on public.stunden_abrechnungen for delete
  using (public.is_admin());
