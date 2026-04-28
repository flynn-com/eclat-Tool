import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StundenkontenManager } from '@/components/einstellungen/stundenkonten-manager';

export default async function StundenkontenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/dashboard');

  // All data in parallel — no N+1
  const [
    { data: profiles },
    { data: alleEntries },
    { data: alleAbrechnungen },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.from('time_entries').select('id, user_id, duration_minutes, start_time, description, projects(name)').not('end_time', 'is', null).order('start_time', { ascending: false }),
    supabase.from('stunden_abrechnungen').select('id, user_id, stunden, beschreibung, created_at').order('created_at', { ascending: false }),
  ]);

  // O(1) HashMap-Lookup statt O(n) filter
  const entriesMap = new Map<string, typeof alleEntries>();
  const abrechnungenMap = new Map<string, typeof alleAbrechnungen>();
  for (const e of (alleEntries ?? [])) {
    if (!entriesMap.has(e.user_id)) entriesMap.set(e.user_id, []);
    entriesMap.get(e.user_id)!.push(e);
  }
  for (const a of (alleAbrechnungen ?? [])) {
    if (!abrechnungenMap.has(a.user_id)) abrechnungenMap.set(a.user_id, []);
    abrechnungenMap.get(a.user_id)!.push(a);
  }

  const konten = (profiles ?? []).map((p) => {
    const userEntries = entriesMap.get(p.id) ?? [];
    const userAbrechnungen = abrechnungenMap.get(p.id) ?? [];

    const erfasstMinuten = userEntries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
    const abgerechnet = userAbrechnungen.reduce((s, e) => s + Number(e.stunden), 0);

    return {
      id: p.id,
      name: p.full_name,
      erfasstStunden: Math.round(erfasstMinuten / 60 * 100) / 100,
      abgerechnetStunden: Math.round(abgerechnet * 100) / 100,
      verfuegbar: Math.round((erfasstMinuten / 60 - abgerechnet) * 100) / 100,
      eintraege: userEntries.slice(0, 50).map((e) => ({
        id: e.id,
        minuten: e.duration_minutes ?? 0,
        datum: e.start_time,
        beschreibung: e.description,
        projekt: e.projects ? (e.projects as unknown as { name: string }).name : null,
      })),
      abrechnungen: userAbrechnungen.slice(0, 30).map((e) => ({
        id: e.id,
        stunden: Number(e.stunden),
        beschreibung: e.beschreibung,
        datum: e.created_at,
      })),
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Stundenkonten verwalten</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--neu-text-secondary)' }}>Stunden manuell bearbeiten, hinzufuegen oder loeschen (nur Admin)</p>
      </div>
      <StundenkontenManager konten={konten} />
    </div>
  );
}
