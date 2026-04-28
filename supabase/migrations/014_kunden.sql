-- Kundendatenbank
CREATE TYPE public.kunde_status AS ENUM ('aktiv', 'inaktiv', 'lead');

CREATE TABLE public.kunden (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  firma text NOT NULL,
  ansprechpartner text,
  email text,
  telefon text,
  webseite text,
  strasse text,
  plz text,
  stadt text,
  land text DEFAULT 'Deutschland',
  ust_id text,
  branche text,
  notizen text,
  status kunde_status NOT NULL DEFAULT 'aktiv',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kunden ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read kunden" ON public.kunden FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "All users can insert kunden" ON public.kunden FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "All users can update kunden" ON public.kunden FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "All users can delete kunden" ON public.kunden FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER kunden_updated_at BEFORE UPDATE ON public.kunden
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_kunden_status ON public.kunden(status);
CREATE INDEX idx_kunden_firma ON public.kunden(firma);

-- Projekte mit Kunden verknuepfen
ALTER TABLE public.projects ADD COLUMN kunde_id uuid REFERENCES public.kunden(id) ON DELETE SET NULL;
CREATE INDEX idx_projects_kunde ON public.projects(kunde_id);
