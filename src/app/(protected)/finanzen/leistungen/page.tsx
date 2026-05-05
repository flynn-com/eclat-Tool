import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LeistungenManager } from '@/components/finanzen/leistungen-manager';

export default async function LeistungenPage() {
  const supabase = await createClient();

  const [{ data: leistungenRaw }, { data: personasRaw }] = await Promise.all([
    supabase
      .from('kalkulation_leistungen')
      .select('id, name, beschreibung, stundensatz')
      .order('created_at', { ascending: true }),
    supabase
      .from('kalkulation_personas')
      .select('id, name, stundensatz, farbe')
      .order('created_at', { ascending: true }),
  ]);

  const leistungen = (leistungenRaw ?? []).map((l) => ({
    id: l.id as string,
    name: l.name as string,
    beschreibung: l.beschreibung as string | null,
    stundensatz: Number(l.stundensatz),
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
          <Layers className="h-6 w-6" style={{ color: 'var(--neu-accent)' }} />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
            >
              Leistungen
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
              Leistungen und Personas für Projektkalkulation verwalten
            </p>
          </div>
        </div>
      </div>

      <LeistungenManager
        initialLeistungen={leistungen}
        initialPersonas={personas}
      />
    </div>
  );
}
