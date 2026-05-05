import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProjektKalkulator } from '@/components/finanzen/projekt-kalkulator';
import { loadSettingsServer, DEFAULT_MONATSABRECHNUNG, type MonatsabrechnungSettings } from '@/lib/settings';

export default async function ProjektkalkulationPage() {
  const supabase = await createClient();

  const [
    { data: { user } },
    { data: leistungenRaw },
    { data: equipmentRaw },
    { data: personasRaw },
    maRaw,
    { data: eqPaketeRaw },
    { data: kundenRaw },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('kalkulation_leistungen')
      .select('id, name, stundensatz')
      .order('created_at', { ascending: true }),
    supabase
      .from('equipment_items')
      .select('id, name, category, day_rate')
      .eq('status', 'active')
      .not('day_rate', 'is', null)
      .order('name', { ascending: true }),
    supabase
      .from('kalkulation_personas')
      .select('id, name, stundensatz')
      .order('created_at', { ascending: true }),
    loadSettingsServer('monatsabrechnung'),
    supabase
      .from('equipment_packages')
      .select('id, name, day_rate, equipment_package_items(item_id, quantity, equipment_items(id, name, day_rate))')
      .order('name', { ascending: true }),
    supabase
      .from('kunden')
      .select('id, firma, ansprechpartner')
      .order('firma', { ascending: true }),
  ]);

  // Fetch profile name for PDF
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    : { data: null };

  void profile; // used in ProjektKalkulator via erstelltVon in the future

  const settings: MonatsabrechnungSettings = maRaw ?? DEFAULT_MONATSABRECHNUNG;

  const leistungen = (leistungenRaw ?? []).map((l) => ({
    id: l.id as string,
    name: l.name as string,
    stundensatz: Number(l.stundensatz),
  }));

  const equipmentItems = (equipmentRaw ?? []).map((e) => ({
    id: e.id as string,
    name: e.name as string,
    category: e.category as string,
    day_rate: e.day_rate !== null ? Number(e.day_rate) : null,
  }));

  const personas = (personasRaw ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    stundensatz: Number(p.stundensatz),
  }));

  const equipmentPakete = (eqPaketeRaw ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    day_rate: p.day_rate !== null ? Number(p.day_rate) : null,
  }));

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/finanzen"
          className="inline-flex items-center gap-1 text-sm mb-2 transition-colors"
          style={{ color: 'var(--neu-accent-mid)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zu Finanzen
        </Link>
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" style={{ color: 'var(--neu-accent)' }} />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
            >
              Projektkalkulation
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
              Was kostet ein Projekt? Kosten berechnen und als PDF exportieren.
            </p>
          </div>
        </div>
      </div>

      <ProjektKalkulator
        leistungen={leistungen}
        equipmentItems={equipmentItems}
        equipmentPakete={equipmentPakete}
        settings={settings}
        personas={personas}
        kunden={(kundenRaw ?? []).map((k) => ({
          id: k.id as string,
          firma: k.firma as string,
          ansprechpartner: k.ansprechpartner as string | null,
        }))}
      />
    </div>
  );
}
