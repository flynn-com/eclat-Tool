import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PaketManager } from '@/components/finanzen/paket-manager';

export default async function PaketePage() {
  const supabase = await createClient();

  const { data: paketeRaw } = await supabase
    .from('kalkulation_pakete')
    .select('id, name, beschreibung, kalkulation_paket_positionen(id, bezeichnung, stunden, sort_order)')
    .order('created_at', { ascending: true });

  const pakete = (paketeRaw ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    beschreibung: p.beschreibung as string | null,
    positionen: ((p.kalkulation_paket_positionen ?? []) as { id: string; bezeichnung: string; stunden: number; sort_order: number }[])
      .sort((a, b) => a.sort_order - b.sort_order),
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
              Pakete für Projektkalkulation verwalten
            </p>
          </div>
        </div>
      </div>

      <PaketManager initialPakete={pakete} />
    </div>
  );
}
