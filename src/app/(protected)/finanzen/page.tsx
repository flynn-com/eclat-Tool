import Link from 'next/link';
import {
  Calculator, Archive, Clock, TrendingUp, TrendingDown, Minus,
  FileText, Package, Repeat, ReceiptText, Target, ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { FinanzChart } from '@/components/finanzen/finanz-chart';

const MONAT_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mär', '04': 'Apr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Dez',
};

function shortLabel(monat: string) {
  const [year, month] = monat.split('-');
  return `${MONAT_LABELS[month] ?? month} ${year?.slice(2)}`;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export default async function FinanzenPage() {
  const supabase = await createClient();
  const jahr = new Date().getFullYear();
  const startOfYear = `${jahr}-01`;
  const endOfYear = `${jahr}-12`;

  const [{ data: abrechnungenJahr }, { data: abrechnungenAlle }, { data: zielRow }] = await Promise.all([
    supabase
      .from('gewinnverteilungen')
      .select('monat, einnahmen, ausgaben')
      .gte('monat', startOfYear)
      .lte('monat', endOfYear)
      .order('monat', { ascending: true }),
    supabase
      .from('gewinnverteilungen')
      .select('monat, einnahmen, ausgaben')
      .not('monat', 'is', null)
      .order('monat', { ascending: true }),
    supabase.from('jahresziele').select('umsatzziel').eq('jahr', jahr).maybeSingle(),
  ]);

  // KPIs — aktuelles Jahr
  const einnahmenJahr = (abrechnungenJahr ?? []).reduce((s, r) => s + Number(r.einnahmen ?? 0), 0);
  const ausgabenJahr  = (abrechnungenJahr ?? []).reduce((s, r) => s + Number(r.ausgaben ?? 0), 0);
  const ergebnisJahr  = einnahmenJahr - ausgabenJahr;

  // Chart — letzte 6 Monate aus allen Daten
  const byMonth: Record<string, { einnahmen: number; ausgaben: number }> = {};
  for (const row of (abrechnungenAlle ?? [])) {
    const key = row.monat as string;
    if (!byMonth[key]) byMonth[key] = { einnahmen: 0, ausgaben: 0 };
    byMonth[key].einnahmen += Number(row.einnahmen ?? 0);
    byMonth[key].ausgaben += Number(row.ausgaben ?? 0);
  }
  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([monat, d]) => ({
      monat,
      label: shortLabel(monat),
      einnahmen: d.einnahmen,
      ausgaben: d.ausgaben,
      ergebnis: d.einnahmen - d.ausgaben,
    }));

  // Jahresziel
  const umsatzziel = Number(zielRow?.umsatzziel ?? 0);
  const prozentZiel = umsatzziel > 0 ? Math.min(Math.round((einnahmenJahr / umsatzziel) * 100), 100) : null;
  const zielColor = prozentZiel === null ? 'var(--neu-accent)' : prozentZiel >= 100 ? '#10b981' : prozentZiel >= 50 ? '#3b82f6' : '#f59e0b';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Finanzen</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Übersicht {jahr}</p>
      </div>

      {/* KPI-Karten — aktuelles Jahr */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="neu-raised p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
            <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Einnahmen {jahr}</p>
          </div>
          <p className="text-xl font-bold" style={{ color: '#10b981' }}>{eur(einnahmenJahr)}</p>
        </div>
        <div className="neu-raised p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
            <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Ausgaben {jahr}</p>
          </div>
          <p className="text-xl font-bold" style={{ color: '#ef4444' }}>{eur(ausgabenJahr)}</p>
        </div>
        <div className="neu-raised p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Minus className="h-3.5 w-3.5" style={{ color: ergebnisJahr >= 0 ? '#f59e0b' : '#ef4444' }} />
            <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Ergebnis {jahr}</p>
          </div>
          <p className="text-xl font-bold" style={{ color: ergebnisJahr >= 0 ? '#f59e0b' : '#ef4444' }}>{eur(ergebnisJahr)}</p>
        </div>
        <Link href="/finanzen/jahresziele" className="neu-raised p-4 block hover:opacity-90 transition-opacity">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="h-3.5 w-3.5" style={{ color: zielColor }} />
            <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Jahresziel</p>
          </div>
          {prozentZiel !== null ? (
            <p className="text-xl font-bold" style={{ color: zielColor }}>{prozentZiel}%</p>
          ) : (
            <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Nicht gesetzt</p>
          )}
        </Link>
      </div>

      {/* Chart */}
      <div className="neu-raised p-5">
        <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
          Einnahmen & Ausgaben — letzte 6 Monate
        </h2>
        <FinanzChart data={chartData} />
      </div>

      {/* Navigation — gruppiert */}
      <div className="space-y-4">

        {/* Abrechnung */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--neu-text-secondary)' }}>
            Abrechnung
          </p>
          <div className="neu-raised overflow-hidden">
            <NavRow href="/finanzen/monatsabrechnung" icon={<Calculator className="h-4 w-4" />} label="Monatsabrechnung" desc="Monatliche Gewinnverteilung berechnen" />
            <div className="h-px" style={{ background: 'var(--neu-border)' }} />
            <NavRow href="/finanzen/archiv" icon={<Archive className="h-4 w-4" />} label="Archiv" desc="Abgeschlossene Abrechnungen einsehen" />
          </div>
        </div>

        {/* Ausgaben */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--neu-text-secondary)' }}>
            Ausgaben
          </p>
          <div className="neu-raised overflow-hidden">
            <NavRow href="/finanzen/wiederkehrende-ausgaben" icon={<Repeat className="h-4 w-4" />} label="Wiederkehrende Ausgaben" desc="Monatliche Fixkosten verwalten" />
            <div className="h-px" style={{ background: 'var(--neu-border)' }} />
            <NavRow href="/finanzen/projektausgaben" icon={<ReceiptText className="h-4 w-4" />} label="Projektausgaben" desc="Ausgaben Projekten zuweisen" />
          </div>
        </div>

        {/* Planung & Tools */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--neu-text-secondary)' }}>
            Planung & Tools
          </p>
          <div className="neu-raised overflow-hidden">
            <NavRow href="/finanzen/jahresziele" icon={<Target className="h-4 w-4" />} label="Jahresziel" desc="Umsatzziel und Jahresfortschritt" />
            <div className="h-px" style={{ background: 'var(--neu-border)' }} />
            <NavRow href="/finanzen/projektkalkulation" icon={<FileText className="h-4 w-4" />} label="Projektkalkulation" desc="Kosten für ein Projekt berechnen" />
            <div className="h-px" style={{ background: 'var(--neu-border)' }} />
            <NavRow href="/finanzen/leistungen" icon={<Package className="h-4 w-4" />} label="Leistungen & Personas" desc="Leistungspakete und Stundensätze verwalten" />
          </div>
        </div>

        {/* Sonstiges */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--neu-text-secondary)' }}>
            Sonstiges
          </p>
          <div className="neu-raised overflow-hidden">
            <NavRow href="/zeiterfassung" icon={<Clock className="h-4 w-4" />} label="Zeiterfassung" desc="Arbeitszeiten erfassen und auswerten" />
          </div>
        </div>

      </div>
    </div>
  );
}

function NavRow({ href, icon, label, desc }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-5 py-4 hover:opacity-80 transition-opacity"
    >
      <span style={{ color: 'var(--neu-accent)' }}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium" style={{ color: 'var(--neu-text)' }}>{label}</span>
        <span className="block text-xs mt-0.5" style={{ color: 'var(--neu-text-secondary)' }}>{desc}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--neu-text-secondary)' }} />
    </Link>
  );
}
