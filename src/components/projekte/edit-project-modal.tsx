'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateProject } from '@/app/(protected)/projekte/actions';
import { CAMPAIGN_TYPE_LABELS } from '@/lib/constants';
import { Project } from '@/lib/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

interface Props {
  project: Project;
  onClose: () => void;
}

export function EditProjectModal({ project, onClose }: Props) {
  const [color, setColor] = useState(project.color);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('color', color);

    const result = await updateProject(project.id, formData);
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }
    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="neu-raised p-6 max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
            Projekt bearbeiten
          </h2>
          <button onClick={onClose} className="neu-btn h-8 w-8 flex items-center justify-center">
            <X className="h-4 w-4" style={{ color: 'var(--neu-accent-mid)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Projektname *</label>
              <input name="name" type="text" defaultValue={project.name} required className="neu-input w-full text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Kunde</label>
              <input name="client_name" type="text" defaultValue={project.client_name ?? ''} className="neu-input w-full text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Kampagnentyp</label>
              <select name="campaign_type" defaultValue={project.campaign_type ?? ''} className="neu-input w-full text-sm">
                <option value="">-- Waehlen --</option>
                {Object.entries(CAMPAIGN_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Budget (Euro)</label>
              <input name="budget" type="number" step="0.01" defaultValue={project.budget ?? ''} className="neu-input w-full text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Deadline</label>
              <input name="deadline" type="date" defaultValue={project.deadline ?? ''} className="neu-input w-full text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Beschreibung</label>
            <textarea name="description" defaultValue={project.description ?? ''} rows={3} className="neu-input w-full text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text-secondary)' }}>Farbe</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={isLoading} className="neu-btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
              {isLoading ? 'Speichere...' : 'Aenderungen speichern'}
            </button>
            <button type="button" onClick={onClose} className="neu-btn px-5 py-2.5 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
