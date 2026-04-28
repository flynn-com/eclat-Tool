'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateSharedNotes } from '@/lib/actions/meetings';

interface Props {
  meetingId: string;
  initialNotes: string;
}

export function SharedNotes({ meetingId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const isTypingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesRef = useRef(notes);
  const supabase = useMemo(() => createClient(), []);

  // Keep notesRef in sync (avoids stale closures without re-subscribing)
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // Subscribe to realtime updates from other users (mount once)
  useEffect(() => {
    const channel = supabase
      .channel(`meeting-${meetingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'meetings', filter: `id=eq.${meetingId}` },
        (payload) => {
          const newNotes = (payload.new as { shared_notes: string }).shared_notes;
          if (!isTypingRef.current && newNotes !== notesRef.current) {
            setNotes(newNotes);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, supabase]);

  // Debounced save
  const handleChange = (value: string) => {
    setNotes(value);
    isTypingRef.current = true;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSaving(true);
      await updateSharedNotes(meetingId, value);
      setIsSaving(false);
      setSavedAt(new Date());
      isTypingRef.current = false;
    }, 600);
  };

  return (
    <div className="neu-raised p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
          Live-Notizen
        </h3>
        <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
          {isSaving ? (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Speichere...
            </span>
          ) : savedAt ? (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Gespeichert
            </span>
          ) : (
            'Live'
          )}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Notizen werden in Echtzeit fuer alle sichtbar..."
        rows={12}
        className="neu-input w-full text-sm resize-y"
        style={{ minHeight: '200px' }}
      />
      <p className="text-xs mt-2" style={{ color: 'var(--neu-accent-mid)' }}>
        Alle Teilnehmer schreiben in dieses Feld — Aenderungen erscheinen live bei allen.
      </p>
    </div>
  );
}
