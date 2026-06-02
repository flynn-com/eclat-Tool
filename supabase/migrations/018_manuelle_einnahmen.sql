CREATE TABLE IF NOT EXISTS public.manuelle_einnahmen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monat text NOT NULL,           -- 'YYYY-MM'
  bezeichnung text NOT NULL,
  betrag numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.manuelle_einnahmen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_manuelle_einnahmen"
  ON public.manuelle_einnahmen FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_manuelle_einnahmen_monat
  ON public.manuelle_einnahmen(monat);
