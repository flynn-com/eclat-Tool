'use client';

import { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TimeEntryWithRelations, Profile, Project } from '@/lib/types';

interface StundenKonto {
  erfasst: number;
  abgerechnet: number;
}

interface TimeEntriesTableProps {
  entries: TimeEntryWithRelations[];
  profiles: Pick<Profile, 'id' | 'full_name'>[];
  projects: Pick<Project, 'id' | 'name' | 'color'>[];
  currentUserId: string;
  stundenkonten?: Record<string, StundenKonto>;
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '0 Std 00 Min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h} Std ${m.toString().padStart(2, '0')} Min`;
  return `${m} Min`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Generate a consistent color for each user based on index
const USER_COLORS = [
  '#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
];

interface UserSummary {
  userId: string;
  fullName: string;
  totalMinutes: number;
  projects: { projectId: string | null; name: string; color: string; minutes: number }[];
  entries: TimeEntryWithRelations[];
}

function buildUserSummaries(entries: TimeEntryWithRelations[]): UserSummary[] {
  const map = new Map<string, UserSummary>();

  for (const entry of entries) {
    if (!map.has(entry.user_id)) {
      map.set(entry.user_id, {
        userId: entry.user_id,
        fullName: entry.profiles?.full_name ?? 'Unbekannt',
        totalMinutes: 0,
        projects: [],
        entries: [],
      });
    }
    const user = map.get(entry.user_id)!;
    user.entries.push(entry);
    if (entry.duration_minutes) {
      user.totalMinutes += entry.duration_minutes;
    }
  }

  for (const user of map.values()) {
    const projectMap = new Map<string, { name: string; color: string; minutes: number }>();
    for (const entry of user.entries) {
      const key = entry.project_id ?? '__none__';
      const name = entry.projects?.name ?? 'Sonstiges';
      const color = entry.projects?.color ?? '#9CA3AF';
      if (!projectMap.has(key)) {
        projectMap.set(key, { name, color, minutes: 0 });
      }
      if (entry.duration_minutes) {
        projectMap.get(key)!.minutes += entry.duration_minutes;
      }
    }
    user.projects = Array.from(projectMap.entries()).map(([id, p]) => ({
      projectId: id === '__none__' ? null : id,
      ...p,
    })).sort((a, b) => b.minutes - a.minutes);
  }

  return Array.from(map.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
}

export function TimeEntriesTable({ entries, profiles, projects, currentUserId, stundenkonten }: TimeEntriesTableProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const filtered = entries.filter((e) => {
    if (selectedUser && e.user_id !== selectedUser) return false;
    if (selectedProject && e.project_id !== selectedProject) return false;
    return true;
  });

  const userSummaries = buildUserSummaries(filtered);

  const handleDelete = async (entryId: string) => {
    if (!confirm('Eintrag wirklich loeschen?')) return;
    setDeletingId(entryId);
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', entryId);
    if (error) {
      alert('Fehler: ' + error.message);
    } else {
      router.refresh();
    }
    setDeletingId(null);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Team-Uebersicht</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="">Alle Mitarbeiter</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="">Alle Projekte</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {userSummaries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Keine Eintraege gefunden
        </div>
      ) : (
        <div className="space-y-4">
          {userSummaries.map((user, userIndex) => {
            const userColor = USER_COLORS[userIndex % USER_COLORS.length];
            const isExpanded = expandedUser === user.userId;

            return (
              <div key={user.userId} className="bg-gray-100 rounded-2xl overflow-hidden">
                {/* User Header */}
                <div className="flex items-center justify-between p-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: userColor }}
                    >
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{user.fullName}</p>
                      {stundenkonten?.[user.userId] && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-semibold">
                            <span className="text-green-600">{(stundenkonten[user.userId].erfasst - stundenkonten[user.userId].abgerechnet).toFixed(1)} Std</span>
                            <span className="text-gray-900"> abrechenbar</span>
                          </span>
                          {stundenkonten[user.userId].abgerechnet > 0 && (
                            <span className="text-xs text-gray-400">|  {stundenkonten[user.userId].abgerechnet.toFixed(1)} Std abgerechnet</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatDuration(user.totalMinutes)}</p>
                    <p className="text-xs text-gray-500">Diesen Monat</p>
                  </div>
                </div>

                {/* Project Bars */}
                <div className="px-5 pb-2 space-y-3">
                  {user.projects.map((proj) => {
                    const percent = user.totalMinutes > 0
                      ? Math.max((proj.minutes / user.totalMinutes) * 100, 2)
                      : 0;

                    return (
                      <div key={proj.projectId ?? 'none'} className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700 w-28 flex-shrink-0 truncate">
                          {proj.name}
                        </span>
                        <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: proj.color,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-20 text-right flex-shrink-0">
                          {formatDuration(proj.minutes)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* More / Less Toggle */}
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : user.userId)}
                  className="w-full flex items-center justify-center gap-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {isExpanded ? 'Weniger' : 'More'}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* Expanded: Individual Entries */}
                {isExpanded && (
                  <div className="bg-white mx-3 mb-3 rounded-xl overflow-hidden">
                    <div className="divide-y divide-gray-100">
                      {user.entries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-gray-500 flex-shrink-0">{formatDate(entry.start_time)}</span>
                            <span className="flex items-center gap-1.5 flex-shrink-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: entry.projects?.color ?? '#9CA3AF' }}
                              />
                              <span className="text-gray-700">{entry.projects?.name ?? 'Sonstiges'}</span>
                            </span>
                            {entry.description && (
                              <span className="text-gray-400 truncate">— {entry.description}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-gray-500">
                              {formatTime(entry.start_time)} – {entry.end_time ? formatTime(entry.end_time) : <span className="text-green-600">Laeuft</span>}
                            </span>
                            <span className="font-semibold text-gray-900 w-16 text-right">
                              {formatDuration(entry.duration_minutes)}
                            </span>
                            {entry.user_id === currentUserId && entry.end_time && (
                              <button
                                onClick={() => handleDelete(entry.id)}
                                disabled={deletingId === entry.id}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
