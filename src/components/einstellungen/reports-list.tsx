'use client';

import { useTransition } from 'react';
import { Bug, Lightbulb, MessageSquare, Trash2, Eye, CheckCircle, Circle } from 'lucide-react';
import { Report, ReportStatus } from '@/lib/types';
import { updateReportStatus, deleteReport } from '@/lib/actions/reports';

const TYPE_META = {
  bug:       { label: 'Bug',      icon: <Bug className="h-3.5 w-3.5" />,         color: '#ef4444' },
  feature:   { label: 'Feature',  icon: <Lightbulb className="h-3.5 w-3.5" />,   color: '#f59e0b' },
  sonstiges: { label: 'Sonstiges',icon: <MessageSquare className="h-3.5 w-3.5" />, color: '#6b7280' },
};

const STATUS_META: Record<ReportStatus, { label: string; color: string }> = {
  neu:      { label: 'Neu',      color: '#3b82f6' },
  gesehen:  { label: 'Gesehen',  color: '#f59e0b' },
  erledigt: { label: 'Erledigt', color: '#22c55e' },
};

const STATUS_CYCLE: Record<ReportStatus, ReportStatus> = {
  neu:      'gesehen',
  gesehen:  'erledigt',
  erledigt: 'neu',
};

interface ReportRowProps {
  report: Report & { profiles?: { full_name: string } | null };
}

function ReportRow({ report }: ReportRowProps) {
  const [isPending, startTransition] = useTransition();
  const typeMeta = TYPE_META[report.type];
  const statusMeta = STATUS_META[report.status];

  function cycleStatus() {
    startTransition(async () => {
      await updateReportStatus(report.id, STATUS_CYCLE[report.status]);
    });
  }

  function handleDelete() {
    if (!confirm('Report löschen?')) return;
    startTransition(async () => {
      await deleteReport(report.id);
    });
  }

  return (
    <div
      className="p-4 rounded-xl flex gap-4 items-start"
      style={{
        background: 'var(--neu-bg)',
        border: '1px solid var(--neu-border-subtle)',
        opacity: isPending ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Type Badge */}
      <div
        className="mt-0.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
        style={{ background: `${typeMeta.color}15`, color: typeMeta.color, border: `1px solid ${typeMeta.color}30` }}
      >
        {typeMeta.icon}
        {typeMeta.label}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--neu-text)' }}>{report.title}</p>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>{report.description}</p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {report.page_url && (
            <span className="text-xs font-mono" style={{ color: 'var(--neu-accent-mid)' }}>{report.page_url}</span>
          )}
          <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
            {report.profiles?.full_name ?? 'Unbekannt'}
          </span>
          <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
            {new Date(report.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Status Toggle */}
        <button
          onClick={cycleStatus}
          disabled={isPending}
          title={`Status: ${statusMeta.label} → klicken zum Weiterschalten`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ background: `${statusMeta.color}15`, color: statusMeta.color, border: `1px solid ${statusMeta.color}30` }}
        >
          {report.status === 'neu'      && <Circle className="h-3 w-3" />}
          {report.status === 'gesehen'  && <Eye className="h-3 w-3" />}
          {report.status === 'erledigt' && <CheckCircle className="h-3 w-3" />}
          {statusMeta.label}
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isPending}
          title="Löschen"
          className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--neu-accent-mid)' }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface ReportsListProps {
  reports: (Report & { profiles?: { full_name: string } | null })[];
}

export function ReportsList({ reports }: ReportsListProps) {
  const neu      = reports.filter(r => r.status === 'neu');
  const gesehen  = reports.filter(r => r.status === 'gesehen');
  const erledigt = reports.filter(r => r.status === 'erledigt');

  if (reports.length === 0) {
    return (
      <div className="p-6 text-center text-sm" style={{ color: 'var(--neu-accent-mid)' }}>
        Noch keine Reports eingegangen.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {neu.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#3b82f6' }}>
            Neu ({neu.length})
          </p>
          <div className="space-y-2">
            {neu.map(r => <ReportRow key={r.id} report={r} />)}
          </div>
        </div>
      )}
      {gesehen.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#f59e0b' }}>
            Gesehen ({gesehen.length})
          </p>
          <div className="space-y-2">
            {gesehen.map(r => <ReportRow key={r.id} report={r} />)}
          </div>
        </div>
      )}
      {erledigt.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#22c55e' }}>
            Erledigt ({erledigt.length})
          </p>
          <div className="space-y-2">
            {erledigt.map(r => <ReportRow key={r.id} report={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}
