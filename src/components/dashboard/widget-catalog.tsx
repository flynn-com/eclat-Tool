'use client';

import { useState, useTransition } from 'react';
import { X, Plus } from 'lucide-react';
import { WIDGET_REGISTRY, type WidgetMeta, type ColSpan } from '@/lib/widget-registry';
import { addWidget } from '@/lib/actions/dashboard-config';

const COL_LABELS: Record<ColSpan, string> = { 1: 'Mini (1 Spalte)', 2: 'Kompakt (2 Spalten)', 4: 'Breit (4 Spalten)' };

interface Props {
  isAdmin: boolean;
  existingKeys: string[];
  onClose: () => void;
}

export function WidgetCatalog({ isAdmin, existingKeys, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState<string | null>(null);

  const available = WIDGET_REGISTRY.filter(
    w => (!w.adminOnly || isAdmin) && !existingKeys.includes(w.key)
  );

  // Group by category
  const groups: Record<string, WidgetMeta[]> = {};
  for (const w of available) {
    groups[w.group] = groups[w.group] ? [...groups[w.group], w] : [w];
  }

  function handleAdd(widget: WidgetMeta) {
    setAdding(widget.key);
    startTransition(async () => {
      await addWidget(widget.key, widget.defaultColSpan);
      setAdding(null);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col max-h-[80vh]"
        style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--neu-border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--neu-text)' }}>Widget hinzufügen</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg" style={{ color: 'var(--neu-accent-mid)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {Object.keys(groups).length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--neu-text-secondary)' }}>
              Alle verfügbaren Widgets sind bereits hinzugefügt.
            </p>
          )}
          {Object.entries(groups).map(([group, widgets]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-accent-mid)' }}>{group}</p>
              <div className="space-y-1.5">
                {widgets.map(w => (
                  <div key={w.key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--neu-bg)', border: '1px solid var(--neu-border-subtle)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--neu-text)' }}>{w.label}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--neu-text-secondary)' }}>
                        {w.description} · {COL_LABELS[w.defaultColSpan]}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAdd(w)}
                      disabled={isPending}
                      className="neu-btn-primary h-7 w-7 flex items-center justify-center shrink-0 disabled:opacity-50"
                    >
                      {adding === w.key
                        ? <span className="text-xs">…</span>
                        : <Plus className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
