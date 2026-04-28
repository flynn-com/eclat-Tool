import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProjectList } from '@/components/projekte/project-list';
import { PHASE_LABELS } from '@/lib/constants';
import { Project } from '@/lib/types';

export default async function ProjektePage({ searchParams }: { searchParams: Promise<{ phase?: string; status?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();

  const aktiverStatus = params.status === 'archiviert' ? 'archived' : 'active';

  let query = supabase
    .from('projects')
    .select('*')
    .eq('status', aktiverStatus)
    .order('created_at', { ascending: false });

  if (params.phase && params.phase !== 'alle') {
    query = query.eq('phase', params.phase);
  }

  const { data: projects } = await query;
  const activePhase = params.phase || 'alle';

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Projekte</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Projektverwaltung und Planung</p>
        </div>
        <Link href="/projekte/neu" className="neu-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Neues Projekt
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <Link
          href="/projekte"
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${aktiverStatus === 'active' ? 'neu-pressed' : 'neu-raised-sm'}`}
          style={{ color: aktiverStatus === 'active' ? 'var(--neu-accent)' : 'var(--neu-accent-mid)' }}
        >
          Aktiv
        </Link>
        <Link
          href="/projekte?status=archiviert"
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${aktiverStatus === 'archived' ? 'neu-pressed' : 'neu-raised-sm'}`}
          style={{ color: aktiverStatus === 'archived' ? 'var(--neu-accent)' : 'var(--neu-accent-mid)' }}
        >
          Archiv
        </Link>
      </div>

      {/* Phase Filter (nur fuer aktive) */}
      {aktiverStatus === 'active' && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {[{ key: 'alle', label: 'Alle Phasen' }, ...Object.entries(PHASE_LABELS).map(([k, v]) => ({ key: k, label: v }))].map((f) => (
            <Link
              key={f.key}
              href={f.key === 'alle' ? '/projekte' : `/projekte?phase=${f.key}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activePhase === f.key ? 'neu-pressed' : 'neu-raised-sm'}`}
              style={{ color: activePhase === f.key ? 'var(--neu-accent)' : 'var(--neu-accent-mid)' }}
            >
              {f.label}
            </Link>
          ))}
        </div>
      )}

      {aktiverStatus === 'archived' && <div className="mb-6" />}

      <ProjectList projects={(projects as Project[]) ?? []} />
    </div>
  );
}
