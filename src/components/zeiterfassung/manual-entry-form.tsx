'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ProjectSelect } from './project-select';
import { Project, TimeCategory } from '@/lib/types';

interface ManualEntryFormProps {
  projects: Project[];
  categories?: TimeCategory[];
}

export function ManualEntryForm({ projects, categories = [] }: ManualEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const form = e.currentTarget;
    try {
      const formData = new FormData(form);
      const date = formData.get('date') as string;
      const startTimeStr = formData.get('start_time') as string;
      const endTimeStr = formData.get('end_time') as string;
      const raw = (formData.get('project_id') as string) || '';
      const isCategory = raw.startsWith('cat_');
      const projectId = !isCategory && raw.trim() !== '' ? raw : null;
      const categoryId = isCategory ? raw.replace('cat_', '') : null;
      const description = (formData.get('description') as string) || null;

      if (!date || !startTimeStr || !endTimeStr) {
        setError('Datum, Start- und Endzeit sind erforderlich');
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Nicht angemeldet');
        setIsLoading(false);
        return;
      }

      const startTime = new Date(`${date}T${startTimeStr}:00`);
      const endTime = new Date(`${date}T${endTimeStr}:00`);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        setError('Ungueltiges Datum oder Zeitformat');
        setIsLoading(false);
        return;
      }

      if (endTime <= startTime) {
        setError('Endzeit muss nach Startzeit liegen');
        setIsLoading(false);
        return;
      }

      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const { error: insertError } = await supabase.from('time_entries').insert({
        user_id: user.id,
        project_id: projectId,
        category_id: categoryId,
        description: description && description.trim() !== '' ? description : null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        is_manual: true,
      });

      if (insertError) {
        setError('Fehler beim Speichern: ' + insertError.message);
      } else {
        form.reset();
        setIsOpen(false);
        router.refresh();
      }
    } catch (err) {
      setError('Unerwarteter Fehler: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors rounded-xl"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Plus className="h-4 w-4" />
          Manuell eintragen
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Datum</label>
              <input
                name="date"
                type="date"
                defaultValue={today}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Von</label>
              <input
                name="start_time"
                type="time"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bis</label>
              <input
                name="end_time"
                type="time"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Projekt / Kategorie</label>
              <ProjectSelect projects={projects} categories={categories} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Beschreibung</label>
              <input
                name="description"
                type="text"
                placeholder="Aufgabe..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Speichere...' : 'Eintrag speichern'}
          </button>
        </form>
      )}
    </div>
  );
}
