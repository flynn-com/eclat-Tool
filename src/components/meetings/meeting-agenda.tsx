'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { addAgendaItem, toggleAgendaItem, deleteAgendaItem } from '@/lib/actions/meetings';
import { MeetingAgendaItem } from '@/lib/types';

interface Props {
  meetingId: string;
  initialItems: MeetingAgendaItem[];
}

export function MeetingAgenda({ meetingId, initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Realtime: live updates fuer kollaborative Agenda
  useEffect(() => {
    const channel = supabase
      .channel(`agenda-${meetingId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_agenda', filter: `meeting_id=eq.${meetingId}` },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, supabase, router]);

  // Sync wenn props sich aendern
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setIsAdding(true);
    await addAgendaItem(meetingId, newTitle);
    setNewTitle('');
    setIsAdding(false);
  };

  const handleToggle = async (item: MeetingAgendaItem) => {
    // Optimistic update
    setItems(items.map((i) => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i));
    await toggleAgendaItem(item.id, !item.is_checked, meetingId);
  };

  const handleDelete = async (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
    await deleteAgendaItem(itemId, meetingId);
  };

  const offen = items.filter((i) => !i.is_checked);
  const erledigt = items.filter((i) => i.is_checked);

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
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Punkt hinzufuegen..."
          className="neu-input flex-1 text-sm py-1.5"
        />
        <button onClick={handleAdd} disabled={isAdding || !newTitle.trim()} className="neu-btn-primary px-3 py-1.5 text-xs disabled:opacity-50 flex items-center gap-1">
          <Plus className="h-3 w-3" /> Hinzufuegen
        </button>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {[...offen, ...erledigt].map((item) => (
          <label key={item.id} className="flex items-center gap-3 px-3 py-2 neu-pressed group cursor-pointer">
            <input
              type="checkbox"
              checked={item.is_checked}
              onChange={() => handleToggle(item)}
              className="h-4 w-4 cursor-pointer"
              style={{ accentColor: '#10B981' }}
            />
            <span
              className={`flex-1 text-sm ${item.is_checked ? 'line-through opacity-50' : ''}`}
              style={{ color: 'var(--neu-text)' }}
            >
              {item.title}
            </span>
            <button onClick={(e) => { e.preventDefault(); handleDelete(item.id); }} className="opacity-0 group-hover:opacity-100 p-1 transition-opacity">
              <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
            </button>
          </label>
        ))}
        {items.length === 0 && (
          <p className="text-sm py-2" style={{ color: 'var(--neu-accent-mid)' }}>Keine Punkte eingetragen</p>
        )}
      </div>
    </div>
  );
}
