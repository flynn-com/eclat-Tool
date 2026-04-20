'use client';

import { useState } from 'react';
import { Plus, Trash2, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addScheduleEntry, deleteScheduleEntry } from '@/lib/actions/project-planning';
import { ProjectScheduleEntry } from '@/lib/types';

interface Props {
  projectId: string;
  entries: ProjectScheduleEntry[];
}

export function ScheduleList({ projectId, entries }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    if (!title.trim() || !date) return;
    setIsAdding(true);
    await addScheduleEntry(projectId, title, date, startTime || undefined, endTime || undefined, location || undefined);
    setTitle(''); setDate(''); setStartTime(''); setEndTime(''); setLocation('');
    setShowForm(false);
    setIsAdding(false);
    router.refresh();
  };

  return (
    <div className="neu-raised p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Termine</h3>
        <button onClick={() => setShowForm(!showForm)} className="neu-btn h-8 w-8 flex items-center justify-center">
          <Plus className="h-4 w-4" style={{ color: 'var(--neu-accent)' }} />
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Termin-Titel" className="neu-input w-full text-sm" />
          <div className="grid grid-cols-3 gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="neu-input text-sm" />
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="Von" className="neu-input text-sm" />
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="Bis" className="neu-input text-sm" />
          </div>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ort (optional)" className="neu-input w-full text-sm" />
          <button onClick={handleAdd} disabled={isAdding} className="neu-btn-primary px-4 py-2 text-sm disabled:opacity-50">Hinzufuegen</button>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="px-3 py-3 neu-pressed group">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{entry.title}</p>
              <button onClick={async () => { await deleteScheduleEntry(entry.id, projectId); router.refresh(); }} className="opacity-0 group-hover:opacity-100 p-1 transition-opacity">
                <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
              <span>{new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              {(entry.start_time || entry.end_time) && (
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{entry.start_time}{entry.end_time && ` – ${entry.end_time}`}</span>
              )}
              {entry.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{entry.location}</span>
              )}
            </div>
          </div>
        ))}
        {entries.length === 0 && !showForm && (
          <p className="text-sm" style={{ color: 'var(--neu-accent-mid)' }}>Keine Termine eingetragen</p>
        )}
      </div>
    </div>
  );
}
