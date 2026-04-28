'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus, Pencil, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Eintrag {
  id: string;
  minuten: number;
  datum: string;
  beschreibung: string | null;
  projekt: string | null;
}

interface Abrechnung {
  id: string;
  stunden: number;
  beschreibung: string | null;
  datum: string;
}

interface Konto {
  id: string;
  name: string;
  erfasstStunden: number;
  abgerechnetStunden: number;
  verfuegbar: number;
  eintraege: Eintrag[];
  abrechnungen: Abrechnung[];
}

interface Props {
  konten: Konto[];
}

function formatDatum(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function StundenkontenManager({ konten }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addForUser, setAddForUser] = useState<string | null>(null);
  const [addStunden, setAddStunden] = useState('');
  const [addBeschreibung, setAddBeschreibung] = useState('');
  const [addDatum, setAddDatum] = useState(new Date().toISOString().split('T')[0]);
  const [addTyp, setAddTyp] = useState<'erfasst' | 'abrechnung'>('erfasst');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDeleteEintrag = async (entryId: string) => {
    if (!confirm('Zeiteintrag loeschen?')) return;
    await supabase.from('time_entries').delete().eq('id', entryId);
    router.refresh();
  };

  const handleDeleteAbrechnung = async (id: string) => {
    if (!confirm('Abrechnung loeschen? Die Stunden werden wieder verfuegbar.')) return;
    await supabase.from('stunden_abrechnungen').delete().eq('id', id);
    router.refresh();
  };

  const handleEditMinuten = async (entryId: string) => {
    const minuten = Math.round(parseFloat(editValue.replace(',', '.')) * 60);
    if (isNaN(minuten) || minuten <= 0) return;
    await supabase.from('time_entries').update({ duration_minutes: minuten }).eq('id', entryId);
    setEditId(null);
    router.refresh();
  };

  const handleAdd = async (userId: string) => {
    setError(null);
    const stunden = parseFloat(addStunden.replace(',', '.'));
    if (isNaN(stunden) || stunden <= 0) {
      setError('Bitte eine gueltige Stundenzahl eingeben');
      return;
    }

    setIsSaving(true);

    try {
      // Check user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        setError('Nicht angemeldet — bitte neu einloggen. ' + (authError?.message ?? ''));
        setIsSaving(false);
        return;
      }

      if (addTyp === 'erfasst') {
        const minuten = Math.round(stunden * 60);
        const datum = addDatum || new Date().toISOString().split('T')[0];
        const startTime = new Date(`${datum}T09:00:00`).toISOString();
        const endTime = new Date(`${datum}T09:00:00`).toISOString();
        const { error: insertError, data } = await supabase.from('time_entries').insert({
          user_id: userId,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: minuten,
          description: addBeschreibung || 'Manuell vom Admin hinzugefuegt',
          is_manual: true,
        }).select();
        if (insertError) {
          setError('DB-Fehler: ' + insertError.message + (insertError.code ? ' (' + insertError.code + ')' : '') + (insertError.hint ? ' Hint: ' + insertError.hint : ''));
          setIsSaving(false);
          return;
        }
        if (!data || data.length === 0) {
          setError('Eintrag wurde nicht gespeichert (RLS-Policy verhindert Insert). Pruefe dass du Admin bist und Migration 010 ausgefuehrt wurde.');
          setIsSaving(false);
          return;
        }
      } else {
        const { error: insertError, data } = await supabase.from('stunden_abrechnungen').insert({
          user_id: userId,
          stunden,
          beschreibung: addBeschreibung || 'Manuelle Abrechnung vom Admin',
        }).select();
        if (insertError) {
          setError('DB-Fehler: ' + insertError.message + (insertError.code ? ' (' + insertError.code + ')' : '') + (insertError.hint ? ' Hint: ' + insertError.hint : ''));
          setIsSaving(false);
          return;
        }
        if (!data || data.length === 0) {
          setError('Eintrag wurde nicht gespeichert (RLS-Policy verhindert Insert). Pruefe dass du Admin bist.');
          setIsSaving(false);
          return;
        }
      }

      setAddForUser(null);
      setAddStunden('');
      setAddBeschreibung('');
      setAddDatum(new Date().toISOString().split('T')[0]);
      setIsSaving(false);
      router.refresh();
    } catch (err) {
      setError('Unerwarteter Fehler: ' + (err instanceof Error ? err.message : String(err)));
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {konten.map((konto) => {
        const isExpanded = expanded === konto.id;
        return (
          <div key={konto.id} className="neu-raised overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpanded(isExpanded ? null : konto.id)}
              className="w-full flex items-center justify-between p-5 text-left transition-all hover:opacity-90"
            >
              <div>
                <p className="font-bold text-base" style={{ color: 'var(--neu-text)' }}>{konto.name}</p>
                <div className="flex gap-4 text-xs mt-1" style={{ color: 'var(--neu-text-secondary)' }}>
                  <span>Erfasst: {konto.erfasstStunden.toFixed(1)} Std</span>
                  <span>Abgerechnet: {konto.abgerechnetStunden.toFixed(1)} Std</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold" style={{ color: '#10B981' }}>{konto.verfuegbar.toFixed(1)} Std</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--neu-accent-mid)' }} /> : <ChevronDown className="h-4 w-4" style={{ color: 'var(--neu-accent-mid)' }} />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 space-y-4">
                {/* Add button */}
                {addForUser !== konto.id ? (
                  <button onClick={() => setAddForUser(konto.id)} className="neu-btn flex items-center gap-1 px-3 py-1.5 text-xs" style={{ color: 'var(--neu-accent)' }}>
                    <Plus className="h-3 w-3" /> Stunden hinzufuegen / abziehen
                  </button>
                ) : (
                  <div className="neu-pressed p-4 space-y-3">
                    <div className="flex gap-2">
                      <button onClick={() => setAddTyp('erfasst')} className={`text-xs px-3 py-1 rounded-full ${addTyp === 'erfasst' ? 'neu-pressed font-bold' : 'neu-btn'}`} style={{ color: 'var(--neu-accent)' }}>
                        Stunden gutschreiben
                      </button>
                      <button onClick={() => setAddTyp('abrechnung')} className={`text-xs px-3 py-1 rounded-full ${addTyp === 'abrechnung' ? 'neu-pressed font-bold' : 'neu-btn'}`} style={{ color: 'var(--neu-accent)' }}>
                        Stunden abziehen
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input type="text" value={addStunden} onChange={(e) => setAddStunden(e.target.value)} placeholder="Stunden" className="neu-input w-20 text-sm py-1.5 text-center" />
                      {addTyp === 'erfasst' && (
                        <input type="date" value={addDatum} onChange={(e) => setAddDatum(e.target.value)} className="neu-input w-36 text-sm py-1.5" />
                      )}
                      <input type="text" value={addBeschreibung} onChange={(e) => setAddBeschreibung(e.target.value)} placeholder="Grund / Beschreibung" className="neu-input flex-1 text-sm py-1.5" />
                      <button onClick={() => handleAdd(konto.id)} disabled={isSaving} className="neu-btn-primary px-3 py-1.5 text-xs disabled:opacity-50">
                        {isSaving ? 'Speichere...' : 'Speichern'}
                      </button>
                      <button onClick={() => { setAddForUser(null); setError(null); }} className="neu-btn px-2 py-1.5"><X className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} /></button>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                  </div>
                )}

                {/* Erfasste Stunden */}
                <div>
                  <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--neu-accent-mid)' }}>Erfasste Stunden ({konto.eintraege.length})</h4>
                  <div className="space-y-1 max-h-64 overflow-auto">
                    {konto.eintraege.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 neu-pressed px-3 py-2 group text-xs">
                        <span className="w-16" style={{ color: 'var(--neu-text-secondary)' }}>{formatDatum(e.datum)}</span>
                        {e.projekt && <span className="font-medium" style={{ color: 'var(--neu-accent)' }}>{e.projekt}</span>}
                        <span className="flex-1 truncate" style={{ color: 'var(--neu-text-secondary)' }}>{e.beschreibung || ''}</span>

                        {editId === e.id ? (
                          <div className="flex items-center gap-1">
                            <input type="text" value={editValue} onChange={(ev) => setEditValue(ev.target.value)} className="neu-input w-16 text-xs py-0.5 text-center" />
                            <button onClick={() => handleEditMinuten(e.id)} className="p-0.5"><Check className="h-3.5 w-3.5" style={{ color: '#10B981' }} /></button>
                            <button onClick={() => setEditId(null)} className="p-0.5"><X className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} /></button>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold w-14 text-right" style={{ color: 'var(--neu-text)' }}>{(e.minuten / 60).toFixed(1)} Std</span>
                            <button onClick={() => { setEditId(e.id); setEditValue((e.minuten / 60).toFixed(1)); }} className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity">
                              <Pencil className="h-3 w-3" style={{ color: 'var(--neu-accent-mid)' }} />
                            </button>
                          </>
                        )}

                        <button onClick={() => handleDeleteEintrag(e.id)} className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity">
                          <Trash2 className="h-3 w-3" style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    ))}
                    {konto.eintraege.length === 0 && (
                      <p className="text-xs py-2" style={{ color: 'var(--neu-accent-mid)' }}>Keine Eintraege</p>
                    )}
                  </div>
                </div>

                {/* Abrechnungen */}
                {konto.abrechnungen.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--neu-accent-mid)' }}>Abrechnungen ({konto.abrechnungen.length})</h4>
                    <div className="space-y-1 max-h-40 overflow-auto">
                      {konto.abrechnungen.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 neu-pressed px-3 py-2 group text-xs">
                          <span className="w-16" style={{ color: 'var(--neu-text-secondary)' }}>{formatDatum(a.datum)}</span>
                          <span className="flex-1 truncate" style={{ color: 'var(--neu-text-secondary)' }}>{a.beschreibung || ''}</span>
                          <span className="font-bold w-14 text-right" style={{ color: '#EF4444' }}>-{a.stunden.toFixed(1)} Std</span>
                          <button onClick={() => handleDeleteAbrechnung(a.id)} className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity">
                            <Trash2 className="h-3 w-3" style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
