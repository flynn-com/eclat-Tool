ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Bestehende abgeschlossene Projekte: updated_at als Fallback
UPDATE public.projects
  SET completed_at = updated_at
  WHERE phase = 'abgeschlossen' AND completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_completed_at
  ON public.projects(completed_at) WHERE completed_at IS NOT NULL;
