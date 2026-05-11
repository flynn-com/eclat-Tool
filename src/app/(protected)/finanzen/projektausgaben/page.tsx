import Link from 'next/link';
import { ArrowLeft, ReceiptText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProjektAusgabenManager } from '@/components/finanzen/projekt-ausgaben-manager';

export default async function ProjektausgabenPage() {
  const supabase = await createClient();

  const [{ data: expensesRaw }, { data: projects }] = await Promise.all([
    supabase
      .from('project_expenses')
      .select('id, project_id, bezeichnung, betrag, kategorie, datum, rechnung_url, rechnung_name, projects(id, name, color)')
      .order('datum', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, color')
      .eq('status', 'active')
      .order('name'),
  ]);

  const expenses = (expensesRaw ?? []).map((e) => ({
    id: e.id,
    project_id: e.project_id,
    bezeichnung: e.bezeichnung,
    betrag: Number(e.betrag),
    kategorie: e.kategorie,
    datum: e.datum,
    rechnung_url: e.rechnung_url,
    rechnung_name: e.rechnung_name,
    projects: Array.isArray(e.projects) ? e.projects[0] ?? null : (e.projects as { id: string; name: string; color: string } | null),
  }));

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/finanzen"
          className="inline-flex items-center gap-1 text-sm mb-2 transition-colors"
          style={{ color: 'var(--neu-accent-mid)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Zurueck zu Finanzen
        </Link>
        <div className="flex items-center gap-3">
          <ReceiptText className="h-6 w-6" style={{ color: 'var(--neu-accent)' }} />
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
            >
              Projektausgaben
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
              Ausgaben erfassen und Projekten zuweisen
            </p>
          </div>
        </div>
      </div>

      <ProjektAusgabenManager
        initialExpenses={expenses}
        projects={projects ?? []}
      />
    </div>
  );
}
