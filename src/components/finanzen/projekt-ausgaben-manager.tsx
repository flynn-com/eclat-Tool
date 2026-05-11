'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Paperclip, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createProjectExpense, deleteProjectExpense } from '@/lib/actions/project-expenses';

interface Expense {
  id: string;
  project_id: string;
  bezeichnung: string;
  betrag: number;
  kategorie: string | null;
  datum: string;
  rechnung_url: string | null;
  rechnung_name: string | null;
  projects: { id: string; name: string; color: string } | null;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

interface Props {
  initialExpenses: Expense[];
  projects: Project[];
}

function formatEuro(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function ProjektAusgabenManager({ initialExpenses, projects }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [projektId, setProjektId] = useState(projects[0]?.id ?? '');
  const [bezeichnung, setBezeichnung] = useState('');
  const [betrag, setBetrag] = useState('');
  const [kategorie, setKategorie] = useState('');
  const [datum, setDatum] = useState(todayStr());
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setBezeichnung('');
    setBetrag('');
    setKategorie('');
    setDatum(todayStr());
    setFile(null);
    setProjektId(projects[0]?.id ?? '');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projektId) { setError('Bitte ein Projekt auswaehlen.'); return; }
    if (!bezeichnung.trim()) { setError('Bezeichnung ist erforderlich.'); return; }
    const betragNum = parseFloat(betrag.replace(',', '.'));
    if (isNaN(betragNum) || betragNum <= 0) { setError('Bitte einen gueltigen Betrag eingeben.'); return; }

    setIsSubmitting(true);
    setError(null);

    let rechnung_url: string | null = null;
    let rechnung_name: string | null = null;

    if (file) {
      const supabase = createClient();
      const path = `${projektId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('rechnungen').upload(path, file);
      if (uploadError) {
        setError(uploadError.message);
        setIsSubmitting(false);
        return;
      }
      rechnung_url = path;
      rechnung_name = file.name;
    }

    const result = await createProjectExpense({
      project_id: projektId,
      bezeichnung: bezeichnung.trim(),
      betrag: betragNum,
      kategorie: kategorie.trim() || null,
      datum,
      rechnung_url,
      rechnung_name,
    });

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    // Optimistic: find project info
    const proj = projects.find(p => p.id === projektId) ?? null;
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      project_id: projektId,
      bezeichnung: bezeichnung.trim(),
      betrag: betragNum,
      kategorie: kategorie.trim() || null,
      datum,
      rechnung_url,
      rechnung_name,
      projects: proj,
    };
    setExpenses(prev => [newExpense, ...prev]);
    resetForm();
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string, projectId: string) => {
    if (!confirm('Ausgabe wirklich loeschen?')) return;
    startTransition(async () => {
      const result = await deleteProjectExpense(id, projectId);
      if (result.error) {
        setError(result.error);
      } else {
        setExpenses(prev => prev.filter(e => e.id !== id));
      }
    });
  };

  const handleAttachmentClick = async (rechnungUrl: string) => {
    const supabase = createClient();
    const { data } = await supabase.storage.from('rechnungen').createSignedUrl(rechnungUrl, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const totalBetrag = expenses.reduce((s, e) => s + e.betrag, 0);

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Add form toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="neu-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" /> Ausgabe hinzufuegen
        </button>
      ) : (
        <div className="neu-raised p-5">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-base font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
            >
              Neue Ausgabe
            </h3>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="p-1"
              style={{ color: 'var(--neu-text-secondary)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Projekt */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>
                Projekt *
              </label>
              {projects.length === 0 ? (
                <p className="text-sm" style={{ color: '#ef4444' }}>Keine aktiven Projekte vorhanden.</p>
              ) : (
                <select
                  value={projektId}
                  onChange={e => setProjektId(e.target.value)}
                  className="neu-input w-full text-sm py-2"
                  required
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Bezeichnung */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>
                  Bezeichnung *
                </label>
                <input
                  type="text"
                  value={bezeichnung}
                  onChange={e => setBezeichnung(e.target.value)}
                  placeholder="z.B. Druckkosten, Material..."
                  className="neu-input w-full text-sm py-2"
                  required
                />
              </div>

              {/* Betrag */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>
                  Betrag (EUR) *
                </label>
                <input
                  type="text"
                  value={betrag}
                  onChange={e => setBetrag(e.target.value)}
                  placeholder="0,00"
                  className="neu-input w-full text-sm py-2 text-right"
                  required
                />
              </div>

              {/* Kategorie */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>
                  Kategorie (optional)
                </label>
                <input
                  type="text"
                  value={kategorie}
                  onChange={e => setKategorie(e.target.value)}
                  placeholder="z.B. Druck, Reise, Software..."
                  className="neu-input w-full text-sm py-2"
                />
              </div>

              {/* Datum */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>
                  Datum *
                </label>
                <input
                  type="date"
                  value={datum}
                  onChange={e => setDatum(e.target.value)}
                  className="neu-input w-full text-sm py-2"
                  required
                />
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>
                Rechnung hochladen (optional)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="neu-input w-full text-sm py-2"
              />
              {file && (
                <p className="text-xs mt-1" style={{ color: 'var(--neu-text-secondary)' }}>
                  Ausgewaehlt: {file.name}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isSubmitting || projects.length === 0}
                className="neu-btn-primary px-5 py-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Speichere...' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="neu-btn px-5 py-2 text-sm"
                style={{ color: 'var(--neu-text-secondary)' }}
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses list */}
      <div className="neu-raised p-5">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-base font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
          >
            Ausgaben ({expenses.length})
          </h3>
        </div>

        {expenses.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--neu-text-secondary)' }}>
            Noch keine Ausgaben erfasst.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1 text-xs font-medium" style={{ color: 'var(--neu-accent-mid)' }}>
              <span className="flex-1">Bezeichnung / Projekt</span>
              <span className="w-24 text-center">Kategorie</span>
              <span className="w-20 text-right">Datum</span>
              <span className="w-24 text-right">Betrag</span>
              <span className="w-10" />
            </div>

            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="neu-pressed px-3 py-2.5 rounded-xl flex items-center gap-3 flex-wrap sm:flex-nowrap"
              >
                {/* Project dot + name + bezeichnung */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: expense.projects?.color ?? 'var(--neu-accent)' }}
                    />
                    <span className="text-xs truncate" style={{ color: 'var(--neu-text-secondary)' }}>
                      {expense.projects?.name ?? 'Unbekannt'}
                    </span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>
                    {expense.bezeichnung}
                  </span>
                </div>

                {/* Kategorie */}
                <div className="w-24 flex justify-center">
                  {expense.kategorie && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--neu-surface)', color: 'var(--neu-text-secondary)' }}
                    >
                      {expense.kategorie}
                    </span>
                  )}
                </div>

                {/* Datum */}
                <span className="w-20 text-xs text-right" style={{ color: 'var(--neu-text-secondary)' }}>
                  {formatDate(expense.datum)}
                </span>

                {/* Betrag */}
                <span className="w-24 text-sm font-semibold text-right" style={{ color: '#ef4444' }}>
                  {formatEuro(expense.betrag)}
                </span>

                {/* Actions */}
                <div className="w-10 flex items-center justify-end gap-1">
                  {expense.rechnung_url && (
                    <button
                      onClick={() => handleAttachmentClick(expense.rechnung_url!)}
                      title={expense.rechnung_name ?? 'Rechnung anzeigen'}
                      className="p-1 hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--neu-accent)' }}
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(expense.id, expense.project_id)}
                    disabled={isPending}
                    className="p-1 hover:opacity-70 transition-opacity disabled:opacity-30"
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary footer */}
        {expenses.length > 0 && (
          <div
            className="mt-4 pt-3 border-t flex items-center justify-between"
            style={{ borderColor: 'var(--neu-border)' }}
          >
            <span className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
              {expenses.length} {expenses.length === 1 ? 'Ausgabe' : 'Ausgaben'} gesamt
            </span>
            <span className="text-base font-bold" style={{ color: '#ef4444' }}>
              {formatEuro(totalBetrag)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
