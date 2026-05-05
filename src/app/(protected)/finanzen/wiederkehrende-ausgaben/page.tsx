import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { RecurringExpensesManager } from '@/components/finanzen/recurring-expenses-manager';

export default async function WiederkehrendeAusgabenPage() {
  const supabase = await createClient();

  const { data: recurringExpenses } = await supabase
    .from('recurring_expenses')
    .select('id, name, betrag, kategorie, aktiv')
    .order('created_at');

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/finanzen"
          className="neu-btn p-2 rounded-xl"
          style={{ color: 'var(--neu-text-secondary)' }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
            Wiederkehrende Ausgaben
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
            Monatliche Fixkosten verwalten
          </p>
        </div>
      </div>

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
  );
}
