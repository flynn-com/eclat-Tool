import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProjektKalkulator } from '@/components/finanzen/projekt-kalkulator';
import { loadSettingsServer, DEFAULT_MONATSABRECHNUNG, type MonatsabrechnungSettings } from '@/lib/settings';

export default async function ProjektkalkulationPage() {
  const supabase = await createClient();

  const [
    { data: { user } },
    { data: paketeRaw },
    { data: equipmentRaw },
    { data: personasRaw },
    maRaw,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('kalkulation_pakete')
      .select('id, name, kalkulation_paket_positionen(id, bezeichnung, stunden, sort_order, persona_id)')
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
  ]);

  // Fetch profile name for PDF
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    : { data: null };

  void profile; // used in ProjektKalkulator via erstelltVon in the future

  const settings: MonatsabrechnungSettings = maRaw ?? DEFAULT_MONATSABRECHNUNG;

  const pakete = (paketeRaw ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    positionen: (
      (p.kalkulation_paket_positionen ?? []) as {
        id: string;
        bezeichnung: string;
        stunden: number;
        sort_order: number;
        persona_id: string | null;
      }[]
    )
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((pos) => ({
        id: pos.id,
        bezeichnung: pos.bezeichnung,
        stunden: Number(pos.stunden),
        persona_id: pos.persona_id as string | null,
      })),
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
        pakete={pakete}
        equipmentItems={equipmentItems}
        settings={settings}
        personas={personas}
      />
    </div>
  );
}
