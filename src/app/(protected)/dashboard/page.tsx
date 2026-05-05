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
    { count: meetingTasksCount },
    { count: projectTasksCount },
    { data: widgetRows },
    { data: abrechnungen },
  ] = await Promise.all([
    supabase.from('profiles').select('role, full_name').eq('id', user!.id).maybeSingle(),
    supabase.from('time_entries').select('duration_minutes').eq('user_id', user!.id).not('end_time', 'is', null),
    supabase.from('stunden_abrechnungen').select('stunden').eq('user_id', user!.id),
    supabase.from('projects').select('phase').eq('status', 'active'),
    supabase.from('meeting_tasks').select('id', { count: 'exact', head: true }).eq('assignee_id', user!.id).neq('status', 'erledigt'),
    supabase.from('project_tasks').select('id', { count: 'exact', head: true }).eq('assignee_id', user!.id).neq('status', 'erledigt'),
    supabase.from('user_dashboard_config').select('widget_key, position, col_span').eq('user_id', user!.id).order('position'),
    supabase.from('gewinnverteilungen').select('monat, einnahmen, ausgaben').not('monat', 'is', null).order('monat', { ascending: true }),
  ]);

  const isAdmin = profile?.role === 'admin';
  const isNewUser = (widgetRows ?? []).length === 0;

  // Zeiterfassung
  const totalMinutes = (trackingData ?? []).reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
  const deductedMinutes = (deductData ?? []).reduce((s, e) => s + Number(e.stunden) * 60, 0);
  const verfuegbarMinutes = Math.max(Math.round(totalMinutes - deductedMinutes), 0);

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

  const widgetData: WidgetData = {
    verfuegbarMinutes,
    totalMinutes,
    offeneAufgaben: (meetingTasksCount ?? 0) + (projectTasksCount ?? 0),
    projektCount: activeProjects?.length ?? 0,
    chartData,
    gesamtEinnahmen,
    gesamtAusgaben,
  };

  const widgets: UserWidget[] = (widgetRows ?? []).map(r => ({
    widget_key: r.widget_key,
    position: r.position,
    col_span: r.col_span,
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
      />
    </div>
  );
}
