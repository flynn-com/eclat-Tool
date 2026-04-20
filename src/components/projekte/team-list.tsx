'use client';

import { useState } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addTeamMember, removeTeamMember } from '@/lib/actions/project-planning';
import { ProjectTeamMember, Profile, TeamRole } from '@/lib/types';
import { TEAM_ROLE_LABELS } from '@/lib/constants';

interface Props {
  projectId: string;
  members: ProjectTeamMember[];
  profiles: Pick<Profile, 'id' | 'full_name'>[];
  title?: string;
  filterRole?: TeamRole;
}

export function TeamList({ projectId, members, profiles, title = 'Team', filterRole }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [isInternal, setIsInternal] = useState(true);
  const [userId, setUserId] = useState('');
  const [extName, setExtName] = useState('');
  const [extContact, setExtContact] = useState('');
  const [role, setRole] = useState<string>(filterRole || 'sonstiges');
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  const filtered = filterRole ? members.filter((m) => m.role === filterRole) : members;

  const handleAdd = async () => {
    setIsAdding(true);
    await addTeamMember(projectId, role, isInternal ? userId : undefined, !isInternal ? extName : undefined, !isInternal ? extContact : undefined);
    setUserId(''); setExtName(''); setExtContact('');
    setShowForm(false);
    setIsAdding(false);
    router.refresh();
  };

  const handleRemove = async (memberId: string) => {
    await removeTeamMember(memberId, projectId);
    router.refresh();
  };

  return (
    <div className="neu-raised p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>{title}</h3>
        <button onClick={() => setShowForm(!showForm)} className="neu-btn h-8 w-8 flex items-center justify-center">
          <Plus className="h-4 w-4" style={{ color: 'var(--neu-accent)' }} />
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <button onClick={() => setIsInternal(true)} className={`text-xs px-3 py-1 rounded-full ${isInternal ? 'neu-pressed font-bold' : 'neu-btn'}`}>Intern</button>
            <button onClick={() => setIsInternal(false)} className={`text-xs px-3 py-1 rounded-full ${!isInternal ? 'neu-pressed font-bold' : 'neu-btn'}`}>Extern</button>
          </div>
          {isInternal ? (
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="neu-input w-full text-sm">
              <option value="">Mitarbeiter waehlen</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          ) : (
            <>
              <input type="text" value={extName} onChange={(e) => setExtName(e.target.value)} placeholder="Name" className="neu-input w-full text-sm" />
              <input type="text" value={extContact} onChange={(e) => setExtContact(e.target.value)} placeholder="Kontakt (optional)" className="neu-input w-full text-sm" />
            </>
          )}
          {!filterRole && (
            <select value={role} onChange={(e) => setRole(e.target.value)} className="neu-input w-full text-sm">
              {Object.entries(TEAM_ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          )}
          <button onClick={handleAdd} disabled={isAdding} className="neu-btn-primary px-4 py-2 text-sm disabled:opacity-50">Hinzufuegen</button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2 neu-pressed group">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'var(--neu-accent)' }}>
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
                {m.profiles?.full_name ?? m.external_name ?? 'Unbekannt'}
              </p>
              <p className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
                {TEAM_ROLE_LABELS[m.role] ?? m.role}
                {m.external_contact && ` — ${m.external_contact}`}
              </p>
            </div>
            <button onClick={() => handleRemove(m.id)} className="opacity-0 group-hover:opacity-100 p-1 transition-opacity">
              <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && !showForm && (
          <p className="text-sm" style={{ color: 'var(--neu-accent-mid)' }}>Noch keine Mitglieder</p>
        )}
      </div>
    </div>
  );
}
