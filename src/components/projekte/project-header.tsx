'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhaseBadge } from './phase-badge';
import { ProgressBar } from './progress-bar';
import { createClient } from '@/lib/supabase/client';
import { Project, ProjectPhase } from '@/lib/types';
import { PHASE_LABELS, CAMPAIGN_TYPE_LABELS } from '@/lib/constants';
import { ChevronRight } from 'lucide-react';

const PHASE_FLOW: ProjectPhase[] = ['planung', 'produktion', 'postproduktion', 'review', 'abgeschlossen'];

export function ProjectHeader({ project }: { project: Project }) {
  const [progress, setProgress] = useState(project.progress);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const advancePhase = async () => {
    const idx = PHASE_FLOW.indexOf(project.phase);
    if (idx >= PHASE_FLOW.length - 1) return;
    const next = PHASE_FLOW[idx + 1];
    setIsSaving(true);
    await supabase.from('projects').update({ phase: next }).eq('id', project.id);
    setIsSaving(false);
    router.refresh();
  };

  const saveProgress = async (val: number) => {
    setProgress(val);
    await supabase.from('projects').update({ progress: val }).eq('id', project.id);
    router.refresh();
  };

  return (
    <div className="neu-raised p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>{project.name}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {project.client_name && <span className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>{project.client_name}</span>}
            {project.campaign_type && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--neu-surface)', color: 'var(--neu-accent)' }}>
                {CAMPAIGN_TYPE_LABELS[project.campaign_type]}
              </span>
            )}
            {project.deadline && (
              <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
                Deadline: {new Date(project.deadline).toLocaleDateString('de-DE')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PhaseBadge phase={project.phase} />
          {project.phase !== 'abgeschlossen' && (
            <button onClick={advancePhase} disabled={isSaving} className="neu-btn flex items-center gap-1 px-3 py-1.5 text-xs font-medium" style={{ color: 'var(--neu-accent)' }}>
              {PHASE_LABELS[PHASE_FLOW[PHASE_FLOW.indexOf(project.phase) + 1]] ?? 'Weiter'}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar value={progress} />
          </div>
          <input
            type="number" min={0} max={100} value={progress}
            onChange={(e) => saveProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
            className="neu-input w-16 text-center text-sm"
          />
        </div>
      </div>
    </div>
  );
}
