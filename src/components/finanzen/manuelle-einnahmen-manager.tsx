'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { createManuelleEinnahme, deleteManuelleEinnahme } from '@/lib/actions/manuelle-einnahmen';

const MONAT_LABELS: Record<string, string> = {
  '01': 'Januar', '02': 'Februar', '03': 'März', '04': 'April',
  '05': 'Mai', '06': 'Juni', '07': 'Juli', '08': 'August',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Dezember',
};

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export interface ManuelleEinnahme {
  id: string;
  monat: string;
  bezeichnung: string;
  betrag: number;
}

interface Props {
  jahr: number;
  einnahmen: ManuelleEinnahme[];
}

export function ManuelleEinnahmenManager({ jahr, einnahmen }: Props) {
  const [open, setOpen] = useState(false);
  const [monat, setMonat] = useState(`${jahr}-01`);
  const [bezeichnung, setBezeichnung] = useState('');
  const [betrag, setBetrag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Month options for the current year
  const monatOptions = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return { value: `${jahr}-${m}`, label: `${MONAT_LABELS[m]} ${jahr}` };
  });

  // Group by month
  const byMonat: Record<string, ManuelleEinnahme[]> = {};
  for (const e of einnahmen) {
    if (!byMonat[e.monat]) byMonat[e.monat] = [];
    byMonat[e.monat].push(e);
  }
  const sortedMonths = Object.keys(byMonat).sort((a, b) => b.localeCompare(a));

  const gesamt = einnahmen.reduce((s, e) => s + e.betrag, 0);

  function handleAdd() {
    setError(null);
    const val = parseFloat(betrag.replace(',', '.'));
    if (!bezeichnung.trim()) { setError('Bezeichnung eingeben'); return; }
    if (isNaN(val) || val <= 0) { setError('Gültigen Betrag eingeben'); return; }
    startTransition(async () => {
      const result = await createManuelleEinnahme(monat, bezeichnung, val);
      if (result.error) { setError(result.error); return; }
      setBezeichnung('');
      setBetrag('');
      setOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteManuelleEinnahme(id);
    });
  }

  return (
    <div className="neu-raised p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
            Manuelle Einnahmen
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-secondary)' }}>
            Einnahmen ohne Projekt — fließen in Jahresziel und Finanzübersicht ein
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="neu-btn flex items-center gap-1.5 px-3 py-2 text-xs font-medium"
          style={{ color: 'var(--neu-accent)' }}
        >
          {open ? <><ChevronUp className="h-3.5 w-3.5" /> Schließen</> : <><Plus className="h-3.5 w-3.5" /> Neue Einnahme</>}
        </button>
      </div>

      {/* Eingabe-Formular */}
      {open && (
        <div className="neu-pressed p-4 rounded-xl mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Monat</label>
              <select
                value={monat}
                onChange={e => setMonat(e.target.value)}
                className="neu-input w-full text-sm py-2"
              >
                {monatOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Bezeichnung</label>
              <input
                type="text"
                value={bezeichnung}
                onChange={e => setBezeichnung(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="z. B. Beratungshonorar"
                className="neu-input w-full text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Betrag (€)</label>
              <input
                type="text"
                value={betrag}
                onChange={e => setBetrag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="z. B. 2500"
                className="neu-input w-full text-sm py-2 text-right"
              />
            </div>
          </div>
          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
          <button
            onClick={handleAdd}
            className="neu-btn-primary px-5 py-2 text-sm font-medium"
          >
            Einnahme hinzufügen
          </button>
        </div>
      )}

      {/* Liste */}
      {einnahmen.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
          Noch keine manuellen Einnahmen eingetragen.
        </p>
      ) : (
        <div className="space-y-4">
          {sortedMonths.map(m => {
            const [, mm] = m.split('-');
            const label = `${MONAT_LABELS[mm] ?? mm} ${jahr}`;
            const summe = byMonat[m].reduce((s, e) => s + e.betrag, 0);
            return (
              <div key={m}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--neu-text-secondary)' }}>
                    {label}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: '#10b981' }}>{eur(summe)}</span>
                </div>
                <div className="space-y-1.5">
                  {byMonat[m].map(e => (
                    <div key={e.id} className="neu-pressed px-3 py-2 rounded-xl flex items-center gap-3">
                      <span className="flex-1 text-sm" style={{ color: 'var(--neu-text)' }}>{e.bezeichnung}</span>
                      <span className="text-sm font-semibold" style={{ color: '#10b981' }}>{eur(e.betrag)}</span>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1 hover:opacity-70 transition-opacity"
                        title="Löschen"
                      >
                        <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-text-secondary)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="h-px" style={{ background: 'var(--neu-border)' }} />
          <div className="flex justify-between px-1">
            <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>Gesamt {jahr}</span>
            <span className="text-sm font-bold" style={{ color: '#10b981' }}>{eur(gesamt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
