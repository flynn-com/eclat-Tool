import { createClient } from '@/lib/supabase/server';
import { DashboardGrid, type UserWidget } from '@/components/dashboard/dashboard-grid';
import type { WidgetData } from '@/components/dashboard/widget-content';

const MONAT_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mär', '04': 'Apr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Dez',
};
function shortLabel(monat: string) {
  const [year, month] = monat.split('-');
  return `${MONAT_LABELS[month] ?? month} ${year?.slice(2)}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: trackingData },
    { data: deductData },
    { data: activeProjects },
    { data: widgetRows },
    { data: abrechnungen },
    { data: projectEntries },
    { data: allProfiles },
    { data: allTrackingData },
    { data: allDeductData },
    { data: myMeetingTasks },
    { data: myProjectTasks },
    { data: myGeneralTaskAssignees },
    { data: alleProfile },
  ] = await Promise.all([
    supabase.from('profiles').select('role, full_name').eq('id', user!.id).maybeSingle(),
    supabase.from('time_entries').select('duration_minutes').eq('user_id', user!.id).not('end_time', 'is', null),
    supabase.from('stunden_abrechnungen').select('stunden').eq('user_id', user!.id),
    supabase.from('projects').select('phase').eq('status', 'active'),
    supabase.from('user_dashboard_config').select('widget_key, position, col_span').eq('user_id', user!.id).order('position'),
    supabase.from('gewinnverteilungen').select('monat, einnahmen, ausgaben').not('monat', 'is', null).order('monat', { ascending: true }),
    // Project breakdown for current user
    supabase.from('time_entries')
      .select('duration_minutes, projects(name, color)')
      .eq('user_id', user!.id)
      .not('end_time', 'is', null)
      .not('project_id', 'is', null),
    // All team profiles except self (for Zeiterfassung team widget)
    supabase.from('profiles').select('id, full_name').neq('id', user!.id),
    // All tracking data for other team members
    supabase.from('time_entries').select('user_id, duration_minutes').not('end_time', 'is', null).neq('user_id', user!.id),
    // All deductions for other team members
    supabase.from('stunden_abrechnungen').select('user_id, stunden').neq('user_id', user!.id),
    // Aufgaben: meeting tasks for current user
    supabase.from('meeting_tasks').select('id, title, status, meetings(name)').eq('assignee_id', user!.id).neq('status', 'erledigt').limit(20),
    // Aufgaben: project tasks for current user
    supabase.from('project_tasks').select('id, title, status, projects(name)').eq('assignee_id', user!.id).neq('status', 'erledigt').limit(20),
    // Aufgaben: general tasks where user is assignee
    supabase.from('task_assignees').select('task_id, tasks(id, title, status)').eq('user_id', user!.id).limit(20),
    // All profiles incl. current user (für Aufgaben-Assignee-Picker)
    supabase.from('profiles').select('id, full_name'),
  ]);

  const isAdmin = profile?.role === 'admin';
  const canEdit = isAdmin;
  const isNewUser = isAdmin && (widgetRows ?? []).length === 0;

  // Zeiterfassung – current user
  const totalMinutes = (trackingData ?? []).reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
  const deductedMinutes = (deductData ?? []).reduce((s, e) => s + Number(e.stunden) * 60, 0);
  const verfuegbarMinutes = Math.max(Math.round(totalMinutes - deductedMinutes), 0);

  // Project breakdown — aggregate by project name
  const projectMap: Record<string, { name: string; color: string; minutes: number }> = {};
  for (const entry of (projectEntries ?? [])) {
    const proj = (entry as any).projects;
    if (!proj) continue;
    const key = proj.name as string;
    if (!projectMap[key]) projectMap[key] = { name: proj.name, color: proj.color ?? '#10b981', minutes: 0 };
    projectMap[key].minutes += entry.duration_minutes ?? 0;
  }
  const userProjectBreakdown = Object.values(projectMap).sort((a, b) => b.minutes - a.minutes);

  // Team member hours — balance per person
  const teamMemberHours = (allProfiles ?? []).map(p => {
    const tracked = (allTrackingData ?? [])
      .filter(e => e.user_id === p.id)
      .reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
    const deducted = (allDeductData ?? [])
      .filter(e => e.user_id === p.id)
      .reduce((s, e) => s + Number(e.stunden) * 60, 0);
    return { id: p.id, name: p.full_name ?? '?', minutes: Math.max(tracked - deducted, 0) };
  }).sort((a, b) => b.minutes - a.minutes);

  // Finanzen
  const byMonth: Record<string, { einnahmen: number; ausgaben: number }> = {};
  for (const row of (abrechnungen ?? [])) {
    const key = row.monat as string;
    if (!byMonth[key]) byMonth[key] = { einnahmen: 0, ausgaben: 0 };
    byMonth[key].einnahmen += Number(row.einnahmen ?? 0);
    byMonth[key].ausgaben += Number(row.ausgaben ?? 0);
  }
  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([monat, d]) => ({
      monat,
      label: shortLabel(monat),
      einnahmen: d.einnahmen,
      ausgaben: d.ausgaben,
      ergebnis: d.einnahmen - d.ausgaben,
    }));
  const gesamtEinnahmen = Object.values(byMonth).reduce((s, d) => s + d.einnahmen, 0);
  const gesamtAusgaben = Object.values(byMonth).reduce((s, d) => s + d.ausgaben, 0);

  // Aufgaben zusammenführen
  type AufgabeItem = { id: string; title: string; status: string; source: string; type: 'meeting' | 'project' | 'general' };
  const meineAufgaben: AufgabeItem[] = [
    ...(myMeetingTasks ?? []).map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      source: (t as any).meetings?.name ?? 'Meeting',
      type: 'meeting' as const,
    })),
    ...(myProjectTasks ?? []).map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      source: (t as any).projects?.name ?? 'Projekt',
      type: 'project' as const,
    })),
    ...(myGeneralTaskAssignees ?? [])
      .map(r => (r as any).tasks)
      .filter((t: any) => t && t.status !== 'erledigt')
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        source: 'Allgemein',
        type: 'general' as const,
      })),
  ];

  const widgetData: WidgetData = {
    verfuegbarMinutes,
    totalMinutes,
    userProjectBreakdown,
    teamMemberHours,
    offeneAufgaben: meineAufgaben.length,
    meineAufgaben,
    alleProfile: (alleProfile ?? []).map(p => ({ id: p.id, name: p.full_name ?? '?' })),
    projektCount: activeProjects?.length ?? 0,
    chartData,
    gesamtEinnahmen,
    gesamtAusgaben,
  };

  // Admins: persönliche Config aus DB; Employees: feste Standardansicht
  const { DEFAULT_WIDGETS_EMPLOYEE } = await import('@/lib/widget-registry');
  const widgets: UserWidget[] = canEdit
    ? (widgetRows ?? []).map(r => ({
        widget_key: r.widget_key,
        position: r.position,
        col_span: r.col_span,
      }))
    : DEFAULT_WIDGETS_EMPLOYEE.map(d => ({
        widget_key: d.widget_key,
        position: d.position,
        col_span: d.col_span,
      }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Dashboard</h1>
        <p className="mt-1" style={{ color: 'var(--neu-text-secondary)' }}>
          Willkommen zurück, {profile?.full_name ?? 'Benutzer'}
        </p>
      </div>

      <DashboardGrid
        initialWidgets={widgets}
        widgetData={widgetData}
        isAdmin={isAdmin}
        isNewUser={isNewUser}
        canEdit={canEdit}
      />
    </div>
  );
}
