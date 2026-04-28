import { createClient } from '@/lib/supabase/server';
import { AufgabenUebersicht, type UnifiedTask } from '@/components/aufgaben/aufgaben-uebersicht';

export default async function AufgabenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: meetingTasks },
    { data: projectTasks },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from('meeting_tasks')
      .select('id, title, status, assignee_id, due_date, meeting_id, meetings(id, name, date)')
      .order('created_at', { ascending: false }),
    supabase
      .from('project_tasks')
      .select('id, title, status, assignee_id, due_date, phase, project_id, projects(id, name, color)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name'),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const unified: UnifiedTask[] = [];

  for (const t of (meetingTasks ?? [])) {
    const meeting = t.meetings as unknown as { id: string; name: string; date: string } | null;
    if (!meeting) continue;
    unified.push({
      id: t.id,
      title: t.title,
      status: t.status,
      assignee_id: t.assignee_id,
      assigneeName: t.assignee_id ? profileMap.get(t.assignee_id) ?? null : null,
      due_date: t.due_date,
      source: 'meeting',
      sourceId: meeting.id,
      sourceName: meeting.name,
      sourceDate: meeting.date,
    });
  }

  for (const t of (projectTasks ?? [])) {
    const project = t.projects as unknown as { id: string; name: string; color: string } | null;
    if (!project) continue;
    unified.push({
      id: t.id,
      title: t.title,
      status: t.status,
      assignee_id: t.assignee_id,
      assigneeName: t.assignee_id ? profileMap.get(t.assignee_id) ?? null : null,
      due_date: t.due_date,
      source: 'project',
      sourceId: project.id,
      sourceName: project.name,
      sourceColor: project.color,
      sourcePhase: t.phase,
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Aufgaben</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Alle Aufgaben aus Meetings und Projekten</p>
      </div>
      <AufgabenUebersicht tasks={unified} currentUserId={user!.id} />
    </div>
  );
}
