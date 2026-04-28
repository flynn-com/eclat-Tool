-- ========================================
-- Meetings + Meeting Tasks
-- ========================================

CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL DEFAULT 'Weekly Meeting',
  date date NOT NULL DEFAULT CURRENT_DATE,
  shared_notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read meetings" ON public.meetings
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "All users can insert meetings" ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "All users can update meetings" ON public.meetings
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "All users can delete meetings" ON public.meetings
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER meetings_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_meetings_date ON public.meetings(date DESC);

-- Meeting Tasks
CREATE TABLE public.meeting_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'offen',
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date date,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read meeting_tasks" ON public.meeting_tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "All users can insert meeting_tasks" ON public.meeting_tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "All users can update meeting_tasks" ON public.meeting_tasks
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "All users can delete meeting_tasks" ON public.meeting_tasks
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER meeting_tasks_updated_at BEFORE UPDATE ON public.meeting_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_meeting_tasks_meeting ON public.meeting_tasks(meeting_id);
CREATE INDEX idx_meeting_tasks_assignee ON public.meeting_tasks(assignee_id, status);

-- Enable realtime for meetings (live shared notes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
