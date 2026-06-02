CREATE TABLE IF NOT EXISTS public.jahresziele (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jahr integer NOT NULL UNIQUE,
  umsatzziel numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.jahresziele ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_jahresziele"
  ON public.jahresziele FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
