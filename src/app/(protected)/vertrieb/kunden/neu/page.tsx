import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { KundeForm } from '@/components/vertrieb/kunde-form';

export default function NeuerKundePage() {
  return (
    <div>
      <Link href="/vertrieb/kunden" className="inline-flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--neu-accent-mid)' }}>
        <ArrowLeft className="h-4 w-4" /> Alle Kunden
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Neuer Kunde</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Kundendaten erfassen</p>
      </div>
      <KundeForm />
    </div>
  );
}
