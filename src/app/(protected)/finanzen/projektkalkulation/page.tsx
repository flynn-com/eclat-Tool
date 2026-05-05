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
    maRaw,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('kalkulation_pakete')
      .select('id, name, kalkulation_paket_positionen(id, bezeichnung, stunden, sort_order)')
      .order('created_at', { ascending: true }),
    supabase
      .from('equipment_items')
      .select('id, name, category, day_rate')
      .eq('status', 'active')
      .not('day_rate', 'is', null)
      .order('name', { ascending: true }),
    loadSettingsServer('monatsabrechnung'),
  ]);

  // Fetch profile name for PDF
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    : { data: null };

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
      }[]
    )
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((pos) => ({
        id: pos.id,
        bezeichnung: pos.bezeichnung,
        stunden: Number(pos.stunden),
      })),
  }));

  const equipmentItems = (equipmentRaw ?? []).map((e) => ({
    id: e.id as string,
    name: e.name as string,
    category: e.category as string,
    day_rate: e.day_rate !== null ? Number(e.day_rate) : null,
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
      />
    </div>
  );
}
