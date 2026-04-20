import { createClient } from '@/lib/supabase/server';
import { NotesSection } from '@/components/projekte/notes-section';
import { TaskBoard } from '@/components/projekte/task-board';
import { TeamList } from '@/components/projekte/team-list';
import { EquipmentList } from '@/components/projekte/equipment-list';
import { ScheduleList } from '@/components/projekte/schedule-list';

export default async function VorplanungPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: notes },
    { data: tasks },
    { data: team },
    { data: equipment },
    { data: schedule },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('project_notes').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('project_tasks').select('*').eq('project_id', id).eq('phase', 'vorplanung').order('sort_order'),
    supabase.from('project_team').select('*, profiles(full_name)').eq('project_id', id),
    supabase.from('project_equipment').select('*').eq('project_id', id).order('created_at'),
    supabase.from('project_schedule').select('*').eq('project_id', id).order('date'),
    supabase.from('profiles').select('id, full_name').order('full_name'),
  ]);

  const notesByCategory = (cat: string) => (notes ?? []).filter((n) => n.category === cat);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <NotesSection projectId={id} category="brainstorming" notes={notesByCategory('brainstorming')} title="Brainstorming" />
      <NotesSection projectId={id} category="moodboard" notes={notesByCategory('moodboard')} title="Moodboard" />
      <NotesSection projectId={id} category="marktanalyse" notes={notesByCategory('marktanalyse')} title="Marktanalyse" />
      <NotesSection projectId={id} category="strategie" notes={notesByCategory('strategie')} title="Strategieplanung" />
      <NotesSection projectId={id} category="storyboard_shotlist" notes={notesByCategory('storyboard_shotlist')} title="Storyboard / Shotlist" />
      <NotesSection projectId={id} category="shooting_planung" notes={notesByCategory('shooting_planung')} title="Shooting-Planung" />
      <ScheduleList projectId={id} entries={schedule ?? []} />
      <EquipmentList projectId={id} items={equipment ?? []} />
      <TeamList projectId={id} members={team ?? []} profiles={profiles ?? []} title="Team" />
      <TeamList projectId={id} members={team ?? []} profiles={profiles ?? []} title="Models / Talents" filterRole="model_talent" />
      <div className="lg:col-span-2">
        <TaskBoard projectId={id} phase="vorplanung" category="allgemein" tasks={tasks ?? []} title="Aufgaben Vorplanung" profiles={profiles ?? []} />
      </div>
    </div>
  );
}
