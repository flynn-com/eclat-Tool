'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addNote, deleteNote } from '@/lib/actions/project-planning';
import { ProjectNote, NoteCategory } from '@/lib/types';

interface Props {
  projectId: string;
  category: NoteCategory;
  notes: ProjectNote[];
  title: string;
}

export function NotesSection({ projectId, category, notes, title }: Props) {
  const [content, setContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    if (!content.trim()) return;
    setIsAdding(true);
    await addNote(projectId, category, content, noteTitle);
    setContent('');
    setNoteTitle('');
    setShowForm(false);
    setIsAdding(false);
    router.refresh();
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote(noteId, projectId);
    router.refresh();
  };

  return (
    <div className="neu-raised p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>{title}</h3>
        <button onClick={() => setShowForm(!showForm)} className="neu-btn h-8 w-8 flex items-center justify-center">
          <Plus className="h-4 w-4" style={{ color: 'var(--neu-accent)' }} />
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2">
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Titel (optional)"
            className="neu-input w-full text-sm"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Notiz schreiben..."
            rows={3}
            className="neu-input w-full text-sm resize-none"
          />
          <button onClick={handleAdd} disabled={isAdding || !content.trim()} className="neu-btn-primary px-4 py-2 text-sm disabled:opacity-50">
            {isAdding ? 'Speichere...' : 'Hinzufuegen'}
          </button>
        </div>
      )}

      {notes.length === 0 && !showForm && (
        <p className="text-sm" style={{ color: 'var(--neu-accent-mid)' }}>Noch keine Eintraege</p>
      )}

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="neu-pressed p-3 group">
            {note.title && <p className="text-sm font-semibold mb-1" style={{ color: 'var(--neu-text)' }}>{note.title}</p>}
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--neu-text-secondary)' }}>{note.content}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
                {new Date(note.created_at).toLocaleDateString('de-DE')}
              </span>
              <button onClick={() => handleDelete(note.id)} className="opacity-0 group-hover:opacity-100 p-1 transition-opacity">
                <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
