import { createClient } from '@/lib/supabase/server';
import { TaskBoard } from '@/components/projekte/task-board';
import { EquipmentList } from '@/components/projekte/equipment-list';
import { ScheduleList } from '@/components/projekte/schedule-list';
import { TeamList } from '@/components/projekte/team-list';
import { NotesSection } from '@/components/projekte/notes-section';

export default async function ProduktionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: tasks },
    { data: equipment },
    { data: schedule },
    { data: team },
    { data: notes },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('project_tasks').select('*').eq('project_id', id).eq('phase', 'produktion').order('sort_order'),
    supabase.from('project_equipment').select('*').eq('project_id', id).order('created_at'),
    supabase.from('project_schedule').select('*').eq('project_id', id).order('date'),
    supabase.from('project_team').select('*, profiles(full_name)').eq('project_id', id),
    supabase.from('project_notes').select('*').eq('project_id', id).eq('category', 'produktion_notizen').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').order('full_name'),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="lg:col-span-2">
        <TaskBoard projectId={id} phase="produktion" category="allgemein" tasks={tasks ?? []} title="Aufgaben Produktion" profiles={profiles ?? []} />
      </div>
      <ScheduleList projectId={id} entries={schedule ?? []} />
      <EquipmentList projectId={id} items={equipment ?? []} showStatusToggle />
      <TeamList projectId={id} members={team ?? []} profiles={profiles ?? []} title="Team am Set" />
      <NotesSection projectId={id} category="produktion_notizen" notes={notes ?? []} title="Notizen" />
    </div>
  );
}
