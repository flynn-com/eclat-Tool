import Link from 'next/link';
import { Users, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function VertriebPage() {
  const supabase = await createClient();
  const { count: kundenCount } = await supabase.from('kunden').select('id', { count: 'exact', head: true });
  const { count: leadsCount } = await supabase.from('kunden').select('id', { count: 'exact', head: true }).eq('status', 'lead');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Vertrieb</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Kundenverwaltung und Akquise</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/vertrieb/kunden" className="neu-raised p-6 block transition-all hover:opacity-90">
          <div style={{ color: 'var(--neu-accent)' }} className="mb-3"><Users className="h-6 w-6" /></div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--neu-text)' }}>Kunden</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-secondary)' }}>{kundenCount ?? 0} Kunden in der Datenbank</p>
        </Link>
        <Link href="/vertrieb/kunden?status=lead" className="neu-raised p-6 block transition-all hover:opacity-90">
          <div style={{ color: 'var(--neu-accent)' }} className="mb-3"><Target className="h-6 w-6" /></div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--neu-text)' }}>Akquise</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-secondary)' }}>{leadsCount ?? 0} offene Leads</p>
        </Link>
      </div>
    </div>
  );
}
