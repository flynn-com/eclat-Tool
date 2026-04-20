import Link from 'next/link';
import { Calculator, Archive, Clock } from 'lucide-react';

export default function FinanzenPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Finanzen</h1>
        <p style={{ color: 'var(--neu-text-secondary)' }} className="mt-1 text-sm">Finanzuebersicht und Abrechnungen</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/finanzen/monatsabrechnung" className="neu-raised p-6 block transition-all hover:opacity-90">
          <div style={{ color: 'var(--neu-accent)' }} className="mb-3"><Calculator className="h-6 w-6" /></div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--neu-text)' }}>Monatsabrechnung</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-secondary)' }}>Monatliche Gewinnverteilung berechnen</p>
        </Link>
        <Link href="/finanzen/archiv" className="neu-raised p-6 block transition-all hover:opacity-90">
          <div style={{ color: 'var(--neu-accent)' }} className="mb-3"><Archive className="h-6 w-6" /></div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--neu-text)' }}>Archiv</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-secondary)' }}>Abgeschlossene Abrechnungen einsehen</p>
        </Link>
        <Link href="/zeiterfassung" className="neu-raised p-6 block transition-all hover:opacity-90">
          <div style={{ color: 'var(--neu-accent)' }} className="mb-3"><Clock className="h-6 w-6" /></div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--neu-text)' }}>Zeiterfassung</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-secondary)' }}>Arbeitszeiten erfassen und auswerten</p>
        </Link>
      </div>
    </div>
  );
}
