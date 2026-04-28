'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createMeeting } from '@/lib/actions/meetings';

export function CreateMeetingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('Weekly Meeting');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);
    const result = await createMeeting(name, date);
    if (result.error || !result.id) {
      setError(result.error || 'Fehler beim Erstellen');
      setIsLoading(false);
      return;
    }
    setIsOpen(false);
    router.push(`/meetings/${result.id}`);
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="neu-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
        <Plus className="h-4 w-4" /> Neues Meeting
      </button>
    );
  }

  return (
    <div className="neu-raised p-5 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Neues Meeting</h3>
        <button onClick={() => setIsOpen(false)} className="neu-btn h-8 w-8 flex items-center justify-center">
          <X className="h-4 w-4" style={{ color: 'var(--neu-accent-mid)' }} />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Weekly Meeting"
            className="neu-input w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="neu-input w-full text-sm"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={handleCreate} disabled={isLoading} className="neu-btn-primary w-full py-2 text-sm disabled:opacity-50">
          {isLoading ? 'Erstelle...' : 'Meeting erstellen'}
        </button>
      </div>
    </div>
  );
}
