'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Save, X, Pencil, Users, Layers } from 'lucide-react';
import {
  createLeistung,
  updateLeistung,
  deleteLeistung,
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

interface Leistung {
  id: string;
  name: string;
  beschreibung: string | null;
  stundensatz: number;
}

interface Props {
  initialLeistungen: Leistung[];
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

export function LeistungenManager({ initialLeistungen, initialPersonas }: Props) {
  const [leistungen, setLeistungen] = useState<Leistung[]>(initialLeistungen);
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [, startTransition] = useTransition();

  // ---- Leistungen state ----
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBeschreibung, setNewBeschreibung] = useState('');
  const [newStundensatz, setNewStundensatz] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBeschreibung, setEditBeschreibung] = useState('');
  const [editStundensatz, setEditStundensatz] = useState('');

  // ---- Persona Manager state ----
  const [showPersonaForm, setShowPersonaForm] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaStundensatz, setNewPersonaStundensatz] = useState('');
  const [newPersonaFarbe, setNewPersonaFarbe] = useState('#10b981');
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [editPersonaName, setEditPersonaName] = useState('');
  const [editPersonaStundensatz, setEditPersonaStundensatz] = useState('');
  const [editPersonaFarbe, setEditPersonaFarbe] = useState('');

  // ---- Leistungen actions ----
  function handleCreateLeistung() {
    if (!newName.trim()) return;
    const stundensatz = parseFloat(newStundensatz.replace(',', '.')) || 0;
    const optimistic: Leistung = {
      id: `tmp-${Date.now()}`,
      name: newName.trim(),
      beschreibung: newBeschreibung.trim() || null,
      stundensatz,
    };
    setLeistungen((prev) => [...prev, optimistic]);
    setNewName('');
    setNewBeschreibung('');
    setNewStundensatz('');
    setShowNewForm(false);
    startTransition(async () => {
      await createLeistung(optimistic.name, newBeschreibung, stundensatz);
    });
  }

  function startEdit(l: Leistung) {
    setEditingId(l.id);
    setEditName(l.name);
    setEditBeschreibung(l.beschreibung ?? '');
    setEditStundensatz(String(l.stundensatz));
  }

  function handleSave(id: string) {
    if (!editName.trim()) return;
    const stundensatz = parseFloat(editStundensatz.replace(',', '.')) || 0;
    setLeistungen((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, name: editName.trim(), beschreibung: editBeschreibung.trim() || null, stundensatz }
          : l
      )
    );
    setEditingId(null);
    startTransition(async () => {
      await updateLeistung(id, editName, editBeschreibung, stundensatz);
    });
  }

  function handleDelete(id: string) {
    setLeistungen((prev) => prev.filter((l) => l.id !== id));
    startTransition(async () => {
      await deleteLeistung(id);
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
    startTransition(async () => {
      await deletePersona(id);
    });
  }

  return (
    <div className="space-y-6">
      {/* ===== Leistungen ===== */}
      <div className="neu-raised p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5" style={{ color: 'var(--neu-accent)' }} />
            <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
              Leistungen
            </h2>
          </div>
          {!showNewForm && (
            <button
              className="neu-btn flex items-center gap-1 text-sm px-3 py-1.5"
              onClick={() => setShowNewForm(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Neue Leistung
            </button>
          )}
        </div>

        {/* Leistungen list */}
        <div className="space-y-2">
          {leistungen.length === 0 && !showNewForm && (
            <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
              Noch keine Leistungen. Erstelle Leistungen um sie im Projektkalkulator zu verwenden.
            </p>
          )}

          {leistungen.map((l) => (
            <div key={l.id} className="neu-pressed px-3 py-2 rounded-xl flex items-center gap-3 flex-wrap">
              {editingId === l.id ? (
                <>
                  <input
                    className="neu-input text-sm flex-1 min-w-[120px]"
                    value={editName}
                    placeholder="Name"
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(l.id)}
                    autoFocus
                  />
                  <input
                    className="neu-input text-sm flex-1 min-w-[120px]"
                    value={editBeschreibung}
                    placeholder="Beschreibung (optional)"
                    onChange={(e) => setEditBeschreibung(e.target.value)}
                  />
                  <input
                    className="neu-input text-sm w-28"
                    type="number"
                    step="1"
                    min="0"
                    value={editStundensatz}
                    placeholder="€/Std"
                    onChange={(e) => setEditStundensatz(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(l.id)}
                  />
                  <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>€/Std</span>
                  <button
                    className="neu-btn-primary flex items-center gap-1 text-xs px-2 py-1"
                    onClick={() => handleSave(l.id)}
                  >
                    <Save className="h-3 w-3" /> Sichern
                  </button>
                  <button
                    className="neu-btn flex items-center gap-1 text-xs px-2 py-1"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-medium text-sm" style={{ color: 'var(--neu-text)' }}>
                    {l.name}
                  </span>
                  {l.beschreibung && (
                    <span className="text-xs flex-1" style={{ color: 'var(--neu-text-secondary)' }}>
                      {l.beschreibung}
                    </span>
                  )}
                  {!l.beschreibung && <span className="flex-1" />}
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--neu-accent)22',
                      color: 'var(--neu-accent)',
                      border: '1px solid var(--neu-accent)55',
                    }}
                  >
                    {l.stundensatz.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €/Std
                  </span>
                  <button
                    onClick={() => startEdit(l)}
                    className="p-1 rounded hover:opacity-70"
                    style={{ color: 'var(--neu-text-secondary)' }}
                    title="Bearbeiten"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(l.id)}
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

        {/* New Leistung form */}
        {showNewForm && (
          <div className="neu-pressed px-3 py-3 rounded-xl mt-2 space-y-2">
            <p className="text-xs font-semibold" style={{ color: 'var(--neu-text)' }}>Neue Leistung</p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                className="neu-input text-sm flex-1 min-w-[140px]"
                placeholder="Name (z.B. Videodreh)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateLeistung()}
                autoFocus
              />
              <input
                className="neu-input text-sm flex-1 min-w-[140px]"
                placeholder="Beschreibung (optional)"
                value={newBeschreibung}
                onChange={(e) => setNewBeschreibung(e.target.value)}
              />
              <input
                className="neu-input text-sm w-28"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={newStundensatz}
                onChange={(e) => setNewStundensatz(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateLeistung()}
              />
              <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>€/Std</span>
            </div>
            <div className="flex gap-2">
              <button
                className="neu-btn-primary flex items-center gap-1 text-sm px-3 py-1.5"
                onClick={handleCreateLeistung}
              >
                <Save className="h-3.5 w-3.5" /> Speichern
              </button>
              <button
                className="neu-btn flex items-center gap-1 text-sm px-3 py-1.5"
                onClick={() => {
                  setShowNewForm(false);
                  setNewName('');
                  setNewBeschreibung('');
                  setNewStundensatz('');
                }}
              >
                <X className="h-3.5 w-3.5" /> Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}
