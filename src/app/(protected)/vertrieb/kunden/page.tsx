import Link from 'next/link';
import { Plus, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { KundenListe } from '@/components/vertrieb/kunden-liste';
import { Kunde } from '@/lib/types';

export default async function KundenPage() {
  const supabase = await createClient();
  const { data: kunden } = await supabase.from('kunden').select('*').order('firma');

  return (
    <div>
      <Link href="/vertrieb" className="inline-flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--neu-accent-mid)' }}>
        <ArrowLeft className="h-4 w-4" /> Vertrieb
      </Link>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Kunden</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Kundendatenbank</p>
        </div>
        <Link href="/vertrieb/kunden/neu" className="neu-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Neuer Kunde
        </Link>
      </div>
      <KundenListe kunden={(kunden as Kunde[]) ?? []} />
    </div>
  );
}
