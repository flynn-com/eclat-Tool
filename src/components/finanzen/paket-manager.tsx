'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Save, X, Pencil, Users } from 'lucide-react';
import {
  createPaket,
  updatePaket,
  deletePaket,
  createPosition,
  updatePosition,
  deletePosition,
  createPersona,
  updatePersona,
  deletePersona,
} from '@/lib/actions/kalkulation';

interface Persona {
  id: string;
  name: string;
  stundensatz: number;
  farbe: string | null;
}

interface Position {
  id: string;
  bezeichnung: string;
  stunden: number;
  sort_order: number;
  persona_id: string | null;
}

interface Paket {
  id: string;
  name: string;
  beschreibung: string | null;
  positionen: Position[];
}

interface Props {
  initialPakete: Paket[];
  initialPersonas: Persona[];
}

function PersonaBadge({ persona }: { persona: Persona | undefined }) {
  if (!persona) return null;
  const color = persona.farbe ?? 'var(--neu-accent)';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: color + '22', color, border: `1px solid ${color}55` }}
    >
      {persona.name}
    </span>
  );
}

export function PaketManager({ initialPakete, initialPersonas }: Props) {
  const [pakete, setPakete] = useState<Paket[]>(initialPakete);
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  // New paket form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBeschreibung, setNewBeschreibung] = useState('');

  // Editing paket inline
  const [editingPaketId, setEditingPaketId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBeschreibung, setEditBeschreibung] = useState('');

  // New position per paket
  const [newPosText, setNewPosText] = useState<Record<string, string>>({});
  const [newPosStunden, setNewPosStunden] = useState<Record<string, string>>({});
  const [newPosPersona, setNewPosPersona] = useState<Record<string, string>>({});

  // Editing position inline
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editPosText, setEditPosText] = useState('');
  const [editPosStunden, setEditPosStunden] = useState('');
  const [editPosPersona, setEditPosPersona] = useState('');

  // ---- Persona Manager state ----
  const [showPersonaForm, setShowPersonaForm] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaStundensatz, setNewPersonaStundensatz] = useState('');
  const [newPersonaFarbe, setNewPersonaFarbe] = useState('#10b981');
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [editPersonaName, setEditPersonaName] = useState('');
  const [editPersonaStundensatz, setEditPersonaStundensatz] = useState('');
  const [editPersonaFarbe, setEditPersonaFarbe] = useState('');

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ---- Persona actions ----
  function handleCreatePersona() {
    if (!newPersonaName.trim()) return;
    const stundensatz = parseFloat(newPersonaStundensatz.replace(',', '.')) || 0;
    const optimistic: Persona = {
      id: `tmp-persona-${Date.now()}`,
      name: newPersonaName.trim(),
      stundensatz,
      farbe: newPersonaFarbe || null,
    };
    setPersonas((prev) => [...prev, optimistic]);
    setNewPersonaName('');
    setNewPersonaStundensatz('');
    setNewPersonaFarbe('#10b981');
    setShowPersonaForm(false);
    startTransition(async () => {
      await createPersona(optimistic.name, stundensatz, newPersonaFarbe || undefined);
    });
  }

  function startEditPersona(p: Persona) {
    setEditingPersonaId(p.id);
    setEditPersonaName(p.name);
    setEditPersonaStundensatz(String(p.stundensatz));
    setEditPersonaFarbe(p.farbe ?? '#10b981');
  }

  function handleSavePersona(id: string) {
    if (!editPersonaName.trim()) return;
    const stundensatz = parseFloat(editPersonaStundensatz.replace(',', '.')) || 0;
    setPersonas((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, name: editPersonaName.trim(), stundensatz, farbe: editPersonaFarbe || null }
          : p
      )
    );
    setEditingPersonaId(null);
    startTransition(async () => {
      await updatePersona(id, editPersonaName, stundensatz, editPersonaFarbe || undefined);
    });
  }

  function handleDeletePersona(id: string) {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
    // Clear persona_id from positions that used this persona
    setPakete((prev) =>
      prev.map((pk) => ({
        ...pk,
        positionen: pk.positionen.map((pos) =>
          pos.persona_id === id ? { ...pos, persona_id: null } : pos
        ),
      }))
    );
    startTransition(async () => {
      await deletePersona(id);
    });
  }

  // ---- Paket actions ----
  function handleCreatePaket() {
    if (!newName.trim()) return;
    const optimistic: Paket = {
      id: `tmp-${Date.now()}`,
      name: newName.trim(),
      beschreibung: newBeschreibung.trim() || null,
      positionen: [],
    };
    setPakete((prev) => [...prev, optimistic]);
    setExpandedIds((prev) => new Set([...prev, optimistic.id]));
    setNewName('');
    setNewBeschreibung('');
    setShowNewForm(false);
    startTransition(async () => {
      await createPaket(optimistic.name, newBeschreibung);
    });
  }

  function startEditPaket(p: Paket) {
    setEditingPaketId(p.id);
    setEditName(p.name);
    setEditBeschreibung(p.beschreibung ?? '');
  }

  function handleSavePaket(id: string) {
    if (!editName.trim()) return;
    setPakete((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name: editName.trim(), beschreibung: editBeschreibung.trim() || null } : p
      )
    );
    setEditingPaketId(null);
    startTransition(async () => {
      await updatePaket(id, editName, editBeschreibung);
    });
  }

  function handleDeletePaket(id: string) {
    setPakete((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      await deletePaket(id);
    });
  }

  // ---- Position actions ----
  function handleAddPosition(paketId: string) {
    const bez = (newPosText[paketId] ?? '').trim();
    const std = parseFloat((newPosStunden[paketId] ?? '0').replace(',', '.'));
    const personaId = newPosPersona[paketId] || null;
    if (!bez) return;
    const sortOrder = (pakete.find((p) => p.id === paketId)?.positionen.length ?? 0);
    const optimistic: Position = {
      id: `tmp-pos-${Date.now()}`,
      bezeichnung: bez,
      stunden: isNaN(std) ? 0 : std,
      sort_order: sortOrder,
      persona_id: personaId,
    };
    setPakete((prev) =>
      prev.map((p) =>
        p.id === paketId ? { ...p, positionen: [...p.positionen, optimistic] } : p
      )
    );
    setNewPosText((prev) => ({ ...prev, [paketId]: '' }));
    setNewPosStunden((prev) => ({ ...prev, [paketId]: '' }));
    setNewPosPersona((prev) => ({ ...prev, [paketId]: '' }));
    startTransition(async () => {
      await createPosition(paketId, bez, isNaN(std) ? 0 : std, sortOrder, personaId);
    });
  }

  function startEditPosition(pos: Position) {
    setEditingPosId(pos.id);
    setEditPosText(pos.bezeichnung);
    setEditPosStunden(String(pos.stunden));
    setEditPosPersona(pos.persona_id ?? '');
  }

  function handleSavePosition(paketId: string, posId: string) {
    const std = parseFloat(editPosStunden.replace(',', '.'));
    const personaId = editPosPersona || null;
    setPakete((prev) =>
      prev.map((p) =>
        p.id === paketId
          ? {
              ...p,
              positionen: p.positionen.map((pos) =>
                pos.id === posId
                  ? {
                      ...pos,
                      bezeichnung: editPosText.trim(),
                      stunden: isNaN(std) ? 0 : std,
                      persona_id: personaId,
                    }
                  : pos
              ),
            }
          : p
      )
    );
    setEditingPosId(null);
    startTransition(async () => {
      await updatePosition(posId, editPosText, isNaN(std) ? 0 : std, personaId);
    });
  }

  function handleDeletePosition(paketId: string, posId: string) {
    setPakete((prev) =>
      prev.map((p) =>
        p.id === paketId
          ? { ...p, positionen: p.positionen.filter((pos) => pos.id !== posId) }
          : p
      )
    );
    startTransition(async () => {
      await deletePosition(posId);
    });
  }

  return (
    <div className="space-y-6">
      {/* ===== Persona Manager ===== */}
      <div className="neu-raised p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: 'var(--neu-accent)' }} />
            <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
              Personas
            </h2>
          </div>
          {!showPersonaForm && (
            <button
              className="neu-btn flex items-center gap-1 text-sm px-3 py-1.5"
              onClick={() => setShowPersonaForm(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Neue Persona
            </button>
          )}
        </div>

        {/* Personas list */}
        <div className="space-y-2">
          {personas.length === 0 && !showPersonaForm && (
            <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
              Noch keine Personas. Erstelle Personas um Rollen mit Stundensätzen zu verknüpfen.
            </p>
          )}

          {personas.map((persona) => (
            <div key={persona.id} className="neu-pressed px-3 py-2 rounded-xl flex items-center gap-3 flex-wrap">
              {editingPersonaId === persona.id ? (
                <>
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    value={editPersonaFarbe}
                    onChange={(e) => setEditPersonaFarbe(e.target.value)}
                    title="Farbe"
                  />
                  <input
                    className="neu-input text-sm flex-1 min-w-[120px]"
                    value={editPersonaName}
                    placeholder="Name"
                    onChange={(e) => setEditPersonaName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePersona(persona.id)}
                  />
                  <input
                    className="neu-input text-sm w-28"
                    type="number"
                    step="1"
                    min="0"
                    value={editPersonaStundensatz}
                    placeholder="€/Std"
                    onChange={(e) => setEditPersonaStundensatz(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePersona(persona.id)}
                  />
                  <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>€/Std</span>
                  <button
                    className="neu-btn-primary flex items-center gap-1 text-xs px-2 py-1"
                    onClick={() => handleSavePersona(persona.id)}
                  >
                    <Save className="h-3 w-3" /> Sichern
                  </button>
                  <button
                    className="neu-btn flex items-center gap-1 text-xs px-2 py-1"
                    onClick={() => setEditingPersonaId(null)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <PersonaBadge persona={persona} />
                  <span className="flex-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
                    {persona.stundensatz.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Std
                  </span>
                  <button
                    onClick={() => startEditPersona(persona)}
                    className="p-1 rounded hover:opacity-70"
                    style={{ color: 'var(--neu-text-secondary)' }}
                    title="Bearbeiten"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePersona(persona.id)}
                    className="p-1 rounded hover:opacity-70"
                    style={{ color: '#ef4444' }}
                    title="Löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* New persona form */}
        {showPersonaForm && (
          <div className="neu-pressed px-3 py-3 rounded-xl mt-2 space-y-2">
            <p className="text-xs font-semibold" style={{ color: 'var(--neu-text)' }}>Neue Persona</p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                value={newPersonaFarbe}
                onChange={(e) => setNewPersonaFarbe(e.target.value)}
                title="Farbe wählen"
              />
              <input
                className="neu-input text-sm flex-1 min-w-[120px]"
                placeholder="Name (z.B. Fotograf)"
                value={newPersonaName}
                onChange={(e) => setNewPersonaName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePersona()}
                autoFocus
              />
              <input
                className="neu-input text-sm w-28"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={newPersonaStundensatz}
                onChange={(e) => setNewPersonaStundensatz(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePersona()}
              />
              <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>€/Std</span>
            </div>
            <div className="flex gap-2">
              <button
                className="neu-btn-primary flex items-center gap-1 text-sm px-3 py-1.5"
                onClick={handleCreatePersona}
              >
                <Save className="h-3.5 w-3.5" /> Speichern
              </button>
              <button
                className="neu-btn flex items-center gap-1 text-sm px-3 py-1.5"
                onClick={() => {
                  setShowPersonaForm(false);
                  setNewPersonaName('');
                  setNewPersonaStundensatz('');
                  setNewPersonaFarbe('#10b981');
                }}
              >
                <X className="h-3.5 w-3.5" /> Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== Pakete ===== */}
      <div className="space-y-4">
        {/* New Paket Form */}
        {showNewForm ? (
          <div className="neu-raised p-4 space-y-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>Neues Paket</p>
            <input
              className="neu-input w-full"
              placeholder="Name des Pakets"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePaket()}
            />
            <input
              className="neu-input w-full"
              placeholder="Beschreibung (optional)"
              value={newBeschreibung}
              onChange={(e) => setNewBeschreibung(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="neu-btn-primary flex items-center gap-1 text-sm px-3 py-1.5" onClick={handleCreatePaket}>
                <Save className="h-3.5 w-3.5" /> Speichern
              </button>
              <button
                className="neu-btn flex items-center gap-1 text-sm px-3 py-1.5"
                onClick={() => { setShowNewForm(false); setNewName(''); setNewBeschreibung(''); }}
              >
                <X className="h-3.5 w-3.5" /> Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            className="neu-btn flex items-center gap-2 text-sm px-4 py-2"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="h-4 w-4" />
            Neues Paket erstellen
          </button>
        )}

        {/* Paket List */}
        {pakete.length === 0 && (
          <div className="neu-pressed px-4 py-6 rounded-xl text-center">
            <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Noch keine Pakete vorhanden.</p>
          </div>
        )}

        {pakete.map((paket) => {
          const isExpanded = expandedIds.has(paket.id);
          const isEditingPaket = editingPaketId === paket.id;

          return (
            <div key={paket.id} className="neu-raised overflow-hidden">
              {/* Paket Header */}
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  onClick={() => toggleExpand(paket.id)}
                  style={{ color: 'var(--neu-text-secondary)' }}
                  className="flex-shrink-0"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {isEditingPaket ? (
                  <div className="flex-1 flex items-center gap-2 flex-wrap">
                    <input
                      className="neu-input text-sm flex-1 min-w-[140px]"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePaket(paket.id)}
                    />
                    <input
                      className="neu-input text-sm flex-1 min-w-[140px]"
                      placeholder="Beschreibung"
                      value={editBeschreibung}
                      onChange={(e) => setEditBeschreibung(e.target.value)}
                    />
                    <button
                      className="neu-btn-primary flex items-center gap-1 text-xs px-2 py-1"
                      onClick={() => handleSavePaket(paket.id)}
                    >
                      <Save className="h-3 w-3" /> Sichern
                    </button>
                    <button
                      className="neu-btn flex items-center gap-1 text-xs px-2 py-1"
                      onClick={() => setEditingPaketId(null)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="flex-1 text-left"
                      onClick={() => toggleExpand(paket.id)}
                    >
                      <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
                        {paket.name}
                      </span>
                      {paket.beschreibung && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                          — {paket.beschreibung}
                        </span>
                      )}
                      <span className="ml-2 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                        ({paket.positionen.length} Position{paket.positionen.length !== 1 ? 'en' : ''})
                      </span>
                    </button>
                    <button
                      onClick={() => startEditPaket(paket)}
                      className="p-1 rounded transition-opacity hover:opacity-70"
                      style={{ color: 'var(--neu-text-secondary)' }}
                      title="Bearbeiten"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePaket(paket.id)}
                      className="p-1 rounded transition-opacity hover:opacity-70"
                      style={{ color: '#ef4444' }}
                      title="Löschen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Positions */}
              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: 'var(--neu-border)' }}>
                  {paket.positionen.length === 0 && (
                    <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                      Noch keine Positionen.
                    </p>
                  )}

                  {paket.positionen.map((pos) => {
                    const posPersona = personas.find((p) => p.id === pos.persona_id);
                    return (
                      <div key={pos.id} className="neu-pressed px-3 py-2 rounded-xl flex items-center gap-2 flex-wrap">
                        {editingPosId === pos.id ? (
                          <>
                            <input
                              className="neu-input text-sm flex-1 min-w-[120px]"
                              value={editPosText}
                              onChange={(e) => setEditPosText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSavePosition(paket.id, pos.id)}
                            />
                            <input
                              className="neu-input text-sm w-20"
                              type="number"
                              step="0.5"
                              min="0"
                              value={editPosStunden}
                              onChange={(e) => setEditPosStunden(e.target.value)}
                            />
                            <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Std</span>
                            <select
                              className="neu-input text-sm"
                              value={editPosPersona}
                              onChange={(e) => setEditPosPersona(e.target.value)}
                            >
                              <option value="">— kein</option>
                              {personas.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            <button
                              className="neu-btn-primary flex items-center gap-1 text-xs px-2 py-1"
                              onClick={() => handleSavePosition(paket.id, pos.id)}
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              className="neu-btn flex items-center gap-1 text-xs px-2 py-1"
                              onClick={() => setEditingPosId(null)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm" style={{ color: 'var(--neu-text)' }}>
                              {pos.bezeichnung}
                            </span>
                            {posPersona && <PersonaBadge persona={posPersona} />}
                            <span className="text-sm w-20 text-right" style={{ color: 'var(--neu-text-secondary)' }}>
                              {pos.stunden} Std
                            </span>
                            <button
                              onClick={() => startEditPosition(pos)}
                              className="p-1 rounded hover:opacity-70"
                              style={{ color: 'var(--neu-text-secondary)' }}
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeletePosition(paket.id, pos.id)}
                              className="p-1 rounded hover:opacity-70"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Add new position */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <input
                      className="neu-input text-sm flex-1 min-w-[120px]"
                      placeholder="Bezeichnung"
                      value={newPosText[paket.id] ?? ''}
                      onChange={(e) =>
                        setNewPosText((prev) => ({ ...prev, [paket.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPosition(paket.id)}
                    />
                    <input
                      className="neu-input text-sm w-20"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="Std"
                      value={newPosStunden[paket.id] ?? ''}
                      onChange={(e) =>
                        setNewPosStunden((prev) => ({ ...prev, [paket.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPosition(paket.id)}
                    />
                    <select
                      className="neu-input text-sm"
                      value={newPosPersona[paket.id] ?? ''}
                      onChange={(e) =>
                        setNewPosPersona((prev) => ({ ...prev, [paket.id]: e.target.value }))
                      }
                    >
                      <option value="">— kein</option>
                      {personas.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      className="neu-btn flex items-center gap-1 text-xs px-3 py-1.5"
                      onClick={() => handleAddPosition(paket.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Position hinzufügen
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
