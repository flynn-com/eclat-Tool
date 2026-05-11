import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AbschlussReportViewer } from '@/components/projekte/abschluss-report-viewer';
import { buildAbschlussData } from '@/lib/pdf-projektabschluss';
import { loadSettingsServer, DEFAULT_MONATSABRECHNUNG } from '@/lib/settings';

export default async function AbschlussPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: project },
    { data: timeEntries },
    { data: team },
    { data: equipment },
    { data: tasks },
    settingsRaw,
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase
      .from('time_entries')
      .select('user_id, duration_minutes, profiles(full_name)')
      .eq('project_id', id),
    supabase
      .from('project_team')
      .select('user_id, external_name, role, profiles(full_name)')
      .eq('project_id', id),
    supabase
      .from('project_equipment')
      .select('name, category, day_rate, days_count')
      .eq('project_id', id),
    supabase.from('project_tasks').select('status').eq('project_id', id),
    loadSettingsServer('monatsabrechnung'),
  ]);

  if (!project) redirect('/projekte');
  if (project.phase !== 'abgeschlossen') redirect(`/projekte/${id}`);

  // Second-round fetch for kunde only if linked
  let kundeData = null;
  if (project.kunde_id) {
    const { data } = await supabase
      .from('kunden')
      .select('firma, ansprechpartner, email, strasse, plz, stadt')
      .eq('id', project.kunde_id)
      .maybeSingle();
    kundeData = data;
  }

  const settings = { ...DEFAULT_MONATSABRECHNUNG, ...(settingsRaw ?? {}) };

  const data = buildAbschlussData({
    project,
    timeEntries: timeEntries as { user_id: string; duration_minutes: number | null; profiles: { full_name: string } | null }[] | null,
    team: team as { user_id: string | null; external_name: string | null; role: string; profiles: { full_name: string } | null }[] | null,
    equipment: equipment as { name: string; category: string | null; day_rate: number | null; days_count: number | null }[] | null,
    tasks,
    kundeData,
    settings,
  });

  return <AbschlussReportViewer data={data} />;
}
