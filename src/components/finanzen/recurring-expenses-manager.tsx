'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Repeat } from 'lucide-react';
import { createRecurringExpense, updateRecurringExpense, deleteRecurringExpense } from '@/lib/actions/recurring-expenses';

export interface RecurringExpense {
  id: string;
  name: string;
  betrag: number;
  kategorie: string | null;
  aktiv: boolean;
}

interface Props {
  initialExpenses: RecurringExpense[];
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

export function RecurringExpensesManager({ initialExpenses }: Props) {
  const [expenses, setExpenses] = useState<RecurringExpense[]>(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBetrag, setNewBetrag] = useState('');
  const [newKategorie, setNewKategorie] = useState('');
  const [, startTransition] = useTransition();

  function handleAdd() {
    const betrag = parseFloat(newName ? newBetrag.replace(',', '.') : '0');
    if (!newName.trim() || isNaN(betrag) || betrag <= 0) return;

    const optimistic: RecurringExpense = {
      id: Math.random().toString(),
      name: newName.trim(),
      betrag,
      kategorie: newKategorie.trim() || null,
      aktiv: true,
    };
    setExpenses(prev => [...prev, optimistic]);
    setNewName('');
    setNewBetrag('');
    setNewKategorie('');
    setShowForm(false);

    startTransition(async () => {
      await createRecurringExpense(optimistic.name, betrag, newKategorie);
    });
  }

  function handleToggle(id: string) {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, aktiv: !e.aktiv } : e));
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    startTransition(async () => {
      await updateRecurringExpense(id, { aktiv: !expense.aktiv });
    });
  }

  function handleDelete(id: string) {
    setExpenses(prev => prev.filter(e => e.id !== id));
    startTransition(async () => {
      await deleteRecurringExpense(id);
    });
  }

  const aktivSumme = expenses.filter(e => e.aktiv).reduce((s, e) => s + e.betrag, 0);

  return (
    <div className="neu-raised p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4" style={{ color: 'var(--neu-accent)' }} />
          <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
            Wiederkehrende Ausgaben
          </h2>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="neu-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Hinzufügen
        </button>
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--neu-text-secondary)' }}>
        Diese Ausgaben werden automatisch in jede Monatsabrechnung integriert. Inaktive werden nicht berücksichtigt.
      </p>

      {/* Add form */}
      {showForm && (
        <div className="neu-pressed p-4 rounded-xl mb-4 space-y-3">
          <p className="text-xs font-semibold" style={{ color: 'var(--neu-text-secondary)' }}>Neue wiederkehrende Ausgabe</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Bezeichnung (z.B. Software-Abo)"
              className="neu-input flex-1 text-sm py-1.5"
            />
            <input
              type="text"
              value={newBetrag}
              onChange={e => setNewBetrag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Betrag (EUR)"
              className="neu-input w-32 text-sm py-1.5 text-right"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKategorie}
              onChange={e => setNewKategorie(e.target.value)}
              placeholder="Kategorie (optional, z.B. Software)"
              className="neu-input flex-1 text-sm py-1.5"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newBetrag.trim()}
              className="neu-btn-primary px-4 py-1.5 text-xs disabled:opacity-40"
            >
              Speichern
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="neu-btn px-3 py-1.5 text-xs"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {expenses.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--neu-text-secondary)' }}>
          Noch keine wiederkehrenden Ausgaben angelegt.
        </p>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-3 px-3 text-xs font-medium" style={{ color: 'var(--neu-accent-mid)' }}>
            <span className="flex-1">Bezeichnung</span>
            <span className="w-24 text-center">Kategorie</span>
            <span className="w-24 text-right">Betrag</span>
            <span className="w-16 text-center">Aktiv</span>
            <span className="w-8" />
          </div>
          {expenses.map(e => (
            <div key={e.id} className="flex items-center gap-3 neu-pressed px-3 py-2.5 rounded-xl"
              style={{ opacity: e.aktiv ? 1 : 0.5 }}>
              <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--neu-text)' }}>{e.name}</span>
              <span className="w-24 text-center text-xs truncate" style={{ color: 'var(--neu-text-secondary)' }}>
                {e.kategorie ?? '—'}
              </span>
              <span className="w-24 text-right text-sm font-semibold" style={{ color: '#ef4444' }}>
                {eur(e.betrag)}
              </span>
              <button onClick={() => handleToggle(e.id)} className="w-16 flex justify-center">
                {e.aktiv
                  ? <ToggleRight className="h-5 w-5" style={{ color: '#10b981' }} />
                  : <ToggleLeft className="h-5 w-5" style={{ color: 'var(--neu-accent-mid)' }} />}
              </button>
              <button onClick={() => handleDelete(e.id)} className="w-8 flex justify-center">
                <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
              </button>
            </div>
          ))}

          {/* Summe */}
          <div className="flex items-center justify-between px-3 pt-3 border-t" style={{ borderColor: 'var(--neu-border)' }}>
            <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Summe aktiver Ausgaben (monatlich)</span>
            <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{eur(aktivSumme)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
