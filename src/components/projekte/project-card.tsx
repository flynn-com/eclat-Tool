'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreVertical, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { archiveProject, unarchiveProject, deleteProject } from '@/app/(protected)/projekte/actions';
import { PhaseBadge } from './phase-badge';
import { ProgressBar } from './progress-bar';
import { CAMPAIGN_TYPE_LABELS } from '@/lib/constants';
import { Project } from '@/lib/types';

interface Props {
  project: Project;
  onEdit: (project: Project) => void;
}

export function ProjectCard({ project, onEdit }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleArchive = async () => {
    setIsLoading(true);
    setMenuOpen(false);
    if (project.status === 'archived') {
      await unarchiveProject(project.id);
    } else {
      await archiveProject(project.id);
    }
    router.refresh();
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Projekt "${project.name}" wirklich endgueltig loeschen? Alle zugehoerigen Daten (Aufgaben, Notizen, Team, etc.) werden ebenfalls geloescht.`)) return;
    setIsLoading(true);
    setMenuOpen(false);
    await deleteProject(project.id);
    router.refresh();
    setIsLoading(false);
  };

  return (
    <div className={`neu-raised p-5 block transition-all relative ${isLoading ? 'opacity-50' : ''}`}>
      {/* Action Menu */}
      <div className="absolute top-3 right-3">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="neu-btn h-8 w-8 flex items-center justify-center"
        >
          <MoreVertical className="h-4 w-4" style={{ color: 'var(--neu-accent)' }} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-10 z-20 neu-raised py-2 min-w-[180px]" style={{ background: 'var(--neu-bg)' }}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onEdit(project); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:opacity-70 text-left"
                style={{ color: 'var(--neu-text)' }}
              >
                <Pencil className="h-4 w-4" /> Bearbeiten
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleArchive(); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:opacity-70 text-left"
                style={{ color: 'var(--neu-text)' }}
              >
                {project.status === 'archived' ? (
                  <><ArchiveRestore className="h-4 w-4" /> Wiederherstellen</>
                ) : (
                  <><Archive className="h-4 w-4" /> Archivieren</>
                )}
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:opacity-70 text-left"
                style={{ color: '#EF4444' }}
              >
                <Trash2 className="h-4 w-4" /> Loeschen
              </button>
            </div>
          </>
        )}
      </div>

      {/* Card content - clickable */}
      <Link href={`/projekte/${project.id}`} className="block pr-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
          <h3 className="font-bold truncate" style={{ color: 'var(--neu-text)', fontFamily: 'var(--font-heading)' }}>{project.name}</h3>
        </div>
        {project.client_name && (
          <p className="text-sm mb-2" style={{ color: 'var(--neu-text-secondary)' }}>Kunde: {project.client_name}</p>
        )}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <PhaseBadge phase={project.phase} />
          {project.status === 'archived' && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#9CA3AF', color: 'white' }}>Archiviert</span>
          )}
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
    </div>
  );
}
