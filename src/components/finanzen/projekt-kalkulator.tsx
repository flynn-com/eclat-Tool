'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, X, ChevronDown, FileText, Search } from 'lucide-react';
import type { MonatsabrechnungSettings } from '@/lib/settings';
import type { PdfKalkData } from '@/lib/pdf-projektkalkulation';

interface Persona {
  id: string;
  name: string;
  stundensatz: number;
}

interface Leistung {
  id: string;
  name: string;
  stundensatz: number;
}

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  day_rate: number | null;
}

interface EquipmentPaket {
  id: string;
  name: string;
  day_rate: number | null;
}

interface Kunde {
  id: string;
  firma: string;
  ansprechpartner: string | null;
}

interface Props {
  leistungen: Leistung[];
  equipmentItems: EquipmentItem[];
  equipmentPakete: EquipmentPaket[];
  settings: MonatsabrechnungSettings;
  personas: Persona[];
  kunden: Kunde[];
}

// A selected leistung instance in the kalkulation
interface SelectedLeistung {
  instanceId: string;
  leistungId: string;
  leistungName: string;
  stundensatz: number;
  stunden: string;
}

// A custom position
interface EigenePosition {
  id: string;
  bezeichnung: string;
  stunden: string;
  persona_id: string | null;
}

// Direct persona time entry
interface PersonaDirect {
  id: string;
  personaId: string;
  stunden: string;
}

// Selected equipment row
interface EquipmentRow {
  id: string;
  name: string;
  tagessatz: string;
  tage: string;
}

function eur(v: number) {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function StundenQuickset({ onSet }: { onSet: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onSet('4')}
        className="px-1.5 py-0.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
        style={{ background: 'var(--neu-accent)22', color: 'var(--neu-accent)', border: '1px solid var(--neu-accent)44' }}
      >
        ½T
      </button>
      <button
        type="button"
        onClick={() => onSet('8')}
        className="px-1.5 py-0.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
        style={{ background: 'var(--neu-accent)22', color: 'var(--neu-accent)', border: '1px solid var(--neu-accent)44' }}
      >
        1T
      </button>
    </div>
  );
}

function PersonaBadge({ persona }: { persona: Persona | undefined }) {
  if (!persona) return null;
  const color = 'var(--neu-accent)';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: color + '22', color, border: `1px solid ${color}55` }}
    >
      {persona.name}
    </span>
  );
}

export function ProjektKalkulator({ leistungen, equipmentItems, equipmentPakete, settings, personas, kunden }: Props) {
  const [projektname, setProjektname] = useState('');
  const [kunde, setKunde] = useState('');
  const [kundeSearch, setKundeSearch] = useState('');
  const [showKundeDropdown, setShowKundeDropdown] = useState(false);
  const [selectedLeistungen, setSelectedLeistungen] = useState<SelectedLeistung[]>([]);
  const [eigenePsn, setEigenePsn] = useState<EigenePosition[]>([]);
  const [personaDirect, setPersonaDirect] = useState<PersonaDirect[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);

  // UI state
  const [showLeistungDropdown, setShowLeistungDropdown] = useState(false);
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false);
  const [equipmentPickerTab, setEquipmentPickerTab] = useState<'einzeln' | 'pakete'>('einzeln');
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // ---- Derived calculations ----

  // Collect all billable items
  const billableItems = useMemo(() => {
    const items: { stunden: number; persona_id: string | null; leistung_id?: string | null }[] = [];
    for (const sl of selectedLeistungen) {
      items.push({
        stunden: parseFloat(sl.stunden.replace(',', '.')) || 0,
        persona_id: null,
        leistung_id: sl.leistungId,
      });
    }
    for (const pos of eigenePsn) {
      items.push({
        stunden: parseFloat(pos.stunden.replace(',', '.')) || 0,
        persona_id: pos.persona_id,
        leistung_id: null,
      });
    }
    for (const pd of personaDirect) {
      items.push({
        stunden: parseFloat(pd.stunden.replace(',', '.')) || 0,
        persona_id: pd.personaId,
        leistung_id: null,
      });
    }
    return items;
  }, [selectedLeistungen, eigenePsn, personaDirect]);

  const stundenGesamt = useMemo(
    () => Math.round(billableItems.reduce((s, i) => s + i.stunden, 0) * 100) / 100,
    [billableItems]
  );

  // Group costs by leistung or persona for summary
  const personenKosten = useMemo(() => {
    const map = new Map<string, { name: string; stunden: number; stundensatz: number }>();

    for (const item of billableItems) {
      const leistung = item.leistung_id ? leistungen.find((l) => l.id === item.leistung_id) : null;
      const persona = !leistung && item.persona_id ? personas.find((p) => p.id === item.persona_id) : null;
      const key = leistung ? `leistung_${leistung.id}` : persona ? persona.id : '__sonstige__';
      const name = leistung ? leistung.name : persona ? persona.name : 'Sonstige';
      const stundensatz = leistung ? leistung.stundensatz : persona ? persona.stundensatz : settings.stundenSatz;
      const existing = map.get(key);
      if (existing) {
        existing.stunden += item.stunden;
      } else {
        map.set(key, { name, stunden: item.stunden, stundensatz });
      }
    }

    return Array.from(map.entries())
      .filter(([, v]) => v.stunden > 0)
      .map(([, v]) => ({
        name: v.name,
        stunden: Math.round(v.stunden * 100) / 100,
        stundensatz: v.stundensatz,
        kosten: Math.round(v.stunden * v.stundensatz * 100) / 100,
      }));
  }, [billableItems, leistungen, personas, settings.stundenSatz]);

  const stundenKosten = useMemo(
    () => Math.round(personenKosten.reduce((s, pk) => s + pk.kosten, 0) * 100) / 100,
    [personenKosten]
  );

  const steuerBetrag = Math.round(stundenKosten * (settings.steuerProzent / 100) * 100) / 100;
  const investBetrag = Math.round(stundenKosten * (settings.investProzent / 100) * 100) / 100;

  const equipmentKosten = useMemo(() => {
    return equipment.reduce((sum, e) => {
      const ts = parseFloat(e.tagessatz.replace(',', '.')) || 0;
      const tg = parseFloat(e.tage.replace(',', '.')) || 0;
      return sum + ts * tg;
    }, 0);
  }, [equipment]);

  const gesamtKosten = Math.round((stundenKosten + steuerBetrag + investBetrag + equipmentKosten) * 100) / 100;

  // ---- Leistung actions ----
  function addLeistung(l: Leistung) {
    setSelectedLeistungen((prev) => [
      ...prev,
      {
        instanceId: `${l.id}-${Date.now()}`,
        leistungId: l.id,
        leistungName: l.name,
        stundensatz: l.stundensatz,
        stunden: '1',
      },
    ]);
    setShowLeistungDropdown(false);
  }

  function removeLeistung(instanceId: string) {
    setSelectedLeistungen((prev) => prev.filter((sl) => sl.instanceId !== instanceId));
  }

  function updateLeistungStunden(instanceId: string, value: string) {
    setSelectedLeistungen((prev) =>
      prev.map((sl) => (sl.instanceId === instanceId ? { ...sl, stunden: value } : sl))
    );
  }

  // ---- Eigene Positionen ----
  function addEigenePosition() {
    setEigenePsn((prev) => [
      ...prev,
      { id: `ep-${Date.now()}`, bezeichnung: '', stunden: '', persona_id: null },
    ]);
  }

  function updateEigenePosition(id: string, field: 'bezeichnung' | 'stunden', value: string) {
    setEigenePsn((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function updateEigenePositionPersona(id: string, personaId: string | null) {
    setEigenePsn((prev) =>
      prev.map((p) => (p.id === id ? { ...p, persona_id: personaId } : p))
    );
  }

  function removeEigenePosition(id: string) {
    setEigenePsn((prev) => prev.filter((p) => p.id !== id));
  }

  // ---- Persona Direct ----
  function addPersonaDirect(persona: Persona) {
    setPersonaDirect((prev) => [
      ...prev,
      { id: `pd-${Date.now()}`, personaId: persona.id, stunden: '1' },
    ]);
    setShowPersonaDropdown(false);
  }

  function updatePersonaDirectStunden(id: string, value: string) {
    setPersonaDirect((prev) =>
      prev.map((pd) => (pd.id === id ? { ...pd, stunden: value } : pd))
    );
  }

  function removePersonaDirect(id: string) {
    setPersonaDirect((prev) => prev.filter((pd) => pd.id !== id));
  }

  // ---- Equipment ----
  function addEquipmentItem(item: EquipmentItem) {
    setEquipment((prev) => [
      ...prev,
      {
        id: `eq-${Date.now()}`,
        name: item.name,
        tagessatz: item.day_rate !== null ? String(item.day_rate) : '',
        tage: '1',
      },
    ]);
    setShowEquipmentPicker(false);
    setEquipmentSearch('');
  }

  function addEquipmentPaket(paket: EquipmentPaket) {
    setEquipment((prev) => [
      ...prev,
      {
        id: `eq-${Date.now()}`,
        name: paket.name,
        tagessatz: paket.day_rate !== null ? String(paket.day_rate) : '',
        tage: '1',
      },
    ]);
    setShowEquipmentPicker(false);
  }

  function updateEquipmentRow(id: string, field: 'tagessatz' | 'tage', value: string) {
    setEquipment((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function removeEquipmentRow(id: string) {
    setEquipment((prev) => prev.filter((e) => e.id !== id));
  }

  const filteredEquipment = equipmentItems.filter((e) =>
    e.name.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  // ---- PDF ----
  async function handlePdf() {
    setIsPdfLoading(true);
    try {
      const { generateProjektkalkulationPdf } = await import('@/lib/pdf-projektkalkulation');
      const allPositionen: { bezeichnung: string; stunden: number; personaName?: string; stundensatz?: number }[] = [];

      for (const sl of selectedLeistungen) {
        allPositionen.push({
          bezeichnung: sl.leistungName,
          stunden: parseFloat(sl.stunden.replace(',', '.')) || 0,
          stundensatz: sl.stundensatz,
        });
      }

      for (const pos of eigenePsn) {
        if (pos.bezeichnung.trim()) {
          const persona = personas.find((p) => p.id === pos.persona_id);
          allPositionen.push({
            bezeichnung: pos.bezeichnung,
            stunden: parseFloat(pos.stunden.replace(',', '.')) || 0,
            personaName: persona?.name,
            stundensatz: persona?.stundensatz ?? settings.stundenSatz,
          });
        }
      }
      for (const pd of personaDirect) {
        const persona = personas.find((p) => p.id === pd.personaId);
        if (persona) {
          allPositionen.push({
            bezeichnung: persona.name,
            stunden: parseFloat(pd.stunden.replace(',', '.')) || 0,
            personaName: persona.name,
            stundensatz: persona.stundensatz,
          });
        }
      }

      const eqData = equipment.map((e) => {
        const ts = parseFloat(e.tagessatz.replace(',', '.')) || 0;
        const tg = parseFloat(e.tage.replace(',', '.')) || 0;
        return { name: e.name, tagessatz: ts, tage: tg, gesamt: ts * tg };
      });

      const now = new Date();
      const datum = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const pdfData: PdfKalkData = {
        projektname: projektname || 'Unbenanntes Projekt',
        kunde: kunde || '—',
        datum,
        erstelltVon: '',
        positionen: allPositionen,
        personenKosten,
        equipment: eqData,
        stundenGesamt,
        stundenKosten,
        steuerProzent: settings.steuerProzent,
        steuerBetrag,
        investProzent: settings.investProzent,
        investBetrag,
        equipmentKosten,
        gesamtKosten,
      };

      const doc = await generateProjektkalkulationPdf(pdfData);
      const filename = `Kalkulation_${(projektname || 'Projekt').replace(/\s+/g, '_')}_${datum.replace(/\./g, '-')}.pdf`;
      doc.save(filename);
    } finally {
      setIsPdfLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Projektinfo */}
      <div className="neu-raised p-5">
        <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
          Projektinformationen
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Projektname</label>
            <input
              className="neu-input w-full"
              placeholder="z.B. Imagefilm XY"
              value={projektname}
              onChange={(e) => setProjektname(e.target.value)}
            />
          </div>
          <div className="relative">
            <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Kunde</label>
            <input
              className="neu-input w-full"
              placeholder="Kundenname oder suchen…"
              value={kunde}
              onChange={(e) => { setKunde(e.target.value); setKundeSearch(e.target.value); setShowKundeDropdown(true); }}
              onFocus={() => { setKundeSearch(kunde); setShowKundeDropdown(true); }}
              onBlur={() => setTimeout(() => setShowKundeDropdown(false), 150)}
              autoComplete="off"
            />
            {showKundeDropdown && (() => {
              const q = kundeSearch.toLowerCase();
              const filtered = kunden.filter(k => k.firma.toLowerCase().includes(q) || (k.ansprechpartner ?? '').toLowerCase().includes(q));
              if (filtered.length === 0) return null;
              return (
                <div
                  className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl shadow-lg overflow-hidden"
                  style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}
                >
                  {filtered.slice(0, 8).map(k => (
                    <button
                      key={k.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm transition-opacity hover:opacity-70"
                      style={{ color: 'var(--neu-text)' }}
                      onMouseDown={() => { setKunde(k.firma); setShowKundeDropdown(false); }}
                    >
                      <span className="font-medium">{k.firma}</span>
                      {k.ansprechpartner && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                          {k.ansprechpartner}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Section 2: Dienstleistung */}
      <div className="neu-raised p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
            Dienstleistung
          </h2>
          <div className="relative">
            <button
              className="neu-btn flex items-center gap-2 text-sm px-3 py-2"
              onClick={() => setShowLeistungDropdown((v) => !v)}
            >
              <Plus className="h-4 w-4" />
              Leistung hinzufügen
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showLeistungDropdown && (
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg min-w-[220px] overflow-hidden"
                style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}
              >
                {leistungen.length === 0 ? (
                  <div className="px-4 py-3 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
                    Keine Leistungen vorhanden
                  </div>
                ) : (
                  leistungen.map((l) => (
                    <button
                      key={l.id}
                      className="w-full text-left px-4 py-2.5 text-sm transition-opacity hover:opacity-70"
                      style={{ color: 'var(--neu-text)' }}
                      onClick={() => addLeistung(l)}
                    >
                      <span className="font-medium">{l.name}</span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                        {l.stundensatz.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Std
                      </span>
                    </button>
                  ))
                )}
                <button
                  className="w-full text-left px-4 py-2 text-xs border-t"
                  style={{ color: 'var(--neu-text-secondary)', borderColor: 'var(--neu-border)' }}
                  onClick={() => setShowLeistungDropdown(false)}
                >
                  Schließen
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Selected Leistungen */}
          {selectedLeistungen.map((sl) => {
            const stunden = parseFloat(sl.stunden.replace(',', '.')) || 0;
            const kosten = stunden * sl.stundensatz;
            return (
              <div key={sl.instanceId} className="neu-pressed px-3 py-2 rounded-xl flex items-center gap-3 flex-wrap">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: 'var(--neu-accent)22',
                    color: 'var(--neu-accent)',
                    border: '1px solid var(--neu-accent)55',
                  }}
                >
                  {sl.leistungName}
                </span>
                <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                  {sl.stundensatz.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Std
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    className="neu-input text-sm w-20"
                    type="number"
                    step="0.5"
                    min="0"
                    value={sl.stunden}
                    onChange={(e) => updateLeistungStunden(sl.instanceId, e.target.value)}
                  />
                  <StundenQuickset onSet={(v) => updateLeistungStunden(sl.instanceId, v)} />
                  <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Std</span>
                </div>
                <span className="text-sm font-medium flex-1 text-right" style={{ color: 'var(--neu-text)' }}>
                  {eur(kosten)}
                </span>
                <button
                  onClick={() => removeLeistung(sl.instanceId)}
                  className="p-1 hover:opacity-70"
                  style={{ color: '#ef4444' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {/* Eigene Positionen */}
          <div className="neu-pressed px-4 py-3 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--neu-text-secondary)' }}>
                Eigene Positionen
              </span>
              <button
                className="neu-btn flex items-center gap-1 text-xs px-2 py-1"
                onClick={addEigenePosition}
              >
                <Plus className="h-3.5 w-3.5" />
                Hinzufügen
              </button>
            </div>
            {eigenePsn.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                Keine eigenen Positionen.
              </p>
            )}
            <div className="space-y-1.5">
              {eigenePsn.map((pos) => {
                const posPersona = personas.find((p) => p.id === pos.persona_id);
                return (
                  <div key={pos.id} className="flex items-center gap-2 flex-wrap">
                    <input
                      className="neu-input text-sm flex-1 min-w-[120px]"
                      placeholder="Bezeichnung"
                      value={pos.bezeichnung}
                      onChange={(e) => updateEigenePosition(pos.id, 'bezeichnung', e.target.value)}
                    />
                    <input
                      className="neu-input text-sm w-20"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0"
                      value={pos.stunden}
                      onChange={(e) => updateEigenePosition(pos.id, 'stunden', e.target.value)}
                    />
                    <StundenQuickset onSet={(v) => updateEigenePosition(pos.id, 'stunden', v)} />
                    <span className="text-xs w-6" style={{ color: 'var(--neu-text-secondary)' }}>Std</span>
                    <select
                      className="neu-input text-sm"
                      value={pos.persona_id ?? ''}
                      onChange={(e) => updateEigenePositionPersona(pos.id, e.target.value || null)}
                    >
                      <option value="">— kein</option>
                      {personas.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {posPersona && <PersonaBadge persona={posPersona} />}
                    <button
                      onClick={() => removeEigenePosition(pos.id)}
                      className="p-1 hover:opacity-70"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stunden Footer */}
        <div className="mt-4 flex justify-end">
          <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
            Stunden gesamt:{' '}
            <span style={{ color: 'var(--neu-accent)' }}>{stundenGesamt.toFixed(1)} Std</span>
          </span>
        </div>
      </div>

      {/* Section 2b: Personas direkt */}
      {personas.length > 0 && (
        <div className="neu-raised p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
              Personas
            </h2>
            <div className="relative">
              <button
                className="neu-btn flex items-center gap-2 text-sm px-3 py-2"
                onClick={() => setShowPersonaDropdown((v) => !v)}
              >
                <Plus className="h-4 w-4" />
                Persona hinzufügen
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showPersonaDropdown && (
                <div
                  className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg min-w-[200px] overflow-hidden"
                  style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}
                >
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-4 py-2.5 text-sm transition-opacity hover:opacity-70"
                      style={{ color: 'var(--neu-text)' }}
                      onClick={() => addPersonaDirect(p)}
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                        {p.stundensatz.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Std
                      </span>
                    </button>
                  ))}
                  <button
                    className="w-full text-left px-4 py-2 text-xs border-t"
                    style={{ color: 'var(--neu-text-secondary)', borderColor: 'var(--neu-border)' }}
                    onClick={() => setShowPersonaDropdown(false)}
                  >
                    Schließen
                  </button>
                </div>
              )}
            </div>
          </div>

          {personaDirect.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
              Keine direkten Persona-Zeiten. Füge Personas direkt hinzu für Zeiten außerhalb von Leistungen.
            </p>
          )}

          <div className="space-y-2">
            {personaDirect.map((pd) => {
              const persona = personas.find((p) => p.id === pd.personaId);
              if (!persona) return null;
              const stunden = parseFloat(pd.stunden.replace(',', '.')) || 0;
              const kosten = stunden * persona.stundensatz;
              return (
                <div key={pd.id} className="neu-pressed px-3 py-2 rounded-xl flex items-center gap-3 flex-wrap">
                  <PersonaBadge persona={persona} />
                  <span className="text-xs flex-1" style={{ color: 'var(--neu-text-secondary)' }}>
                    {persona.stundensatz.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Std
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      className="neu-input text-sm w-20"
                      type="number"
                      step="0.5"
                      min="0"
                      value={pd.stunden}
                      onChange={(e) => updatePersonaDirectStunden(pd.id, e.target.value)}
                    />
                    <StundenQuickset onSet={(v) => updatePersonaDirectStunden(pd.id, v)} />
                    <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Std</span>
                  </div>
                  <span className="text-sm font-medium w-24 text-right" style={{ color: 'var(--neu-text)' }}>
                    {eur(kosten)}
                  </span>
                  <button
                    onClick={() => removePersonaDirect(pd.id)}
                    className="p-1 hover:opacity-70"
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Equipment */}
      <div className="neu-raised p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
            Equipment
          </h2>
          <div className="relative">
            <button
              className="neu-btn flex items-center gap-2 text-sm px-3 py-2"
              onClick={() => setShowEquipmentPicker((v) => !v)}
            >
              <Plus className="h-4 w-4" />
              Equipment hinzufügen
            </button>
            {showEquipmentPicker && (
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg w-72 overflow-hidden"
                style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}
              >
                {/* Tabs */}
                <div className="flex items-center gap-1 p-2 border-b" style={{ borderColor: 'var(--neu-border)' }}>
                  <button
                    className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={equipmentPickerTab === 'einzeln'
                      ? { background: 'var(--neu-accent)', color: '#fff' }
                      : { background: 'transparent', color: 'var(--neu-text-secondary)' }}
                    onClick={() => setEquipmentPickerTab('einzeln')}
                  >
                    Einzeln
                  </button>
                  <button
                    className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={equipmentPickerTab === 'pakete'
                      ? { background: 'var(--neu-accent)', color: '#fff' }
                      : { background: 'transparent', color: 'var(--neu-text-secondary)' }}
                    onClick={() => setEquipmentPickerTab('pakete')}
                  >
                    Pakete
                  </button>
                </div>

                {equipmentPickerTab === 'einzeln' && (
                  <>
                    <div className="p-2 border-b" style={{ borderColor: 'var(--neu-border)' }}>
                      <div className="flex items-center gap-2 neu-pressed rounded-xl px-3 py-1.5">
                        <Search className="h-3.5 w-3.5" style={{ color: 'var(--neu-text-secondary)' }} />
                        <input
                          className="bg-transparent text-sm outline-none flex-1"
                          style={{ color: 'var(--neu-text)' }}
                          placeholder="Suchen..."
                          value={equipmentSearch}
                          onChange={(e) => setEquipmentSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {filteredEquipment.length === 0 ? (
                        <div className="px-4 py-3 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
                          Kein Equipment gefunden
                        </div>
                      ) : (
                        filteredEquipment.map((item) => (
                          <button
                            key={item.id}
                            className="w-full text-left px-4 py-2.5 text-sm transition-opacity hover:opacity-70"
                            style={{ color: 'var(--neu-text)' }}
                            onClick={() => addEquipmentItem(item)}
                          >
                            <span className="font-medium">{item.name}</span>
                            {item.day_rate !== null && (
                              <span className="ml-2 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                                {item.day_rate} €/Tag
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}

                {equipmentPickerTab === 'pakete' && (
                  <div className="max-h-56 overflow-y-auto">
                    {equipmentPakete.length === 0 ? (
                      <div className="px-4 py-3 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
                        Keine Equipment-Pakete vorhanden
                      </div>
                    ) : (
                      equipmentPakete.map((paket) => (
                        <div
                          key={paket.id}
                          className="flex items-center justify-between px-4 py-2.5 border-b last:border-0"
                          style={{ borderColor: 'var(--neu-border)' }}
                        >
                          <div>
                            <span className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>
                              {paket.name}
                            </span>
                            {paket.day_rate !== null && (
                              <span className="ml-2 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                                {paket.day_rate.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Tag
                              </span>
                            )}
                          </div>
                          <button
                            className="neu-btn-primary text-xs px-2 py-1 ml-2"
                            onClick={() => addEquipmentPaket(paket)}
                          >
                            Hinzufügen
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <button
                  className="w-full text-left px-4 py-2 text-xs border-t"
                  style={{ color: 'var(--neu-text-secondary)', borderColor: 'var(--neu-border)' }}
                  onClick={() => { setShowEquipmentPicker(false); setEquipmentSearch(''); }}
                >
                  Schließen
                </button>
              </div>
            )}
          </div>
        </div>

        {equipment.length === 0 && (
          <p className="text-sm mb-2" style={{ color: 'var(--neu-text-secondary)' }}>
            Kein Equipment ausgewählt.
          </p>
        )}

        <div className="space-y-2">
          {equipment.map((row) => (
            <div key={row.id} className="neu-pressed px-3 py-2 rounded-xl flex items-center gap-2 flex-wrap">
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--neu-text)' }}>
                {row.name}
              </span>
              <div className="flex items-center gap-1">
                <label className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Tagessatz</label>
                <input
                  className="neu-input text-sm w-24"
                  type="number"
                  step="1"
                  min="0"
                  value={row.tagessatz}
                  onChange={(e) => updateEquipmentRow(row.id, 'tagessatz', e.target.value)}
                />
                <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>€</span>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Tage</label>
                <input
                  className="neu-input text-sm w-16"
                  type="number"
                  step="0.5"
                  min="0"
                  value={row.tage}
                  onChange={(e) => updateEquipmentRow(row.id, 'tage', e.target.value)}
                />
              </div>
              <button
                onClick={() => removeEquipmentRow(row.id)}
                className="p-1 hover:opacity-70"
                style={{ color: '#ef4444' }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
            Equipmentkosten:{' '}
            <span style={{ color: 'var(--neu-accent)' }}>{eur(equipmentKosten)}</span>
          </span>
        </div>
      </div>

      {/* Section 4: Kalkulation Summary */}
      <div className="neu-raised p-5">
        <h2 className="text-base font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
          Kalkulation
        </h2>
        <div className="space-y-1.5">
          {/* Per-leistung/persona cost rows */}
          {personenKosten.map((pk) => (
            <div key={pk.name} className="neu-pressed px-4 py-2 flex justify-between rounded-xl items-center">
              <span className="text-sm" style={{ color: 'var(--neu-text)' }}>{pk.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                  {pk.stunden.toFixed(1)} Std × {pk.stundensatz.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Std
                </span>
                <span className="text-sm font-medium w-28 text-right" style={{ color: 'var(--neu-text)' }}>
                  {eur(pk.kosten)}
                </span>
              </div>
            </div>
          ))}

          {personenKosten.length > 0 && (
            <div className="neu-pressed px-4 py-2 flex justify-between rounded-xl items-center">
              <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
                Stundenkosten gesamt
              </span>
              <span className="text-sm font-semibold w-28 text-right" style={{ color: 'var(--neu-text)' }}>
                {eur(stundenKosten)}
              </span>
            </div>
          )}

          {personenKosten.length === 0 && (
            <div className="neu-pressed px-4 py-2 flex justify-between rounded-xl items-center">
              <span className="text-sm" style={{ color: 'var(--neu-text)' }}>Stundenkosten</span>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                  {stundenGesamt.toFixed(1)} Std × {settings.stundenSatz} €/Std
                </span>
                <span className="text-sm font-medium w-28 text-right" style={{ color: 'var(--neu-text)' }}>
                  {eur(stundenKosten)}
                </span>
              </div>
            </div>
          )}

          <div className="neu-pressed px-4 py-2 flex justify-between rounded-xl items-center">
            <span className="text-sm" style={{ color: 'var(--neu-text)' }}>
              Steuerrücklage ({settings.steuerProzent}%)
            </span>
            <span className="text-sm font-medium w-28 text-right" style={{ color: 'var(--neu-text)' }}>
              {eur(steuerBetrag)}
            </span>
          </div>
          <div className="neu-pressed px-4 py-2 flex justify-between rounded-xl items-center">
            <span className="text-sm" style={{ color: 'var(--neu-text)' }}>
              Investrücklage ({settings.investProzent}%)
            </span>
            <span className="text-sm font-medium w-28 text-right" style={{ color: 'var(--neu-text)' }}>
              {eur(investBetrag)}
            </span>
          </div>
          <div className="neu-pressed px-4 py-2 flex justify-between rounded-xl items-center">
            <span className="text-sm" style={{ color: 'var(--neu-text)' }}>Equipment</span>
            <span className="text-sm font-medium w-28 text-right" style={{ color: 'var(--neu-text)' }}>
              {eur(equipmentKosten)}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px my-1" style={{ background: 'var(--neu-border)' }} />

          <div className="neu-pressed px-4 py-3 flex justify-between rounded-xl items-center">
            <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              Gesamtkosten (netto)
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--neu-accent)' }}>
              {eur(gesamtKosten)}
            </span>
          </div>
        </div>

        {/* PDF Button */}
        <div className="mt-5 flex justify-end">
          <button
            className="neu-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
            onClick={handlePdf}
            disabled={isPdfLoading}
          >
            <FileText className="h-4 w-4" />
            {isPdfLoading ? 'Wird erstellt…' : 'Kalkulation als PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
