'use client';

import {
  Clock, CheckSquare, FolderKanban, Euro, BarChart2,
  MessageSquare, Wrench, Construction,
} from 'lucide-react';
import { FinanzChart } from '@/components/finanzen/finanz-chart';

export interface ProjectMinutes {
  name: string;
  color: string;
  minutes: number;
}

export interface TeamMemberHours {
  id: string;
  name: string;
  minutes: number; // Stundenkonto-Balance
}

export interface WidgetData {
  // Zeiterfassung
  verfuegbarMinutes?: number;
  totalMinutes?: number;
  userProjectBreakdown?: ProjectMinutes[];
  teamMemberHours?: TeamMemberHours[];
  // Aufgaben
  offeneAufgaben?: number;
  // Projekte
  projektCount?: number;
  // Finanzen
  chartData?: { monat: string; label: string; einnahmen: number; ausgaben: number; ergebnis: number }[];
  gesamtEinnahmen?: number;
  gesamtAusgaben?: number;
}

function fmt(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

// Reusable: mini stat tile
function MiniStat({ icon, label, value, color = 'var(--neu-accent)', href }: {
  icon: React.ReactNode; label: string; value: string; color?: string; href?: string;
}) {
  const inner = (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-xl font-bold mt-2" style={{ color: 'var(--neu-text)' }}>{value}</p>
    </div>
  );
  if (href) return <a href={href} className="block h-full">{inner}</a>;
  return inner;
}

// Placeholder for widgets not yet implemented
function Placeholder({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 opacity-40">
      <div style={{ color: 'var(--neu-accent-mid)' }}>{icon}</div>
      <p className="text-xs text-center" style={{ color: 'var(--neu-text-secondary)' }}>{label}</p>
      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--neu-surface)', color: 'var(--neu-accent-mid)' }}>
        Demnächst
      </span>
    </div>
  );
}

export function WidgetContent({ widgetKey, data }: { widgetKey: string; data: WidgetData }) {
  switch (widgetKey) {

    // ── Zeiterfassung ──────────────────────────────────
    case 'zeiterfassung_mini': {
      return (
        <a href="/zeiterfassung" className="block h-full">
          <p className="text-xs mb-2" style={{ color: 'var(--neu-text-secondary)' }}>Stundenkonto</p>
          <p className="text-2xl font-bold mb-1" style={{ color: 'var(--neu-text)' }}>
            {fmt(data.verfuegbarMinutes ?? 0)}
          </p>
          <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Erfasste Stunden</p>
        </a>
      );
    }

    case 'zeiterfassung_compact': {
      const projects = data.userProjectBreakdown ?? [];
      const maxMin = Math.max(...projects.map(p => p.minutes), 1);
      return (
        <a href="/zeiterfassung" className="block h-full flex flex-col">
          <p className="text-xs mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Stundenkonto</p>
          <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--neu-text)' }}>
            {fmt(data.verfuegbarMinutes ?? 0)}
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--neu-text-secondary)' }}>Erfasste Stunden</p>
          <div className="space-y-2.5 flex-1">
            {projects.slice(0, 5).map(p => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs w-20 truncate shrink-0" style={{ color: 'var(--neu-text)' }}>{p.name}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--neu-surface)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((p.minutes / maxMin) * 100)}%`,
                      background: p.color || '#10b981',
                    }}
                  />
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Keine Zeiteinträge vorhanden</p>
            )}
          </div>
        </a>
      );
    }

    case 'zeiterfassung_full': {
      const projects = data.userProjectBreakdown ?? [];
      const maxMin = Math.max(...projects.map(p => p.minutes), 1);
      const team = data.teamMemberHours ?? [];
      const maxTeamMin = Math.max(...team.map(t => t.minutes), 1);
      const TEAM_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981'];

      return (
        <a href="/zeiterfassung" className="block h-full">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left: own projects */}
            <div className="flex flex-col">
              <p className="text-xs mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Stundenkonto</p>
              <p className="text-xl font-bold mb-0.5" style={{ color: 'var(--neu-text)' }}>
                {fmt(data.verfuegbarMinutes ?? 0)}
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--neu-text-secondary)' }}>Erfasste Stunden</p>
              <div className="space-y-2.5 flex-1">
                {projects.slice(0, 5).map(p => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs w-16 truncate shrink-0" style={{ color: 'var(--neu-text)' }}>{p.name}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--neu-surface)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((p.minutes / maxMin) * 100)}%`,
                          background: p.color || '#10b981',
                        }}
                      />
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Keine Einträge</p>
                )}
              </div>
            </div>

            {/* Right: team members */}
            <div className="space-y-3">
              {team.map((member, idx) => (
                <div key={member.id}>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--neu-text)' }}>{member.name}</p>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--neu-text-secondary)' }}>
                    {fmt(member.minutes)}
                  </p>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--neu-surface)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((member.minutes / maxTeamMin) * 100)}%`,
                        background: TEAM_COLORS[idx % TEAM_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
              {team.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Keine weiteren Mitglieder</p>
              )}
            </div>
          </div>
        </a>
      );
    }

    // ── Aufgaben ───────────────────────────────────────
    case 'aufgaben_mini':
      return (
        <MiniStat
          icon={<CheckSquare className="h-4 w-4" />}
          label="Offene Aufgaben"
          value={String(data.offeneAufgaben ?? 0)}
          color="#f59e0b"
          href="/aufgaben"
        />
      );
    case 'aufgaben_full':
      return <Placeholder label="Aufgaben Ausführlich" icon={<CheckSquare className="h-8 w-8" />} />;

    // ── Projekte ───────────────────────────────────────
    case 'projekte_mini':
      return (
        <MiniStat
          icon={<FolderKanban className="h-4 w-4" />}
          label="Aktive Projekte"
          value={String(data.projektCount ?? 0)}
          color="#8b5cf6"
          href="/projekte"
        />
      );
    case 'projekte_full':
      return <Placeholder label="Projekte Ausführlich" icon={<FolderKanban className="h-8 w-8" />} />;

    // ── Finanzen ───────────────────────────────────────
    case 'finanzen_chart':
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="h-4 w-4 shrink-0" style={{ color: 'var(--neu-accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>Einnahmen & Ausgaben</span>
            <a href="/finanzen" className="ml-auto text-xs hover:opacity-80 transition-opacity" style={{ color: 'var(--neu-accent)' }}>Details →</a>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="neu-pressed px-2 py-1.5 rounded-lg">
              <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Einnahmen</p>
              <p className="text-sm font-bold" style={{ color: '#10b981' }}>{eur(data.gesamtEinnahmen ?? 0)}</p>
            </div>
            <div className="neu-pressed px-2 py-1.5 rounded-lg">
              <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Ausgaben</p>
              <p className="text-sm font-bold" style={{ color: '#ef4444' }}>{eur(data.gesamtAusgaben ?? 0)}</p>
            </div>
            <div className="neu-pressed px-2 py-1.5 rounded-lg">
              <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Ergebnis</p>
              <p className="text-sm font-bold" style={{ color: ((data.gesamtEinnahmen ?? 0) - (data.gesamtAusgaben ?? 0)) >= 0 ? '#f59e0b' : '#ef4444' }}>
                {eur((data.gesamtEinnahmen ?? 0) - (data.gesamtAusgaben ?? 0))}
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <FinanzChart data={data.chartData ?? []} compact />
          </div>
        </div>
      );
    case 'finanzen_mini':
      return (
        <MiniStat
          icon={<Euro className="h-4 w-4" />}
          label="Ergebnis gesamt"
          value={eur((data.gesamtEinnahmen ?? 0) - (data.gesamtAusgaben ?? 0))}
          color={(data.gesamtEinnahmen ?? 0) >= (data.gesamtAusgaben ?? 0) ? '#10b981' : '#ef4444'}
          href="/finanzen"
        />
      );
    case 'finanzen_compact':
      return <Placeholder label="Finanzen Kompakt" icon={<Euro className="h-8 w-8" />} />;

    // ── Meetings ───────────────────────────────────────
    case 'meetings_mini':
    case 'meetings_compact':
      return <Placeholder label="Meetings" icon={<MessageSquare className="h-8 w-8" />} />;

    // ── Equipment ─────────────────────────────────────
    case 'equipment_mini':
      return <Placeholder label="Equipment Mini" icon={<Wrench className="h-8 w-8" />} />;

    default:
      return <Placeholder label={widgetKey} icon={<Construction className="h-8 w-8" />} />;
  }
}
