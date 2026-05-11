CREATE TABLE IF NOT EXISTS public.project_expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  bezeichnung text NOT NULL,
  betrag numeric(10,2) NOT NULL DEFAULT 0,
  kategorie text,
  datum date NOT NULL DEFAULT CURRENT_DATE,
  rechnung_url text,
  rechnung_name text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users manage project expenses"
  ON public.project_expenses FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- Storage bucket for invoices (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('rechnungen', 'rechnungen', false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users upload rechnungen"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'rechnungen');

CREATE POLICY "Auth users read rechnungen"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'rechnungen');

CREATE POLICY "Auth users delete rechnungen"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'rechnungen');
