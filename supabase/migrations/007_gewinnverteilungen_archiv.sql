-- Archive of completed profit distributions
create table public.gewinnverteilungen (
  id uuid primary key default uuid_generate_v4(),
  erstellt_von uuid not null references public.profiles(id) on delete set null,
  gesamtgewinn numeric not null,
  gewinn_nach_bonus numeric not null,
  gesamt_bonus numeric not null default 0,
  steuerruecklage numeric not null,
  verteilung_prozent jsonb not null,
  positionen jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.gewinnverteilungen enable row level security;

create policy "All users can read gewinnverteilungen"
  on public.gewinnverteilungen for select
  using (auth.uid() is not null);

create policy "Admins can insert gewinnverteilungen"
  on public.gewinnverteilungen for insert
  with check (public.is_admin());
