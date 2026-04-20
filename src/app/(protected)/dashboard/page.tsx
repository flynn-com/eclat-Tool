import { createClient } from '@/lib/supabase/server';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Clock, CheckSquare, FolderKanban, Euro } from 'lucide-react';

function formatStunden(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} Std ${m.toString().padStart(2, '0')} Min`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // All queries in parallel
  const [
    { data: profile },
    { data: trackingData },
    { data: deductData },
    { data: activeProjects },
  ] = await Promise.all([
    supabase.from('profiles').select('role, full_name').eq('id', user!.id).maybeSingle(),
    supabase.from('time_entries').select('duration_minutes').eq('user_id', user!.id).not('end_time', 'is', null),
    supabase.from('stunden_abrechnungen').select('stunden').eq('user_id', user!.id),
    supabase.from('projects').select('phase').eq('status', 'active'),
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Dashboard</h1>
        <p className="mt-1" style={{ color: 'var(--neu-text-secondary)' }}>
          Willkommen zurueck, {profile?.full_name ?? 'Benutzer'}
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
          value="--"
          description="Offen"
          icon={<CheckSquare className="h-5 w-5" />}
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
            value="--"
            description="Monatsumsatz"
            icon={<Euro className="h-5 w-5" />}
          />
        )}
      </div>
    </div>
  );
}
