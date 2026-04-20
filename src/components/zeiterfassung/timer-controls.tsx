'use client';

import { useState, useMemo } from 'react';
import { Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ProjectSelect } from './project-select';
import { Project } from '@/lib/types';

interface TimerControlsProps {
  projects: Project[];
  hasActiveTimer: boolean;
}

export function TimerControls({ projects, hasActiveTimer }: TimerControlsProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isStarting) return;

    setIsStarting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const projectId = (formData.get('project_id') as string) || null;
      const description = (formData.get('description') as string) || null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Nicht angemeldet');
        setIsStarting(false);
        return;
      }

      const { error: insertError } = await supabase.from('time_entries').insert({
        user_id: user.id,
        project_id: projectId && projectId.trim() !== '' ? projectId : null,
        description: description && description.trim() !== '' ? description : null,
        start_time: new Date().toISOString(),
        is_manual: false,
      });

      if (insertError) {
        setError('Fehler: ' + insertError.message);
        setIsStarting(false);
        return;
      }

      router.refresh();
      // Keep isStarting true briefly — router.refresh will unmount this anyway
    } catch (err) {
      setError('Unerwarteter Fehler: ' + (err instanceof Error ? err.message : String(err)));
      setIsStarting(false);
    }
  };

  if (hasActiveTimer) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Timer starten</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <ProjectSelect projects={projects} />
        </div>
        <div className="flex-1">
          <input
            name="description"
            type="text"
            placeholder="Aufgabe / Beschreibung"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={isStarting}
          className="flex items-center justify-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <Play className="h-4 w-4" />
          {isStarting ? 'Starte...' : 'Start'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </form>
  );
}
