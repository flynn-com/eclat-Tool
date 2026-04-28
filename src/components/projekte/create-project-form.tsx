'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createProject } from '@/app/(protected)/projekte/actions';
import { useRouter } from 'next/navigation';
import { CAMPAIGN_TYPE_LABELS } from '@/lib/constants';
import { Kunde } from '@/lib/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

interface CreateProjectFormProps {
  kunden?: Pick<Kunde, 'id' | 'firma'>[];
}

export function CreateProjectForm({ kunden = [] }: CreateProjectFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('color', selectedColor);

    try {
      await createProject(formData);
      router.push('/projekte');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Projektname *</label>
          <input name="name" type="text" required placeholder="z.B. Kampagne Sommer 2026" className="neu-input w-full text-sm" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium" style={{ color: 'var(--neu-text-secondary)' }}>Kunde</label>
            <Link href="/vertrieb/kunden/neu" className="text-xs hover:underline" style={{ color: 'var(--neu-accent)' }}>+ Neuer Kunde</Link>
          </div>
          <select name="kunde_id" className="neu-input w-full text-sm">
            <option value="">-- Kunde waehlen (optional) --</option>
            {kunden.map((k) => <option key={k.id} value={k.id}>{k.firma}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Kampagnentyp</label>
          <select name="campaign_type" className="neu-input w-full text-sm">
            <option value="">-- Waehlen --</option>
            {Object.entries(CAMPAIGN_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Budget (Euro)</label>
          <input name="budget" type="number" step="0.01" placeholder="z.B. 25000" className="neu-input w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Deadline</label>
          <input name="deadline" type="date" className="neu-input w-full text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Beschreibung / Briefing</label>
        <textarea name="description" rows={3} placeholder="Projektbeschreibung..." className="neu-input w-full text-sm resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neu-text-secondary)' }}>Farbe</label>
        <div className="flex gap-2">
          {COLORS.map((color) => (
            <button key={color} type="button" onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isLoading} className="neu-btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
          {isLoading ? 'Erstelle...' : 'Projekt erstellen'}
        </button>
        <button type="button" onClick={() => router.back()} className="neu-btn px-5 py-2.5 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}
