'use client';

import { useState, useTransition } from 'react';
import { Pencil } from 'lucide-react';
import { upsertJahresziel } from '@/lib/actions/jahresziele';

interface Props {
  jahr: number;
  umsatzziel: number;
  einnahmenJahr: number;
  prozentJahr: number;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function JahreszieleView({ jahr, umsatzziel, einnahmenJahr, prozentJahr }: Props) {
  const [editing, setEditing] = useState(umsatzziel === 0);
  const [inputVal, setInputVal] = useState(umsatzziel > 0 ? String(umsatzziel) : '');
  const [, startTransition] = useTransition();

  const prozentZiel = umsatzziel > 0
    ? Math.min(Math.round((einnahmenJahr / umsatzziel) * 100), 100)
    : 0;

  const zielColor = prozentZiel >= 100 ? '#10b981' : prozentZiel >= 50 ? '#3b82f6' : '#f59e0b';

  function handleSave() {
    const val = parseFloat(inputVal.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    startTransition(async () => {
      const result = await upsertJahresziel(jahr, val);
      if (!result.error) {
        setEditing(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="neu-raised p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>
            Jahresziel {jahr}
          </h2>
          {!editing && umsatzziel > 0 && (
            <button
              onClick={() => {
                setInputVal(String(umsatzziel));
                setEditing(true);
              }}
              className="p-2 rounded-lg transition-all hover:opacity-70"
              style={{ color: 'var(--neu-text-secondary)' }}
              title="Ziel bearbeiten"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Kein Ziel oder Edit-Modus */}
        {editing ? (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium" style={{ color: 'var(--neu-text-secondary)' }}>
              Umsatzziel für {jahr} (€)
            </label>
            <input
              type="number"
              min="1"
              step="1000"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="z. B. 150000"
              className="neu-input px-4 py-3 rounded-xl text-lg w-full outline-none"
              style={{ color: 'var(--neu-text)' }}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="neu-btn-primary px-6 py-2 rounded-xl text-sm font-semibold"
              >
                Speichern
              </button>
              {umsatzziel > 0 && (
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2 rounded-xl text-sm"
                  style={{ color: 'var(--neu-text-secondary)' }}
                >
                  Abbrechen
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Fortschrittsansicht */
          <div>
            {/* Große Prozentzahl */}
            <div className="text-center mb-6">
              <p
                className="text-7xl font-bold leading-none"
                style={{ color: zielColor }}
              >
                {prozentZiel}%
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--neu-text-secondary)' }}>
                des Jahresziels erreicht
              </p>
            </div>

            {/* Fortschrittsbalken Ziel */}
            <div
              className="h-4 rounded-full overflow-hidden mb-2"
              style={{ background: 'var(--neu-surface)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${prozentZiel}%`, background: zielColor }}
              />
            </div>

            {/* Jahresfortschritt */}
            <div className="mt-5 mb-2">
              <p className="text-sm mb-2" style={{ color: 'var(--neu-text-secondary)' }}>
                Jahr zu {prozentJahr}% abgelaufen
              </p>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--neu-surface)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${prozentJahr}%`, background: 'var(--neu-border)' }}
                />
              </div>
            </div>

            {/* Detail-Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="neu-pressed p-4 rounded-xl text-center">
                <p className="text-xs mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Ziel</p>
                <p className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>{eur(umsatzziel)}</p>
              </div>
              <div className="neu-pressed p-4 rounded-xl text-center">
                <p className="text-xs mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Erreicht</p>
                <p className="text-base font-bold" style={{ color: zielColor }}>{eur(einnahmenJahr)}</p>
              </div>
              <div className="neu-pressed p-4 rounded-xl text-center">
                <p className="text-xs mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Noch offen</p>
                <p className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>
                  {eur(Math.max(umsatzziel - einnahmenJahr, 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
