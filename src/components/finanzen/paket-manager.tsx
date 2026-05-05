'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Save, X, Pencil } from 'lucide-react';
import {
  createPaket,
  updatePaket,
  deletePaket,
  createPosition,
  updatePosition,
  deletePosition,
} from '@/lib/actions/kalkulation';

interface Position {
  id: string;
  bezeichnung: string;
  stunden: number;
  sort_order: number;
}

interface Paket {
  id: string;
  name: string;
  beschreibung: string | null;
  positionen: Position[];
}

interface Props {
  initialPakete: Paket[];
}

export function PaketManager({ initialPakete }: Props) {
  const [pakete, setPakete] = useState<Paket[]>(initialPakete);
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

  // Editing position inline
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editPosText, setEditPosText] = useState('');
  const [editPosStunden, setEditPosStunden] = useState('');

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
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
    if (!bez) return;
    const sortOrder = (pakete.find((p) => p.id === paketId)?.positionen.length ?? 0);
    const optimistic: Position = {
      id: `tmp-pos-${Date.now()}`,
      bezeichnung: bez,
      stunden: isNaN(std) ? 0 : std,
      sort_order: sortOrder,
    };
    setPakete((prev) =>
      prev.map((p) =>
        p.id === paketId ? { ...p, positionen: [...p.positionen, optimistic] } : p
      )
    );
    setNewPosText((prev) => ({ ...prev, [paketId]: '' }));
    setNewPosStunden((prev) => ({ ...prev, [paketId]: '' }));
    startTransition(async () => {
      await createPosition(paketId, bez, isNaN(std) ? 0 : std, sortOrder);
    });
  }

  function startEditPosition(pos: Position) {
    setEditingPosId(pos.id);
    setEditPosText(pos.bezeichnung);
    setEditPosStunden(String(pos.stunden));
  }

  function handleSavePosition(paketId: string, posId: string) {
    const std = parseFloat(editPosStunden.replace(',', '.'));
    setPakete((prev) =>
      prev.map((p) =>
        p.id === paketId
          ? {
              ...p,
              positionen: p.positionen.map((pos) =>
                pos.id === posId
                  ? { ...pos, bezeichnung: editPosText.trim(), stunden: isNaN(std) ? 0 : std }
                  : pos
              ),
            }
          : p
      )
    );
    setEditingPosId(null);
    startTransition(async () => {
      await updatePosition(posId, editPosText, isNaN(std) ? 0 : std);
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

                {paket.positionen.map((pos) => (
                  <div key={pos.id} className="neu-pressed px-3 py-2 rounded-xl flex items-center gap-2">
                    {editingPosId === pos.id ? (
                      <>
                        <input
                          className="neu-input text-sm flex-1"
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
                ))}

                {/* Add new position */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    className="neu-input text-sm flex-1"
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
  );
}
