'use client';

import { useState } from 'react';
import { ProjectCard } from './project-card';
import { EditProjectModal } from './edit-project-modal';
import { Project } from '@/lib/types';

interface Props {
  projects: Project[];
}

export function ProjectList({ projects }: Props) {
  const [editProject, setEditProject] = useState<Project | null>(null);

  if (projects.length === 0) {
    return (
      <div className="neu-raised p-8 text-center" style={{ color: 'var(--neu-accent-mid)' }}>
        Keine Projekte gefunden
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} onEdit={setEditProject} />
        ))}
      </div>
      {editProject && <EditProjectModal project={editProject} onClose={() => setEditProject(null)} />}
    </>
  );
}
