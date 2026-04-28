-- Performance-Indexes fuer schnellere Queries

-- time_entries: Schneller fuer aktive Timer-Pruefung
CREATE INDEX IF NOT EXISTS idx_time_entries_active
  ON public.time_entries(user_id) WHERE end_time IS NULL;

-- stunden_abrechnungen: Critical fuer Stundenkonto-Berechnung
CREATE INDEX IF NOT EXISTS idx_stunden_abrechnungen_user
  ON public.stunden_abrechnungen(user_id);

CREATE INDEX IF NOT EXISTS idx_stunden_abrechnungen_created
  ON public.stunden_abrechnungen(created_at DESC);

-- project_tasks: Dashboard-Queries
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee_status
  ON public.project_tasks(assignee_id, status);

CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date
  ON public.project_tasks(due_date) WHERE due_date IS NOT NULL;

-- meeting_tasks: Faelligkeits-Sortierung
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_due_date
  ON public.meeting_tasks(due_date) WHERE due_date IS NOT NULL;

-- gewinnverteilungen: Archiv-Sortierung
CREATE INDEX IF NOT EXISTS idx_gewinnverteilungen_created
  ON public.gewinnverteilungen(created_at DESC);

-- gespeicherte_boni: Verwendet-Filter
CREATE INDEX IF NOT EXISTS idx_gespeicherte_boni_user_verwendet
  ON public.gespeicherte_boni(user_id, verwendet);

-- projects: Status-Filter
CREATE INDEX IF NOT EXISTS idx_projects_status_phase
  ON public.projects(status, phase);
