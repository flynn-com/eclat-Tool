import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { MonatsabrechnungRechner } from '@/components/finanzen/monatsabrechnung-rechner';
import { MonatSelect } from '@/components/finanzen/monat-select';
import { loadSettingsServer, DEFAULT_MONATSABRECHNUNG, DEFAULT_STAFFELN, type MonatsabrechnungSettings, type Staffel } from '@/lib/settings';

function getMonatOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  // Aktueller Monat + 6 Vormonate
  for (let i = 0; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

export default async function MonatsabrechnungPage({ searchParams }: { searchParams: Promise<{ monat?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();

  // Default: Vormonat
  const now = new Date();
  const vormonat = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const defaultMonat = `${vormonat.getFullYear()}-${String(vormonat.getMonth() + 1).padStart(2, '0')}`;
  const gewaehlterMonat = params.monat || defaultMonat;

  // Parse month
  const [jahrStr, monatStr] = gewaehlterMonat.split('-');
  const jahr = parseInt(jahrStr);
  const monat = parseInt(monatStr);
  const startOfMonth = new Date(jahr, monat - 1, 1).toISOString();
  const endOfMonth = new Date(jahr, monat, 0, 23, 59, 59).toISOString();
  const monatLabel = new Date(jahr, monat - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  // Settings
  const maRaw = await loadSettingsServer('monatsabrechnung');
  const staffelnRaw = await loadSettingsServer('vertrieb_staffeln');
  const settings: MonatsabrechnungSettings = maRaw ?? DEFAULT_MONATSABRECHNUNG;
  const staffeln: Staffel[] = staffelnRaw ?? DEFAULT_STAFFELN;

  // All data in parallel
  const [
    { data: profiles },
    { data: alleTimeEntries },
    { data: alleAbrechnungen },
    { data: recurringExpenses },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.from('time_entries').select('user_id, duration_minutes, start_time').not('end_time', 'is', null),
    supabase.from('stunden_abrechnungen').select('user_id, stunden'),
    supabase.from('recurring_expenses').select('id, name, betrag, kategorie, aktiv').eq('aktiv', true).order('created_at'),
  ]);

  // Build HashMaps for O(1) lookup instead of O(n) filter
  const vorMonatMap = new Map<string, number>();
  const imMonatMap = new Map<string, number>();
  const abgerechnetMap = new Map<string, number>();

  for (const e of (alleTimeEntries ?? [])) {
    if (e.start_time < startOfMonth) {
      vorMonatMap.set(e.user_id, (vorMonatMap.get(e.user_id) ?? 0) + (e.duration_minutes ?? 0));
    } else if (e.start_time >= startOfMonth && e.start_time <= endOfMonth) {
      imMonatMap.set(e.user_id, (imMonatMap.get(e.user_id) ?? 0) + (e.duration_minutes ?? 0));
    }
  }
  for (const e of (alleAbrechnungen ?? [])) {
    abgerechnetMap.set(e.user_id, (abgerechnetMap.get(e.user_id) ?? 0) + Number(e.stunden));
  }

  const personenDaten = (profiles ?? []).map((p) => {
    const vorMonatMinuten = vorMonatMap.get(p.id) ?? 0;
    const imMonatMinuten = imMonatMap.get(p.id) ?? 0;
    const abgerechnet = abgerechnetMap.get(p.id) ?? 0;

    const uebertragStunden = Math.max((vorMonatMinuten / 60) - abgerechnet, 0);
    const monatsStunden = imMonatMinuten / 60;
    const gesamtStunden = uebertragStunden + monatsStunden;

    return {
      id: p.id,
      name: p.full_name,
      uebertragStunden: Math.round(uebertragStunden * 100) / 100,
      monatsStunden: Math.round(monatsStunden * 100) / 100,
      gesamtStunden: Math.round(gesamtStunden * 100) / 100,
    };
  });

  const monatOptions = getMonatOptions();

  return (
    <div>
      <div className="mb-6">
        <Link href="/finanzen" className="inline-flex items-center gap-1 text-sm mb-2 transition-colors" style={{ color: 'var(--neu-accent-mid)' }}>
          <ArrowLeft className="h-4 w-4" /> Zurueck zu Finanzen
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Monatsabrechnung</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Abrechnung fuer <strong>{monatLabel}</strong></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Monat:</span>
            <MonatSelect value={gewaehlterMonat} options={monatOptions} />
          </div>
        </div>
      </div>
      <MonatsabrechnungRechner
        settings={settings}
        staffeln={staffeln}
        personen={personenDaten}
        abrechnungsMonat={gewaehlterMonat}
        abrechnungsMonatLabel={monatLabel}
        wiederkehrendeAusgaben={(recurringExpenses ?? []).map(e => ({
          id: e.id,
          name: e.name,
          betrag: Number(e.betrag),
          kategorie: e.kategorie,
        }))}
      />
    </div>
  );
}
