'use client';

import { Project, TimeCategory } from '@/lib/types';

interface ProjectSelectProps {
  projects: Project[];
  categories?: TimeCategory[];
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function ProjectSelect({ projects, categories = [], name = 'project_id', value, onChange }: ProjectSelectProps) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
    >
      <option value="">Sonstiges</option>

      {categories.length > 0 && (
        <optgroup label="Kategorien">
          {categories.map(c => (
            <option key={`cat_${c.id}`} value={`cat_${c.id}`}>
              {c.name}
            </option>
          ))}
        </optgroup>
      )}

      {projects.length > 0 && (
        <optgroup label="Projekte">
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
