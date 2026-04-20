-- New settings for Monatsabrechnung
INSERT INTO public.app_settings (key, value, description) VALUES
(
  'monatsabrechnung',
  '{"steuerProzent": 15, "investProzent": 30, "anteileProzent": 35, "stundenProzent": 65, "stundenSatz": 20, "wiederholterBonusProzent": 1}',
  'Monatsabrechnung: Ruecklagen, Verteilung, Stundensatz'
)
ON CONFLICT (key) DO NOTHING;

-- Extend gewinnverteilungen for new format
ALTER TABLE public.gewinnverteilungen
  ADD COLUMN IF NOT EXISTS einnahmen numeric,
  ADD COLUMN IF NOT EXISTS ausgaben numeric,
  ADD COLUMN IF NOT EXISTS investruecklage numeric,
  ADD COLUMN IF NOT EXISTS abrechnungsgrundlage numeric,
  ADD COLUMN IF NOT EXISTS monat text;
