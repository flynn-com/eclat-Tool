-- Agenda items for meetings (checkable points to discuss)
CREATE TABLE public.meeting_agenda (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_checked boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read meeting_agenda" ON public.meeting_agenda
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "All users can insert meeting_agenda" ON public.meeting_agenda
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "All users can update meeting_agenda" ON public.meeting_agenda
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "All users can delete meeting_agenda" ON public.meeting_agenda
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER meeting_agenda_updated_at BEFORE UPDATE ON public.meeting_agenda
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_meeting_agenda_meeting ON public.meeting_agenda(meeting_id, sort_order);

-- Realtime fuer kollaborative Updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_agenda;
