'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { Settings2, Plus, X, GripVertical, Columns, Check } from 'lucide-react';
import { WidgetContent, type WidgetData } from './widget-content';
import { WidgetCatalog } from './widget-catalog';
import { removeWidget, reorderWidgets, resizeWidget, initDefaultWidgets } from '@/lib/actions/dashboard-config';
import { getWidget, type ColSpan } from '@/lib/widget-registry';

export interface UserWidget {
  widget_key: string;
  position: number;
  col_span: number;
}

interface Props {
  initialWidgets: UserWidget[];
  widgetData: WidgetData;
  isAdmin: boolean;
  isNewUser: boolean;
  canEdit: boolean;
}

const COL_OPTIONS: ColSpan[] = [1, 2, 4];
const COL_LABELS: Record<ColSpan, string> = { 1: '1 Spalte', 2: '2 Spalten', 4: '4 Spalten' };

export function DashboardGrid({ initialWidgets, widgetData, isAdmin, isNewUser, canEdit }: Props) {
  const [widgets, setWidgets] = useState<UserWidget[]>(initialWidgets);
  const [editMode, setEditMode] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Drag state
  const dragKey = useRef<string | null>(null);
  const dragOverKey = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Init defaults for new user
  useEffect(() => {
    if (isNewUser && initialWidgets.length === 0) {
      // trigger default init on first render
      const { DEFAULT_WIDGETS_ADMIN, DEFAULT_WIDGETS_EMPLOYEE } = require('@/lib/widget-registry');
      const defaults = isAdmin ? DEFAULT_WIDGETS_ADMIN : DEFAULT_WIDGETS_EMPLOYEE;
      startTransition(async () => {
        await initDefaultWidgets(defaults);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Drag handlers ──────────────────────────────────
  function onDragStart(key: string) {
    dragKey.current = key;
    setDragging(key);
  }

  function onDragOver(e: React.DragEvent, key: string) {
    e.preventDefault();
    if (key !== dragKey.current) {
      dragOverKey.current = key;
      setDragOver(key);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const from = dragKey.current;
    const to = dragOverKey.current;
    if (!from || !to || from === to) {
      setDragging(null);
      setDragOver(null);
      return;
    }

    const reordered = [...widgets];
    const fromIdx = reordered.findIndex(w => w.widget_key === from);
    const toIdx = reordered.findIndex(w => w.widget_key === to);
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const withPositions = reordered.map((w, i) => ({ ...w, position: i }));

    setWidgets(withPositions);
    setDragging(null);
    setDragOver(null);
    dragKey.current = null;
    dragOverKey.current = null;

    startTransition(async () => {
      await reorderWidgets(withPositions.map(w => w.widget_key));
    });
  }

  function onDragEnd() {
    setDragging(null);
    setDragOver(null);
    dragKey.current = null;
    dragOverKey.current = null;
  }

  // ── Remove ─────────────────────────────────────────
  function handleRemove(key: string) {
    setWidgets(prev => prev.filter(w => w.widget_key !== key));
    startTransition(async () => {
      await removeWidget(key);
    });
  }

  // ── Resize ─────────────────────────────────────────
  function handleResize(key: string, colSpan: ColSpan) {
    setWidgets(prev => prev.map(w => w.widget_key === key ? { ...w, col_span: colSpan } : w));
    startTransition(async () => {
      await resizeWidget(key, colSpan);
    });
  }

  // ── Render ─────────────────────────────────────────
  const heightForColSpan = (colSpan: number, key: string): string => {
    if (key === 'finanzen_chart') return '300px';
    if (key === 'zeiterfassung_full') return '280px';
    if (key === 'zeiterfassung_compact') return '280px';
    if (key === 'zeiterfassung_mini') return '140px';
    if (colSpan === 1) return '140px';
    if (colSpan === 2) return '180px';
    return '260px';
  };

  return (
    <>
      {/* Toolbar — nur für Admins */}
      {canEdit && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
            {editMode ? 'Widgets per Drag & Drop verschieben, Größe ändern oder entfernen' : ''}
          </p>
          <div className="flex items-center gap-2">
            {editMode && (
              <button
                onClick={() => setShowCatalog(true)}
                className="neu-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Widget hinzufügen
              </button>
            )}
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: editMode ? 'rgba(16,185,129,0.12)' : 'var(--neu-surface)',
                border: `1px solid ${editMode ? 'rgba(16,185,129,0.3)' : 'var(--neu-border)'}`,
                color: editMode ? '#10b981' : 'var(--neu-text-secondary)',
              }}
            >
              {editMode ? <><Check className="h-3.5 w-3.5" /> Fertig</> : <><Settings2 className="h-3.5 w-3.5" /> Dashboard bearbeiten</>}
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div
        className="grid gap-4 widget-grid"
        style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        {widgets.map(w => {
          const meta = getWidget(w.widget_key);
          const isDragging = dragging === w.widget_key;
          const isOver = dragOver === w.widget_key;
          const colSpan = w.col_span as ColSpan;

          return (
            <div
              key={w.widget_key}
              draggable={canEdit && editMode}
              onDragStart={() => canEdit && onDragStart(w.widget_key)}
              onDragOver={e => canEdit && onDragOver(e, w.widget_key)}
              onDrop={e => canEdit && onDrop(e)}
              onDragEnd={() => canEdit && onDragEnd()}
              className="neu-raised relative transition-all duration-150"
              style={{
                gridColumn: `span ${colSpan}`,
                height: heightForColSpan(colSpan, w.widget_key),
                opacity: isDragging ? 0.4 : 1,
                outline: isOver && editMode ? '2px dashed var(--neu-accent)' : 'none',
                outlineOffset: '2px',
                cursor: editMode ? 'grab' : 'default',
                padding: '1rem',
              }}
            >
              {/* Edit-Mode overlay controls */}
              {canEdit && editMode && (
                <>
                  {/* Drag handle */}
                  <div className="absolute top-2 left-2 opacity-40" style={{ color: 'var(--neu-accent-mid)', pointerEvents: 'none' }}>
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(w.widget_key)}
                    className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-full transition-opacity hover:opacity-70 z-10"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                    title="Entfernen"
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {/* Resize buttons */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                    {COL_OPTIONS.filter(opt => {
                      // Don't show options that don't make sense for this widget
                      return true;
                    }).map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleResize(w.widget_key, opt)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium transition-all"
                        style={{
                          background: colSpan === opt ? 'var(--neu-accent)' : 'var(--neu-surface)',
                          color: colSpan === opt ? '#fff' : 'var(--neu-text-secondary)',
                          border: `1px solid ${colSpan === opt ? 'transparent' : 'var(--neu-border)'}`,
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {/* Widget label overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-medium px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)' }}>
                      {meta?.label ?? w.widget_key}
                    </span>
                  </div>
                </>
              )}

              {/* Actual widget content — hidden in edit mode for clean drag UX */}
              <div className={`h-full transition-opacity ${editMode ? 'opacity-20 pointer-events-none select-none' : 'opacity-100'}`}>
                <WidgetContent widgetKey={w.widget_key} data={widgetData} />
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {widgets.length === 0 && (
          <div
            className="neu-raised flex flex-col items-center justify-center gap-3 py-16"
            style={{ gridColumn: 'span 4', opacity: 0.6 }}
          >
            <Settings2 className="h-8 w-8" style={{ color: 'var(--neu-accent-mid)' }} />
            <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Noch keine Widgets. Klicke auf „Dashboard bearbeiten" um zu starten.</p>
          </div>
        )}
      </div>

      {/* Catalog Modal */}
      {showCatalog && (
        <WidgetCatalog
          isAdmin={isAdmin}
          existingKeys={widgets.map(w => w.widget_key)}
          onClose={() => setShowCatalog(false)}
        />
      )}
    </>
  );
}
