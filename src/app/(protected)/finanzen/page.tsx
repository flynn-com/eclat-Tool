import Link from 'next/link';
import { Calculator, Archive, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { FinanzChart } from '@/components/finanzen/finanz-chart';
import { WidgetPinButton } from '@/components/dashboard/widget-pin-button';
import { RecurringExpensesManager } from '@/components/finanzen/recurring-expenses-manager';

const MONAT_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mär', '04': 'Apr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Dez',
};

function shortLabel(monat: string) {
  // "2025-03" → "Mär 25"
  const [year, month] = monat.split('-');
  return `${MONAT_LABELS[month] ?? month} ${year?.slice(2)}`;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

export default async function FinanzenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: abrechnungen }, { data: widgetRows }, { data: recurringExpenses }] = await Promise.all([
    supabase
      .from('gewinnverteilungen')
      .select('monat, einnahmen, ausgaben, gesamtgewinn')
      .not('monat', 'is', null)
      .order('monat', { ascending: true }),
    supabase
      .from('user_widgets')
      .select('widget_id')
      .eq('user_id', user!.id),
    supabase.from('recurring_expenses').select('id, name, betrag, kategorie, aktiv').order('created_at'),
  ]);

  // Aggregate by month (sum if multiple entries per month)
  const byMonth: Record<string, { einnahmen: number; ausgaben: number }> = {};
  for (const row of (abrechnungen ?? [])) {
    const key = row.monat as string;
    if (!byMonth[key]) byMonth[key] = { einnahmen: 0, ausgaben: 0 };
    byMonth[key].einnahmen += Number(row.einnahmen ?? 0);
    byMonth[key].ausgaben += Number(row.ausgaben ?? 0);
  }

  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monat, d]) => ({
      monat,
      label: shortLabel(monat),
      einnahmen: d.einnahmen,
      ausgaben: d.ausgaben,
      ergebnis: d.einnahmen - d.ausgaben,
    }));

  const gesamtEinnahmen = chartData.reduce((s, d) => s + d.einnahmen, 0);
  const gesamtAusgaben = chartData.reduce((s, d) => s + d.ausgaben, 0);
  const gesamtErgebnis = gesamtEinnahmen - gesamtAusgaben;

  const pinnedWidgets = new Set((widgetRows ?? []).map((w) => w.widget_id));
  const isChartPinned = pinnedWidgets.has('finanz_chart');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Finanzen</h1>
        <p style={{ color: 'var(--neu-text-secondary)' }} className="mt-1 text-sm">Finanzuebersicht und Abrechnungen</p>
      </div>

      {/* Übersicht-Karten */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="neu-raised p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4" style={{ color: '#10b981' }} />
            <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Einnahmen gesamt</p>
          </div>
          <p className="text-lg font-bold" style={{ color: '#10b981' }}>{eur(gesamtEinnahmen)}</p>
        </div>
        <div className="neu-raised p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4" style={{ color: '#ef4444' }} />
            <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Ausgaben gesamt</p>
          </div>
          <p className="text-lg font-bold" style={{ color: '#ef4444' }}>{eur(gesamtAusgaben)}</p>
        </div>
        <div className="neu-raised p-4">
          <div className="flex items-center gap-2 mb-1">
            <Minus className="h-4 w-4" style={{ color: gesamtErgebnis >= 0 ? '#f59e0b' : '#ef4444' }} />
            <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Ergebnis gesamt</p>
          </div>
          <p className="text-lg font-bold" style={{ color: gesamtErgebnis >= 0 ? '#f59e0b' : '#ef4444' }}>{eur(gesamtErgebnis)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="neu-raised p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
            Einnahmen & Ausgaben
          </h2>
          <WidgetPinButton widgetId="finanz_chart" isPinned={isChartPinned} />
        </div>
        <FinanzChart data={chartData} />
      </div>

      {/* Wiederkehrende Ausgaben */}
      <div className="mb-6">
        <RecurringExpensesManager
          initialExpenses={(recurringExpenses ?? []).map(e => ({
            id: e.id,
            name: e.name,
            betrag: Number(e.betrag),
            kategorie: e.kategorie,
            aktiv: e.aktiv,
          }))}
        />
      </div>

      {/* Navigation */}
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
