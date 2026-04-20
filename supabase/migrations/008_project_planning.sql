-- ========================================
-- Medienproduktions-Planungstool
-- ========================================

-- New enums
CREATE TYPE public.project_phase AS ENUM (
  'planung', 'produktion', 'postproduktion', 'review', 'abgeschlossen'
);

CREATE TYPE public.campaign_type AS ENUM (
  'film', 'foto', 'social_media', 'animation', 'audio', 'mixed'
);

CREATE TYPE public.note_category AS ENUM (
  'brainstorming', 'moodboard', 'marktanalyse', 'strategie',
  'shooting_planung', 'storyboard_shotlist', 'produktion_notizen', 'sonstiges'
);

CREATE TYPE public.task_phase AS ENUM ('vorplanung', 'produktion', 'postproduktion');
CREATE TYPE public.task_status AS ENUM ('offen', 'in_arbeit', 'erledigt');

CREATE TYPE public.team_role AS ENUM (
  'projektleitung', 'kamera', 'regie', 'licht', 'ton',
  'editor', 'colorist', 'grafik', 'model_talent', 'sonstiges'
);

CREATE TYPE public.equipment_status AS ENUM (
  'geplant', 'bestaetigt', 'gepackt', 'vor_ort', 'zurueck'
);

-- ========================================
-- Extend projects table
-- ========================================
ALTER TABLE public.projects
  ADD COLUMN client_name text,
  ADD COLUMN campaign_type campaign_type,
  ADD COLUMN budget numeric(12,2),
  ADD COLUMN deadline date,
  ADD COLUMN phase project_phase NOT NULL DEFAULT 'planung',
  ADD COLUMN progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  ADD COLUMN briefing_description text;

-- ========================================
-- Project Notes
-- ========================================
CREATE TABLE public.project_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category note_category NOT NULL,
  title text,
  content text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read project_notes" ON public.project_notes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert project_notes" ON public.project_notes
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update project_notes" ON public.project_notes
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete project_notes" ON public.project_notes
  FOR DELETE USING (public.is_admin());

CREATE TRIGGER project_notes_updated_at BEFORE UPDATE ON public.project_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_project_notes_project_cat ON public.project_notes(project_id, category);

-- ========================================
-- Project Tasks
-- ========================================
CREATE TABLE public.project_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase task_phase NOT NULL,
  category text NOT NULL DEFAULT 'allgemein',
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'offen',
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignee_name text,
  due_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read project_tasks" ON public.project_tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert project_tasks" ON public.project_tasks
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update project_tasks" ON public.project_tasks
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete project_tasks" ON public.project_tasks
  FOR DELETE USING (public.is_admin());

CREATE TRIGGER project_tasks_updated_at BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_project_tasks_project ON public.project_tasks(project_id, phase, category);

-- ========================================
-- Project Team
-- ========================================
CREATE TABLE public.project_team (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  external_name text,
  external_contact text,
  role team_role NOT NULL DEFAULT 'sonstiges',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_member_identity CHECK (user_id IS NOT NULL OR external_name IS NOT NULL)
);

ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read project_team" ON public.project_team
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert project_team" ON public.project_team
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update project_team" ON public.project_team
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete project_team" ON public.project_team
  FOR DELETE USING (public.is_admin());

CREATE INDEX idx_project_team_project ON public.project_team(project_id);

-- ========================================
-- Project Equipment
-- ========================================
CREATE TABLE public.project_equipment (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  quantity integer NOT NULL DEFAULT 1,
  status equipment_status NOT NULL DEFAULT 'geplant',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read project_equipment" ON public.project_equipment
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert project_equipment" ON public.project_equipment
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update project_equipment" ON public.project_equipment
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete project_equipment" ON public.project_equipment
  FOR DELETE USING (public.is_admin());

CREATE TRIGGER project_equipment_updated_at BEFORE UPDATE ON public.project_equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_project_equipment_project ON public.project_equipment(project_id);

-- ========================================
-- Project Schedule
-- ========================================
CREATE TABLE public.project_schedule (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read project_schedule" ON public.project_schedule
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert project_schedule" ON public.project_schedule
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update project_schedule" ON public.project_schedule
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete project_schedule" ON public.project_schedule
  FOR DELETE USING (public.is_admin());

CREATE TRIGGER project_schedule_updated_at BEFORE UPDATE ON public.project_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_project_schedule_project ON public.project_schedule(project_id, date);
