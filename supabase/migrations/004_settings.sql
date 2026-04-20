-- App Settings table (key-value with JSON values)
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

-- All authenticated users can read settings
create policy "All users can read settings"
  on public.app_settings for select
  using (auth.uid() is not null);

-- Only admins can modify settings
create policy "Admins can insert settings"
  on public.app_settings for insert
  with check (public.is_admin());

create policy "Admins can update settings"
  on public.app_settings for update
  using (public.is_admin());

-- Updated_at trigger
create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.update_updated_at();

-- Default values
insert into public.app_settings (key, value, description) values
(
  'gewinnverteilung',
  '{"gleich": 30, "stunden": 40, "steuer": 30}',
  'Gewinnverteilung in Prozent (muss 100 ergeben)'
),
(
  'vertrieb_staffeln',
  '[{"von": 0, "bis": 8000, "prozent": 5}, {"von": 8000, "bis": 20000, "prozent": 3}, {"von": 20000, "bis": 50000, "prozent": 2}, {"von": 50000, "bis": 200000, "prozent": 1}]',
  'Vertriebsbonus-Staffeln (Von, Bis in Euro, Prozent)'
);
