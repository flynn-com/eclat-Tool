'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { addAgendaItem, toggleAgendaItem, updateAgendaItem, deleteAgendaItem } from '@/lib/actions/meetings';
import { MeetingAgendaItem } from '@/lib/types';

interface Props {
  meetingId: string;
  initialItems: MeetingAgendaItem[];
}

function AgendaRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: MeetingAgendaItem;
  onToggle: () => void;
  onEdit: (newTitle: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Sync title if parent updates (e.g. realtime)
  useEffect(() => {
    if (!editing) setDraft(item.title);
  }, [item.title, editing]);

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === item.title) {
      setDraft(item.title);
      setEditing(false);
      return;
    }
    await onEdit(trimmed);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setDraft(item.title); setEditing(false); }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 neu-pressed">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: 'var(--neu-text)' }}
        />
        <button
          onClick={handleSave}
          className="p-1 rounded transition-opacity hover:opacity-70"
          title="Speichern"
        >
          <Check className="h-3.5 w-3.5" style={{ color: '#10B981' }} />
        </button>
        <button
          onClick={() => { setDraft(item.title); setEditing(false); }}
          className="p-1 rounded transition-opacity hover:opacity-70"
          title="Abbrechen"
        >
          <X className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
        </button>
      </div>
    );
  }

  return (
    <label className="flex items-center gap-3 px-3 py-2 neu-pressed group cursor-pointer">
      <input
        type="checkbox"
        checked={item.is_checked}
        onChange={onToggle}
        className="h-4 w-4 cursor-pointer shrink-0"
        style={{ accentColor: '#10B981' }}
      />
      <span
        className={`flex-1 text-sm ${item.is_checked ? 'line-through opacity-50' : ''}`}
        style={{ color: 'var(--neu-text)' }}
      >
        {item.title}
      </span>
      {/* Actions — visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.preventDefault(); setEditing(true); }}
          className="p-1 rounded transition-opacity hover:opacity-70"
          title="Bearbeiten"
        >
          <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
        </button>
        <button
          onClick={e => { e.preventDefault(); onDelete(); }}
          className="p-1 rounded transition-opacity hover:opacity-70"
          title="Löschen"
        >
          <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
        </button>
      </div>
    </label>
  );
}

export function MeetingAgenda({ meetingId, initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Realtime: live updates
  useEffect(() => {
    const channel = supabase
      .channel(`agenda-${meetingId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_agenda', filter: `meeting_id=eq.${meetingId}` },
        () => { router.refresh(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [meetingId, supabase, router]);

  useEffect(() => { setItems(initialItems); }, [initialItems]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setIsAdding(true);
    await addAgendaItem(meetingId, newTitle);
    setNewTitle('');
    setIsAdding(false);
  };

  const handleToggle = async (item: MeetingAgendaItem) => {
    setItems(items.map(i => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i));
    await toggleAgendaItem(item.id, !item.is_checked, meetingId);
  };

  const handleEdit = async (item: MeetingAgendaItem, newTitle: string) => {
    setItems(items.map(i => i.id === item.id ? { ...i, title: newTitle } : i));
    await updateAgendaItem(item.id, newTitle, meetingId);
  };

  const handleDelete = async (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
    await deleteAgendaItem(itemId, meetingId);
  };

  const offen = items.filter(i => !i.is_checked);
  const erledigt = items.filter(i => i.is_checked);

  return (
    <div className="neu-raised p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
          Zu besprechen ({offen.length}{items.length > 0 ? `/${items.length}` : ''})
        </h3>
      </div>

      {/* Add form */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Punkt hinzufügen..."
          className="neu-input flex-1 text-sm py-1.5"
        />
        <button
          onClick={handleAdd}
          disabled={isAdding || !newTitle.trim()}
          className="neu-btn-primary px-3 py-1.5 text-xs disabled:opacity-50 flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Hinzufügen
        </button>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {[...offen, ...erledigt].map(item => (
          <AgendaRow
            key={item.id}
            item={item}
            onToggle={() => handleToggle(item)}
            onEdit={newTitle => handleEdit(item, newTitle)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
        {items.length === 0 && (
          <p className="text-sm py-2" style={{ color: 'var(--neu-accent-mid)' }}>Keine Punkte eingetragen</p>
        )}
      </div>
    </div>
  );
}
