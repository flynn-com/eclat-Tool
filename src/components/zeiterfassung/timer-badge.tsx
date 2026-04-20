'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

function formatShort(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h} Std ${m} Min` : `${m} Min`;
}

export function TimerBadge() {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState('');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { data } = await supabase
        .from('time_entries')
        .select('start_time')
        .eq('user_id', user.id)
        .is('end_time', null)
        .maybeSingle();

      if (!mounted) return;
      setStartTime(data ? new Date(data.start_time).getTime() : null);
    };

    check();
    const interval = setInterval(check, 60000); // every 60s is enough
    return () => { mounted = false; clearInterval(interval); };
  }, [supabase]);

  useEffect(() => {
    if (startTime === null) return;
    const update = () => setElapsed(formatShort(Date.now() - startTime));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (startTime === null) return null;

  return (
    <Link
      href="/zeiterfassung"
      className="neu-pressed flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
      style={{ color: '#10B981' }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {elapsed}
    </Link>
  );
}
