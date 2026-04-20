'use client';

import { useState } from 'react';
import { Plus, Trash2, Circle, Clock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addTask, updateTaskStatus, deleteTask } from '@/lib/actions/project-planning';
import { ProjectTask, TaskPhase, Profile } from '@/lib/types';
import { TASK_STATUS_LABELS } from '@/lib/constants';

interface Props {
  projectId: string;
  phase: TaskPhase;
  category: string;
  tasks: ProjectTask[];
  title: string;
  profiles?: Pick<Profile, 'id' | 'full_name'>[];
}

const statusIcons: Record<string, React.ReactNode> = {
  offen: <Circle className="h-4 w-4" />,
  in_arbeit: <Clock className="h-4 w-4" />,
  erledigt: <CheckCircle className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  offen: 'var(--neu-accent-mid)',
  in_arbeit: '#F59E0B',
  erledigt: '#10B981',
};

export function TaskBoard({ projectId, phase, category, tasks, title, profiles }: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setIsAdding(true);
    await addTask(projectId, phase, category, newTitle);
    setNewTitle('');
    setShowForm(false);
    setIsAdding(false);
    router.refresh();
  };

  const cycleStatus = async (task: ProjectTask) => {
    const next = task.status === 'offen' ? 'in_arbeit' : task.status === 'in_arbeit' ? 'erledigt' : 'offen';
    await updateTaskStatus(task.id, next, projectId);
    router.refresh();
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId, projectId);
    router.refresh();
  };

  const offen = tasks.filter((t) => t.status === 'offen');
  const inArbeit = tasks.filter((t) => t.status === 'in_arbeit');
  const erledigt = tasks.filter((t) => t.status === 'erledigt');
  const erledigtCount = erledigt.length;
  const totalCount = tasks.length;

  return (
    <div className="neu-raised p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>{title}</h3>
          {totalCount > 0 && (
            <p className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>{erledigtCount}/{totalCount} erledigt</p>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="neu-btn h-8 w-8 flex items-center justify-center">
          <Plus className="h-4 w-4" style={{ color: 'var(--neu-accent)' }} />
        </button>
      </div>

      {showForm && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Neue Aufgabe..."
            className="neu-input flex-1 text-sm"
          />
          <button onClick={handleAdd} disabled={isAdding || !newTitle.trim()} className="neu-btn-primary px-4 py-2 text-sm disabled:opacity-50">
            {isAdding ? '...' : 'Hinzufuegen'}
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {[...offen, ...inArbeit, ...erledigt].map((task) => (
          <div key={task.id} className="flex items-center gap-3 px-3 py-2 neu-pressed group">
            <button onClick={() => cycleStatus(task)} title={TASK_STATUS_LABELS[task.status]}>
              <div style={{ color: statusColors[task.status] }}>{statusIcons[task.status]}</div>
            </button>
            <span className={`flex-1 text-sm ${task.status === 'erledigt' ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--neu-text)' }}>
              {task.title}
            </span>
            {task.due_date && (
              <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
                {new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
              </span>
            )}
            <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-1 transition-opacity">
              <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
            </button>
          </div>
        ))}
        {tasks.length === 0 && !showForm && (
          <p className="text-sm py-2" style={{ color: 'var(--neu-accent-mid)' }}>Keine Aufgaben</p>
        )}
      </div>
    </div>
  );
}
