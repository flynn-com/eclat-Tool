import { createClient } from '@/lib/supabase/server';
import { ActiveTimer } from '@/components/zeiterfassung/active-timer';
import { TimerControls } from '@/components/zeiterfassung/timer-controls';
import { ManualEntryForm } from '@/components/zeiterfassung/manual-entry-form';
import { TimeEntriesTable } from '@/components/zeiterfassung/time-entries-table';
import { MonatSelect } from '@/components/finanzen/monat-select';
import { TimeEntryWithRelations } from '@/lib/types';

function getMonatOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

export default async function ZeiterfassungPage({ searchParams }: { searchParams: Promise<{ monat?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const defaultMonat = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const gewaehlterMonat = params.monat || defaultMonat;

  const [jahrStr, monatStr] = gewaehlterMonat.split('-');
  const jahr = parseInt(jahrStr);
  const monat = parseInt(monatStr);
  const startOfMonth = new Date(jahr, monat - 1, 1).toISOString();
  const endOfMonth = new Date(jahr, monat, 0, 23, 59, 59).toISOString();
  const monatLabel = new Date(jahr, monat - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const istAktuellerMonat = gewaehlterMonat === defaultMonat;

  // All queries in parallel
  const [
    { data: activeEntry },
    { data: projects },
    { data: entries },
    { data: profiles },
    { data: alleEntries },
    { data: alleAbrechnungen },
  ] = await Promise.all([
    supabase.from('time_entries').select('*, projects(name, color)').eq('user_id', user!.id).is('end_time', null).maybeSingle(),
    supabase.from('projects').select('*').eq('status', 'active').order('name'),
    supabase.from('time_entries').select('*, profiles(full_name, avatar_url), projects(name, color)').gte('start_time', startOfMonth).lte('start_time', endOfMonth).order('start_time', { ascending: false }),
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.from('time_entries').select('user_id, duration_minutes').not('end_time', 'is', null),
    supabase.from('stunden_abrechnungen').select('user_id, stunden'),
  ]);

  // Build stundenkonten from bulk data
  const erfasstMap = new Map<string, number>();
  const abgerechnetMap = new Map<string, number>();

  for (const e of (alleEntries ?? [])) {
    erfasstMap.set(e.user_id, (erfasstMap.get(e.user_id) ?? 0) + (e.duration_minutes ?? 0));
  }
  for (const e of (alleAbrechnungen ?? [])) {
    abgerechnetMap.set(e.user_id, (abgerechnetMap.get(e.user_id) ?? 0) + Number(e.stunden));
  }

  const stundenkonten: Record<string, { erfasst: number; abgerechnet: number }> = {};
  for (const p of (profiles ?? [])) {
    const erfasstMin = erfasstMap.get(p.id) ?? 0;
    const abgerechnet = abgerechnetMap.get(p.id) ?? 0;
    stundenkonten[p.id] = {
      erfasst: Math.round(erfasstMin / 60 * 100) / 100,
      abgerechnet: Math.round(abgerechnet * 100) / 100,
    };
  }

  const monatOptions = getMonatOptions();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Zeiterfassung</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>{monatLabel}</p>
        </div>
        <MonatSelect value={gewaehlterMonat} options={monatOptions} basePath="/zeiterfassung" />
      </div>

      {/* Timer nur im aktuellen Monat anzeigen */}
      {istAktuellerMonat && (
        <>
          {activeEntry ? (
            <ActiveTimer entry={activeEntry} project={activeEntry.projects} />
          ) : (
            <TimerControls projects={projects ?? []} hasActiveTimer={false} />
          )}
          <ManualEntryForm projects={projects ?? []} />
        </>
      )}

      <TimeEntriesTable
        entries={(entries as TimeEntryWithRelations[]) ?? []}
        profiles={profiles ?? []}
        projects={projects ?? []}
        currentUserId={user!.id}
        stundenkonten={stundenkonten}
      />
    </div>
  );
}
