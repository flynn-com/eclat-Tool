'use client';

import { useState } from 'react';
import { Plus, Trash2, Circle, Clock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addMeetingTask, updateMeetingTaskStatus, updateMeetingTaskAssignee, deleteMeetingTask } from '@/lib/actions/meetings';
import { MeetingTask, Profile, TaskStatus } from '@/lib/types';

interface Props {
  meetingId: string;
  tasks: MeetingTask[];
  profiles: Pick<Profile, 'id' | 'full_name'>[];
}

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  offen: <Circle className="h-4 w-4" />,
  in_arbeit: <Clock className="h-4 w-4" />,
  erledigt: <CheckCircle className="h-4 w-4" />,
};

const statusColors: Record<TaskStatus, string> = {
  offen: 'var(--neu-accent-mid)',
  in_arbeit: '#F59E0B',
  erledigt: '#10B981',
};

export function MeetingTaskList({ meetingId, tasks, profiles }: Props) {
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setIsAdding(true);
    await addMeetingTask(meetingId, newTitle, newAssignee || null, newDueDate || null);
    setNewTitle(''); setNewAssignee(''); setNewDueDate('');
    setShowForm(false);
    setIsAdding(false);
    router.refresh();
  };

  const cycleStatus = async (task: MeetingTask) => {
    const next: TaskStatus = task.status === 'offen' ? 'in_arbeit' : task.status === 'in_arbeit' ? 'erledigt' : 'offen';
    await updateMeetingTaskStatus(task.id, next, meetingId);
    router.refresh();
  };

  const changeAssignee = async (taskId: string, value: string) => {
    await updateMeetingTaskAssignee(taskId, value || null, meetingId);
    router.refresh();
  };

  const handleDelete = async (taskId: string) => {
    await deleteMeetingTask(taskId, meetingId);
    router.refresh();
  };

  const sorted = [...tasks].sort((a, b) => {
    const order = { offen: 0, in_arbeit: 1, erledigt: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="neu-raised p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
          Aufgaben ({tasks.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="neu-btn h-8 w-8 flex items-center justify-center">
          <Plus className="h-4 w-4" style={{ color: 'var(--neu-accent)' }} />
        </button>
      </div>

      {showForm && (
        <div className="neu-pressed p-3 mb-4 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && newAssignee && handleAdd()}
            placeholder="Aufgaben-Titel"
            className="neu-input w-full text-sm py-1.5"
          />
          <div className="flex gap-2">
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="neu-input flex-1 text-sm py-1.5"
            >
              <option value="">-- Person waehlen --</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="neu-input w-36 text-sm py-1.5"
            />
            <button onClick={handleAdd} disabled={isAdding || !newTitle.trim()} className="neu-btn-primary px-3 py-1.5 text-xs disabled:opacity-50">
              {isAdding ? '...' : 'Hinzufuegen'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {sorted.map((task) => {
          const assignee = profiles.find((p) => p.id === task.assignee_id);
          return (
            <div key={task.id} className="flex items-center gap-3 px-3 py-2 neu-pressed group">
              <button onClick={() => cycleStatus(task)}>
                <div style={{ color: statusColors[task.status] }}>{statusIcons[task.status]}</div>
              </button>
              <span className={`flex-1 text-sm ${task.status === 'erledigt' ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--neu-text)' }}>
                {task.title}
              </span>
              <select
                value={task.assignee_id ?? ''}
                onChange={(e) => changeAssignee(task.id, e.target.value)}
                className="neu-input text-xs py-0.5 px-2"
              >
                <option value="">--</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              {task.due_date && (
                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--neu-accent-mid)' }}>
                  {new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                </span>
              )}
              <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-1 transition-opacity">
                <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
              </button>
            </div>
          );
        })}
        {tasks.length === 0 && !showForm && (
          <p className="text-sm py-2" style={{ color: 'var(--neu-accent-mid)' }}>Noch keine Aufgaben</p>
        )}
      </div>
    </div>
  );
}
