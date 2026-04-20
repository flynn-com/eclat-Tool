import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PhaseBadge } from '@/components/projekte/phase-badge';
import { ProgressBar } from '@/components/projekte/progress-bar';
import { PHASE_LABELS, CAMPAIGN_TYPE_LABELS } from '@/lib/constants';
import { Project } from '@/lib/types';

export default async function ProjektePage({ searchParams }: { searchParams: Promise<{ phase?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase.from('projects').select('*').eq('status', 'active').order('created_at', { ascending: false });
  if (params.phase && params.phase !== 'alle') {
    query = query.eq('phase', params.phase);
  }

  const { data: projects } = await query;
  const activePhase = params.phase || 'alle';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Projekte</h1>
          <p style={{ color: 'var(--neu-text-secondary)' }} className="mt-1 text-sm">Projektverwaltung und Planung</p>
        </div>
        <Link href="/projekte/neu" className="neu-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Neues Projekt
        </Link>
      </div>

      {/* Phase Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ key: 'alle', label: 'Alle' }, ...Object.entries(PHASE_LABELS).map(([k, v]) => ({ key: k, label: v }))].map((f) => (
          <Link
            key={f.key}
            href={f.key === 'alle' ? '/projekte' : `/projekte?phase=${f.key}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activePhase === f.key ? 'neu-pressed' : 'neu-raised-sm'
            }`}
            style={{ color: activePhase === f.key ? 'var(--neu-accent)' : 'var(--neu-accent-mid)' }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Project Grid */}
      {(!projects || projects.length === 0) ? (
        <div className="neu-raised p-8 text-center" style={{ color: 'var(--neu-accent-mid)' }}>
          Keine Projekte gefunden
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project: Project) => (
            <Link key={project.id} href={`/projekte/${project.id}`} className="neu-raised p-5 block transition-all hover:opacity-90">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                <h3 className="font-bold truncate" style={{ color: 'var(--neu-text)', fontFamily: 'var(--font-heading)' }}>{project.name}</h3>
              </div>
              {project.client_name && (
                <p className="text-sm mb-2" style={{ color: 'var(--neu-text-secondary)' }}>Kunde: {project.client_name}</p>
              )}
              <div className="flex items-center gap-2 mb-3">
                <PhaseBadge phase={project.phase} />
                {project.campaign_type && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--neu-surface)', color: 'var(--neu-accent)' }}>
                    {CAMPAIGN_TYPE_LABELS[project.campaign_type]}
                  </span>
                )}
              </div>
              <ProgressBar value={project.progress} />
              {project.deadline && (
                <p className="text-xs mt-2" style={{ color: 'var(--neu-accent-mid)' }}>
                  Deadline: {new Date(project.deadline).toLocaleDateString('de-DE')}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
