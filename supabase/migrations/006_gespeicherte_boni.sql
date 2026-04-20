-- Saved bonuses from Vertriebsbonus-Rechner
-- Can be loaded in Gewinnverteilungs-Rechner
create table public.gespeicherte_boni (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  umsatz numeric not null,
  bonus numeric not null,
  verwendet boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.gespeicherte_boni enable row level security;

create policy "All users can read boni"
  on public.gespeicherte_boni for select
  using (auth.uid() is not null);

create policy "Admins can insert boni"
  on public.gespeicherte_boni for insert
  with check (public.is_admin());

create policy "Admins can update boni"
  on public.gespeicherte_boni for update
  using (public.is_admin());

create policy "Admins can delete boni"
  on public.gespeicherte_boni for delete
  using (public.is_admin());
