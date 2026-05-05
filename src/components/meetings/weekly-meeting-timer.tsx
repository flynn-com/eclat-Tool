'use client';

import { useState, useEffect, useMemo } from 'react';
import { Timer, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  categoryId: string;
  activeEntryId: string | null;
  activeStartTime: string | null;
}

function formatElapsed(startIso: string): string {
  const diff = Math.floor((Date.now() - new Date(startIso).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function WeeklyMeetingTimer({ categoryId, activeEntryId, activeStartTime }: Props) {
  const [running, setRunning] = useState(!!activeEntryId);
  const [entryId, setEntryId] = useState<string | null>(activeEntryId);
  const [startTime, setStartTime] = useState<string | null>(activeStartTime);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Tick every second while running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  async function handleStart() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const now = new Date().toISOString();
    const { data, error } = await supabase.from('time_entries').insert({
      user_id: user.id,
      category_id: categoryId,
      project_id: null,
      description: 'Weekly Meeting',
      start_time: now,
      is_manual: false,
    }).select('id').single();

    if (!error && data) {
      setEntryId(data.id);
      setStartTime(now);
      setRunning(true);
    }
    setLoading(false);
    router.refresh();
  }

  async function handleStop() {
    if (!entryId || !startTime) return;
    setLoading(true);

    const now = new Date();
    const duration = Math.round((now.getTime() - new Date(startTime).getTime()) / 60000);

    await supabase.from('time_entries').update({
      end_time: now.toISOString(),
      duration_minutes: duration,
    }).eq('id', entryId);

    setRunning(false);
    setEntryId(null);
    setStartTime(null);
    setLoading(false);
    router.refresh();
  }

  if (running && startTime) {
    return (
      <button
        onClick={handleStop}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
      >
        <Square className="h-3.5 w-3.5 fill-current" />
        <span>{formatElapsed(startTime)}</span>
        <span className="opacity-70">Stopp</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
      style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' }}
    >
      <Timer className="h-3.5 w-3.5" />
      Weekly Meeting
    </button>
  );
}
