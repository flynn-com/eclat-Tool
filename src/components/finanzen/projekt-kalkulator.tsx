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

interface PaketPositionTemplate {
  id: string;
  bezeichnung: string;
  stunden: number;
  persona_id: string | null;
}

interface PaketTemplate {
  id: string;
  name: string;
  positionen: PaketPositionTemplate[];
}

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  day_rate: number | null;
}

interface EquipmentPaketItem {
  equipment_item_id: string;
  name: string;
  day_rate: number | null;
  tage: number;
}

interface EquipmentPaket {
  id: string;
  name: string;
  items: EquipmentPaketItem[];
}

interface Props {
  pakete: PaketTemplate[];
  equipmentItems: EquipmentItem[];
  equipmentPakete: EquipmentPaket[];
  settings: MonatsabrechnungSettings;
  personas: Persona[];
}

// A selected paket group in the kalkulation
interface SelectedPaket {
  instanceId: string; // unique per added instance
  paketId: string;
  paketName: string;
  positionen: { id: string; bezeichnung: string; stunden: string; persona_id: string | null }[];
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

export function ProjektKalkulator({ pakete, equipmentItems, equipmentPakete, settings, personas }: Props) {
  const [projektname, setProjektname] = useState('');
  const [kunde, setKunde] = useState('');
  const [selectedPakete, setSelectedPakete] = useState<SelectedPaket[]>([]);
  const [eigenePsn, setEigenePsn] = useState<EigenePosition[]>([]);
  const [personaDirect, setPersonaDirect] = useState<PersonaDirect[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);

  // UI state
  const [showPaketDropdown, setShowPaketDropdown] = useState(false);
  const [showEquipmentPicker, setShowEquipmentPicker] = useState(false);
  const [equipmentPickerTab, setEquipmentPickerTab] = useState<'einzeln' | 'pakete'>('einzeln');
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // ---- Derived calculations ----

  // Collect all billable items with persona info
  const billableItems = useMemo(() => {
    const items: { stunden: number; persona_id: string | null }[] = [];
    for (const sp of selectedPakete) {
      for (const pos of sp.positionen) {
        items.push({
          stunden: parseFloat(pos.stunden.replace(',', '.')) || 0,
          persona_id: pos.persona_id,
        });
      }
    }
    for (const pos of eigenePsn) {
      items.push({
        stunden: parseFloat(pos.stunden.replace(',', '.')) || 0,
        persona_id: pos.persona_id,
      });
    }
    for (const pd of personaDirect) {
      items.push({
        stunden: parseFloat(pd.stunden.replace(',', '.')) || 0,
        persona_id: pd.personaId,
      });
    }
    return items;
  }, [selectedPakete, eigenePsn, personaDirect]);

  const stundenGesamt = useMemo(
    () => Math.round(billableItems.reduce((s, i) => s + i.stunden, 0) * 100) / 100,
    [billableItems]
  );

  // Group costs by persona for summary
  const personenKosten = useMemo(() => {
    const map = new Map<string, { name: string; stunden: number; stundensatz: number }>();

    for (const item of billableItems) {
      const persona = personas.find((p) => p.id === item.persona_id);
      const key = persona ? persona.id : '__sonstige__';
      const name = persona ? persona.name : 'Sonstige';
      const stundensatz = persona ? persona.stundensatz : settings.stundenSatz;
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
  }, [billableItems, personas, settings.stundenSatz]);

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

  // ---- Paket actions ----
  function addPaket(paket: PaketTemplate) {
    const instance: SelectedPaket = {
      instanceId: `${paket.id}-${Date.now()}`,
      paketId: paket.id,
      paketName: paket.name,
      positionen: paket.positionen.map((p) => ({
        id: p.id,
        bezeichnung: p.bezeichnung,
        stunden: String(p.stunden),
        persona_id: p.persona_id,
      })),
    };
    setSelectedPakete((prev) => [...prev, instance]);
    setShowPaketDropdown(false);
  }

  function removePaket(instanceId: string) {
    setSelectedPakete((prev) => prev.filter((sp) => sp.instanceId !== instanceId));
  }

  function updatePaketPosition(instanceId: string, posId: string, field: 'bezeichnung' | 'stunden', value: string) {
    setSelectedPakete((prev) =>
      prev.map((sp) =>
        sp.instanceId === instanceId
          ? {
              ...sp,
              positionen: sp.positionen.map((pos) =>
                pos.id === posId ? { ...pos, [field]: value } : pos
              ),
            }
          : sp
      )
    );
  }

  function updatePaketPositionPersona(instanceId: string, posId: string, personaId: string | null) {
    setSelectedPakete((prev) =>
      prev.map((sp) =>
        sp.instanceId === instanceId
          ? {
              ...sp,
              positionen: sp.positionen.map((pos) =>
                pos.id === posId ? { ...pos, persona_id: personaId } : pos
              ),
            }
          : sp
      )
    );
  }

  function removePaketPosition(instanceId: string, posId: string) {
    setSelectedPakete((prev) =>
      prev.map((sp) =>
        sp.instanceId === instanceId
          ? { ...sp, positionen: sp.positionen.filter((pos) => pos.id !== posId) }
          : sp
      )
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
    const rows: EquipmentRow[] = paket.items.map((item) => ({
      id: `eq-${Date.now()}-${item.equipment_item_id}`,
      name: item.name,
      tagessatz: item.day_rate !== null ? String(item.day_rate) : '',
      tage: String(item.tage),
    }));
    setEquipment((prev) => [...prev, ...rows]);
    setShowEquipmentPicker(false);
    setEquipmentSearch('');
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
      for (const sp of selectedPakete) {
        for (const pos of sp.positionen) {
          const persona = personas.find((p) => p.id === pos.persona_id);
          allPositionen.push({
            bezeichnung: pos.bezeichnung,
            stunden: parseFloat(pos.stunden.replace(',', '.')) || 0,
            personaName: persona?.name,
            stundensatz: persona?.stundensatz ?? settings.stundenSatz,
          });
        }
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
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Kunde</label>
            <input
              className="neu-input w-full"
              placeholder="Kundenname"
              value={kunde}
              onChange={(e) => setKunde(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Positionen */}
      <div className="neu-raised p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
            Leistungspositionen
          </h2>
          <div className="relative">
            <button
              className="neu-btn flex items-center gap-2 text-sm px-3 py-2"
              onClick={() => setShowPaketDropdown((v) => !v)}
            >
              <Plus className="h-4 w-4" />
              Paket hinzufügen
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showPaketDropdown && (
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg min-w-[220px] overflow-hidden"
                style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}
              >
                {pakete.length === 0 ? (
                  <div className="px-4 py-3 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
                    Keine Pakete vorhanden
                  </div>
                ) : (
                  pakete.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-4 py-2.5 text-sm transition-opacity hover:opacity-70"
                      style={{ color: 'var(--neu-text)' }}
                      onClick={() => addPaket(p)}
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                        {p.positionen.length} Pos.
                      </span>
                    </button>
                  ))
                )}
                <button
                  className="w-full text-left px-4 py-2 text-xs border-t"
                  style={{ color: 'var(--neu-text-secondary)', borderColor: 'var(--neu-border)' }}
                  onClick={() => setShowPaketDropdown(false)}
                >
                  Schließen
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {selectedPakete.map((sp) => (
            <div key={sp.instanceId} className="neu-pressed px-4 py-3 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--neu-accent)' }}>
                  {sp.paketName}
                </span>
                <button
                  onClick={() => removePaket(sp.instanceId)}
                  className="p-1 rounded hover:opacity-70"
                  style={{ color: '#ef4444' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                {sp.positionen.map((pos) => {
                  const posPersona = personas.find((p) => p.id === pos.persona_id);
                  return (
                    <div key={pos.id} className="flex items-center gap-2 flex-wrap">
                      <input
                        className="neu-input text-sm flex-1 min-w-[120px]"
                        value={pos.bezeichnung}
                        onChange={(e) => updatePaketPosition(sp.instanceId, pos.id, 'bezeichnung', e.target.value)}
                      />
                      <input
                        className="neu-input text-sm w-20"
                        type="number"
                        step="0.5"
                        min="0"
                        value={pos.stunden}
                        onChange={(e) => updatePaketPosition(sp.instanceId, pos.id, 'stunden', e.target.value)}
                      />
                      <StundenQuickset onSet={(v) => updatePaketPosition(sp.instanceId, pos.id, 'stunden', v)} />
                      <span className="text-xs w-6" style={{ color: 'var(--neu-text-secondary)' }}>Std</span>
                      <select
                        className="neu-input text-sm"
                        value={pos.persona_id ?? ''}
                        onChange={(e) => updatePaketPositionPersona(sp.instanceId, pos.id, e.target.value || null)}
                      >
                        <option value="">— kein</option>
                        {personas.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {posPersona && <PersonaBadge persona={posPersona} />}
                      <button
                        onClick={() => removePaketPosition(sp.instanceId, pos.id)}
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
          ))}

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
              Keine direkten Persona-Zeiten. Füge Personas direkt hinzu für Zeiten außerhalb von Paketen.
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
                            <span className="ml-2 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                              {paket.items.length} Item{paket.items.length !== 1 ? 's' : ''}
                            </span>
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
          {/* Per-persona cost rows */}
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

          {/* Stundenkosten gesamt subtotal (only show when there are persona breakdowns) */}
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
