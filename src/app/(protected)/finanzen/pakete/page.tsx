import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PaketManager } from '@/components/finanzen/paket-manager';

export default async function PaketePage() {
  const supabase = await createClient();

  const [{ data: paketeRaw }, { data: personasRaw }] = await Promise.all([
    supabase
      .from('kalkulation_pakete')
      .select('id, name, beschreibung, kalkulation_paket_positionen(id, bezeichnung, stunden, sort_order, persona_id)')
      .order('created_at', { ascending: true }),
    supabase
      .from('kalkulation_personas')
      .select('id, name, stundensatz, farbe')
      .order('created_at', { ascending: true }),
  ]);

  const pakete = (paketeRaw ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    beschreibung: p.beschreibung as string | null,
    positionen: ((p.kalkulation_paket_positionen ?? []) as {
      id: string;
      bezeichnung: string;
      stunden: number;
      sort_order: number;
      persona_id: string | null;
    }[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((pos) => ({
        id: pos.id,
        bezeichnung: pos.bezeichnung,
        stunden: pos.stunden,
        sort_order: pos.sort_order,
        persona_id: pos.persona_id as string | null,
      })),
  }));

  const personas = (personasRaw ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    stundensatz: Number(p.stundensatz),
    farbe: p.farbe as string | null,
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
          <Package className="h-6 w-6" style={{ color: 'var(--neu-accent)' }} />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
            >
              Leistungspakete
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
              Pakete und Personas für Projektkalkulation verwalten
            </p>
          </div>
        </div>
      </div>

      <PaketManager
        initialPakete={pakete}
        initialPersonas={personas}
      />
    </div>
  );
}
