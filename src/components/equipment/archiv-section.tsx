'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Archive, Trash2, ChevronDown, ChevronUp, Euro } from 'lucide-react';
import { EquipmentItem, EquipmentCategory } from '@/lib/types';
import { archiveEquipmentItem, deleteEquipmentItem } from '@/lib/actions/equipment-archive';
import { ItemFormModal } from './item-form-modal';

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  kamera:    'Kamera',
  objektiv:  'Objektiv',
  licht:     'Licht',
  ton:       'Ton',
  stativ:    'Stativ',
  speicher:  'Speicher',
  zubehoer:  'Zubehör',
  sonstiges: 'Sonstiges',
};

const CATEGORY_COLORS: Record<EquipmentCategory, string> = {
  kamera:    '#3b82f6',
  objektiv:  '#8b5cf6',
  licht:     '#f59e0b',
  ton:       '#10b981',
  stativ:    '#6b7280',
  speicher:  '#ec4899',
  zubehoer:  '#06b6d4',
  sonstiges: '#6b7280',
};

interface Props {
  items: EquipmentItem[];
  profiles: { id: string; full_name: string }[];
}

function DepreciationInfo({ item }: { item: EquipmentItem }) {
  if (!item.purchase_price || !item.depreciation_years) return null;
  const annualDep = item.purchase_price / item.depreciation_years;
  return (
    <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
      {annualDep.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Jahr AfA
    </span>
  );
}

function ItemRow({ item, profiles, onEdit }: { item: EquipmentItem; profiles: { id: string; full_name: string }[]; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const owner = profiles.find(p => p.id === item.owner_id);

  function handleArchive() {
    startTransition(async () => {
      await archiveEquipmentItem(item.id, item.status === 'active');
    });
  }

  function handleDelete() {
    if (!confirm(`"${item.name}" wirklich löschen?`)) return;
    startTransition(async () => {
      await deleteEquipmentItem(item.id);
    });
  }

  const color = CATEGORY_COLORS[item.category];
  const isArchived = item.status === 'archived';

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--neu-border-subtle)', opacity: isPending ? 0.5 : 1 }}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        style={{ background: 'var(--neu-bg)' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Category badge */}
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
          {CATEGORY_LABELS[item.category]}
        </span>

        {/* Name */}
        <span className="flex-1 text-sm font-medium truncate" style={{ color: isArchived ? 'var(--neu-accent-mid)' : 'var(--neu-text)' }}>
          {item.name}
          {isArchived && <span className="ml-2 text-xs" style={{ color: 'var(--neu-accent-mid)' }}>(archiviert)</span>}
        </span>

        {/* Day rate */}
        {item.day_rate != null && (
          <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--neu-text)' }}>
            {item.day_rate.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Tag
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--neu-accent-mid)' }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleArchive} className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--neu-accent-mid)' }} title={isArchived ? 'Reaktivieren' : 'Archivieren'}>
            <Archive className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleDelete} className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--neu-accent-mid)' }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'var(--neu-accent-mid)' }} /> : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--neu-accent-mid)' }} />}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2" style={{ background: 'var(--neu-bg)', borderTop: '1px solid var(--neu-border-subtle)' }}>
          {owner && <Detail label="Inhaber" value={owner.full_name} />}
          {item.serial_number && <Detail label="Seriennummer" value={item.serial_number} />}
          {item.hour_rate != null && <Detail label="Stundensatz" value={`${item.hour_rate.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`} />}
          {item.purchase_price != null && <Detail label="Anschaffungspreis" value={`${item.purchase_price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`} />}
          {item.purchase_date && <Detail label="Anschaffungsdatum" value={new Date(item.purchase_date).toLocaleDateString('de-DE')} />}
          {item.current_value != null && <Detail label="Aktueller Wert" value={`${item.current_value.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`} />}
          {item.depreciation_years && (
            <Detail label="Abschreibung" value={`${item.depreciation_years} Jahre`}>
              <DepreciationInfo item={item} />
            </Detail>
          )}
          {item.warranty_until && (
            <Detail label="Garantie bis" value={new Date(item.warranty_until).toLocaleDateString('de-DE')}
              highlight={new Date(item.warranty_until) < new Date() ? '#ef4444' : undefined} />
          )}
          {item.description && <div className="col-span-full"><Detail label="Beschreibung" value={item.description} /></div>}
          {item.notes && <div className="col-span-full"><Detail label="Notizen" value={item.notes} /></div>}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, highlight, children }: { label: string; value: string; highlight?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: highlight ?? 'var(--neu-text)' }}>{value}</p>
      {children}
    </div>
  );
}

export function ArchivSection({ items, profiles }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<EquipmentItem | null>(null);
  const [filterCat, setFilterCat] = useState<string>('alle');
  const [showArchived, setShowArchived] = useState(false);

  const activeItems = items.filter(i => i.status === 'active');
  const archivedItems = items.filter(i => i.status === 'archived');
  const visibleItems = (showArchived ? items : activeItems)
    .filter(i => filterCat === 'alle' || i.category === filterCat);

  const categories = [...new Set(items.filter(i => i.status === 'active').map(i => i.category))];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFilterCat('alle')}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filterCat === 'alle' ? 'var(--neu-surface)' : 'transparent',
              border: `1px solid ${filterCat === 'alle' ? 'var(--neu-border)' : 'transparent'}`,
              color: filterCat === 'alle' ? 'var(--neu-text)' : 'var(--neu-accent-mid)',
            }}>
            Alle ({activeItems.length})
          </button>
          {categories.map(cat => {
            const count = activeItems.filter(i => i.category === cat).length;
            return (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: filterCat === cat ? 'var(--neu-surface)' : 'transparent',
                  border: `1px solid ${filterCat === cat ? CATEGORY_COLORS[cat as EquipmentCategory] : 'transparent'}`,
                  color: filterCat === cat ? CATEGORY_COLORS[cat as EquipmentCategory] : 'var(--neu-accent-mid)',
                }}>
                {CATEGORY_LABELS[cat as EquipmentCategory]} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {archivedItems.length > 0 && (
            <button onClick={() => setShowArchived(!showArchived)}
              className="neu-btn px-3 py-1.5 text-xs">
              {showArchived ? 'Archiv ausblenden' : `Archiviert (${archivedItems.length})`}
            </button>
          )}
          <button onClick={() => setShowForm(true)}
            className="neu-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="h-4 w-4" />
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {visibleItems.map(item => (
          <ItemRow key={item.id} item={item} profiles={profiles} onEdit={() => setEditItem(item)} />
        ))}
        {visibleItems.length === 0 && (
          <div className="py-12 text-center" style={{ color: 'var(--neu-accent-mid)' }}>
            <Euro className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Noch kein Equipment im Archiv</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ItemFormModal profiles={profiles} onClose={() => setShowForm(false)} />
      )}
      {editItem && (
        <ItemFormModal item={editItem} profiles={profiles} onClose={() => setEditItem(null)} />
      )}
    </div>
  );
}
