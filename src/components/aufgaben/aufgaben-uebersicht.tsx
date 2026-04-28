'use client';

import { useState } from 'react';
import { Circle, Clock, CheckCircle, FolderKanban, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateMeetingTaskStatus } from '@/lib/actions/meetings';
import { updateTaskStatus as updateProjectTaskStatus } from '@/lib/actions/project-planning';

export interface UnifiedTask {
  id: string;
  title: string;
  status: 'offen' | 'in_arbeit' | 'erledigt';
  assignee_id: string | null;
  assigneeName: string | null;
  due_date: string | null;
  source: 'meeting' | 'project';
  sourceId: string;
  sourceName: string;
  sourceColor?: string;
  sourceDate?: string;
  sourcePhase?: string;
}

interface Props {
  tasks: UnifiedTask[];
  currentUserId: string;
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

export function AufgabenUebersicht({ tasks, currentUserId }: Props) {
  const [filter, setFilter] = useState<'meine' | 'alle' | 'erledigt'>('meine');
  const router = useRouter();

  const filtered = tasks.filter((t) => {
    if (filter === 'meine') return t.assignee_id === currentUserId && t.status !== 'erledigt';
    if (filter === 'alle') return t.status !== 'erledigt';
    return t.status === 'erledigt';
  });

  const cycleStatus = async (task: UnifiedTask) => {
    const next = task.status === 'offen' ? 'in_arbeit' : task.status === 'in_arbeit' ? 'erledigt' : 'offen';
    if (task.source === 'meeting') {
      await updateMeetingTaskStatus(task.id, next, task.sourceId);
    } else {
      await updateProjectTaskStatus(task.id, next, task.sourceId);
    }
    router.refresh();
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'meine', label: 'Meine Aufgaben' },
          { key: 'alle', label: 'Alle offenen' },
          { key: 'erledigt', label: 'Erledigt' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as 'meine' | 'alle' | 'erledigt')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.key ? 'neu-pressed' : 'neu-raised-sm'}`}
            style={{ color: filter === f.key ? 'var(--neu-accent)' : 'var(--neu-accent-mid)' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="neu-raised p-8 text-center" style={{ color: 'var(--neu-accent-mid)' }}>
          Keine Aufgaben gefunden
        </div>
      ) : (
        <div className="space-y-2 max-w-3xl">
          {filtered.map((task) => (
            <div key={`${task.source}-${task.id}`} className="neu-raised p-3 flex items-center gap-3">
              <button onClick={() => cycleStatus(task)}>
                <div style={{ color: statusColors[task.status] }}>{statusIcons[task.status]}</div>
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === 'erledigt' ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--neu-text)' }}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--neu-accent-mid)' }}>
                  <Link href={task.source === 'meeting' ? `/meetings/${task.sourceId}` : `/projekte/${task.sourceId}`} className="flex items-center gap-1 hover:opacity-70">
                    {task.source === 'meeting' ? (
                      <MessageSquare className="h-3 w-3" />
                    ) : (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.sourceColor ?? 'var(--neu-accent)' }} />
                    )}
                    {task.sourceName}
                  </Link>
                  {task.assigneeName && (
                    <>
                      <span>•</span>
                      <span>{task.assigneeName}</span>
                    </>
                  )}
                  {task.due_date && (
                    <>
                      <span>•</span>
                      <span>{new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
