import { createClient } from '@/lib/supabase/server';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { FinanzChart } from '@/components/finanzen/finanz-chart';
import { WidgetPinButton } from '@/components/dashboard/widget-pin-button';
import { Clock, CheckSquare, FolderKanban, Euro, X } from 'lucide-react';
import Link from 'next/link';

function formatStunden(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} Std ${m.toString().padStart(2, '0')} Min`;
}

const MONAT_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mär', '04': 'Apr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Dez',
};

function shortLabel(monat: string) {
  const [year, month] = monat.split('-');
  return `${MONAT_LABELS[month] ?? month} ${year?.slice(2)}`;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
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
    supabase.from('user_widgets').select('widget_id').eq('user_id', user!.id),
    supabase.from('gewinnverteilungen').select('monat, einnahmen, ausgaben').not('monat', 'is', null).order('monat', { ascending: true }),
  ]);

  const isAdmin = profile?.role === 'admin';
  const totalMinutes = (trackingData ?? []).reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);
  const deductedMinutes = (deductData ?? []).reduce((sum, e) => sum + Number(e.stunden) * 60, 0);
  const verfuegbarMinutes = Math.max(Math.round(totalMinutes - deductedMinutes), 0);

  const projectCount = activeProjects?.length ?? 0;
  const phaseCounts: Record<string, number> = {};
  for (const p of (activeProjects ?? [])) {
    phaseCounts[p.phase] = (phaseCounts[p.phase] || 0) + 1;
  }

  const offeneAufgaben = (meetingTasksCount ?? 0) + (projectTasksCount ?? 0);

  const pinnedWidgets = new Set((widgetRows ?? []).map((w) => w.widget_id));

  // Build chart data for widget
  const byMonth: Record<string, { einnahmen: number; ausgaben: number }> = {};
  for (const row of (abrechnungen ?? [])) {
    const key = row.monat as string;
    if (!byMonth[key]) byMonth[key] = { einnahmen: 0, ausgaben: 0 };
    byMonth[key].einnahmen += Number(row.einnahmen ?? 0);
    byMonth[key].ausgaben += Number(row.ausgaben ?? 0);
  }
  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // last 6 months in widget
    .map(([monat, d]) => ({
      monat,
      label: shortLabel(monat),
      einnahmen: d.einnahmen,
      ausgaben: d.ausgaben,
      ergebnis: d.einnahmen - d.ausgaben,
    }));

  const gesamtEinnahmen = Object.values(byMonth).reduce((s, d) => s + d.einnahmen, 0);
  const gesamtAusgaben = Object.values(byMonth).reduce((s, d) => s + d.ausgaben, 0);

  const showFinanzWidget = isAdmin && pinnedWidgets.has('finanz_chart');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Dashboard</h1>
        <p className="mt-1" style={{ color: 'var(--neu-text-secondary)' }}>
          Willkommen zurück, {profile?.full_name ?? 'Benutzer'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OverviewCard
          title="Stundenkonto"
          value={formatStunden(verfuegbarMinutes)}
          description={`Erfasst: ${formatStunden(totalMinutes)}`}
          icon={<Clock className="h-5 w-5" />}
          href="/zeiterfassung"
        />
        <OverviewCard
          title="Aufgaben"
          value={String(offeneAufgaben)}
          description="Offen für dich"
          icon={<CheckSquare className="h-5 w-5" />}
          href="/aufgaben"
        />
        <OverviewCard
          title="Projekte"
          value={String(projectCount)}
          description={Object.entries(phaseCounts).map(([phase, count]) => {
            const labels: Record<string, string> = { planung: 'Planung', produktion: 'Produktion', postproduktion: 'Post', review: 'Review', abgeschlossen: 'Fertig' };
            return `${count} ${labels[phase] ?? phase}`;
          }).join(', ') || 'Keine'}
          icon={<FolderKanban className="h-5 w-5" />}
          href="/projekte"
        />
        {isAdmin && (
          <OverviewCard
            title="Finanzen"
            value={eur(gesamtEinnahmen - gesamtAusgaben)}
            description={`${eur(gesamtEinnahmen)} Einnahmen`}
            icon={<Euro className="h-5 w-5" />}
            href="/finanzen"
          />
        )}
      </div>

      {/* Pinned Widgets */}
      {showFinanzWidget && (
        <div className="mt-6">
          <div className="neu-raised p-5">
            <div className="flex items-center justify-between mb-3">
              <Link href="/finanzen" className="text-base font-bold hover:opacity-80 transition-opacity"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
                Einnahmen & Ausgaben →
              </Link>
              <WidgetPinButton widgetId="finanz_chart" isPinned={true} />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="neu-pressed px-3 py-2">
                <p className="text-xs mb-0.5" style={{ color: 'var(--neu-text-secondary)' }}>Einnahmen</p>
                <p className="text-sm font-bold" style={{ color: '#10b981' }}>{eur(gesamtEinnahmen)}</p>
              </div>
              <div className="neu-pressed px-3 py-2">
                <p className="text-xs mb-0.5" style={{ color: 'var(--neu-text-secondary)' }}>Ausgaben</p>
                <p className="text-sm font-bold" style={{ color: '#ef4444' }}>{eur(gesamtAusgaben)}</p>
              </div>
              <div className="neu-pressed px-3 py-2">
                <p className="text-xs mb-0.5" style={{ color: 'var(--neu-text-secondary)' }}>Ergebnis</p>
                <p className="text-sm font-bold" style={{ color: (gesamtEinnahmen - gesamtAusgaben) >= 0 ? '#f59e0b' : '#ef4444' }}>
                  {eur(gesamtEinnahmen - gesamtAusgaben)}
                </p>
              </div>
            </div>
            <FinanzChart data={chartData} compact />
          </div>
        </div>
      )}
    </div>
  );
}
