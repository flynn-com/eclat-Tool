'use client';

import { Profile, Project } from '@/lib/types';

interface FiltersProps {
  profiles: Pick<Profile, 'id' | 'full_name'>[];
  projects: Pick<Project, 'id' | 'name'>[];
  selectedUser: string;
  selectedProject: string;
  onUserChange: (userId: string) => void;
  onProjectChange: (projectId: string) => void;
}

export function TimeEntriesFilters({
  profiles,
  projects,
  selectedUser,
  selectedProject,
  onUserChange,
  onProjectChange,
}: FiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <select
        value={selectedUser}
        onChange={(e) => onUserChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
      >
        <option value="">Alle Mitarbeiter</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>{p.full_name}</option>
        ))}
      </select>
      <select
        value={selectedProject}
        onChange={(e) => onProjectChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
      >
        <option value="">Alle Projekte</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
