import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { KundeForm } from '@/components/vertrieb/kunde-form';
import { Kunde } from '@/lib/types';

export default async function KundeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: kunde } = await supabase.from('kunden').select('*').eq('id', id).maybeSingle();
  if (!kunde) redirect('/vertrieb/kunden');

  const { data: projekte } = await supabase
    .from('projects')
    .select('id, name, phase, status, created_at')
    .eq('kunde_id', id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <Link href="/vertrieb/kunden" className="inline-flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--neu-accent-mid)' }}>
        <ArrowLeft className="h-4 w-4" /> Alle Kunden
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>{(kunde as Kunde).firma}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Kundendaten bearbeiten</p>
      </div>

      <KundeForm kunde={kunde as Kunde} />

      {/* Verknuepfte Projekte */}
      {projekte && projekte.length > 0 && (
        <div className="neu-raised p-5 mt-6 max-w-3xl">
          <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
            Projekte mit diesem Kunden ({projekte.length})
          </h3>
          <div className="space-y-2">
            {projekte.map((p) => (
              <Link key={p.id} href={`/projekte/${p.id}`} className="neu-pressed flex items-center gap-3 px-4 py-2 hover:opacity-80">
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--neu-text)' }}>{p.name}</span>
                <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>{p.phase}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
