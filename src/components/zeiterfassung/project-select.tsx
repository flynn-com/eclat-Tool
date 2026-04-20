'use client';

import { Project } from '@/lib/types';

interface ProjectSelectProps {
  projects: Project[];
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function ProjectSelect({ projects, name = 'project_id', value, onChange }: ProjectSelectProps) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
    >
      <option value="">Sonstiges</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}
