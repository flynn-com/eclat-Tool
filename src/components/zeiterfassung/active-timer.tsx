'use client';

import { useState, useEffect } from 'react';
import { Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TimeEntry, Project } from '@/lib/types';

interface ActiveTimerProps {
  entry: TimeEntry;
  project: Pick<Project, 'name' | 'color'> | null;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function ActiveTimer({ entry, project }: ActiveTimerProps) {
  const [elapsed, setElapsed] = useState('00:00:00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const startTime = new Date(entry.start_time).getTime();
    const update = () => setElapsed(formatElapsed(Date.now() - startTime));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [entry.start_time]);

  const handleStop = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endTime = new Date();
      const startTime = new Date(entry.start_time);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const { error: updateError } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', entry.id);

      if (updateError) {
        setError('Fehler beim Stoppen: ' + updateError.message);
        setIsLoading(false);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('Unerwarteter Fehler: ' + (err instanceof Error ? err.message : String(err)));
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
          </div>
          <div>
            <p className="text-sm text-gray-600">
              {project ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: project.color }} />
                  {project.name}
                </span>
              ) : (
                'Sonstiges'
              )}
              {entry.description && <span className="text-gray-400"> — {entry.description}</span>}
            </p>
            <p className="text-2xl font-mono font-bold text-gray-900">{elapsed}</p>
          </div>
        </div>
        <button
          onClick={handleStop}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          <Square className="h-4 w-4" />
          {isLoading ? 'Stoppe...' : 'Stoppen'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
