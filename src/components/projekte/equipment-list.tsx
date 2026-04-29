'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Package, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addEquipment, updateEquipmentStatus, deleteEquipment } from '@/lib/actions/project-planning';
import { updateProjectEquipmentDays } from '@/lib/actions/equipment-archive';
import { ProjectEquipmentItem, EquipmentItem, EquipmentPackage } from '@/lib/types';
import { EQUIPMENT_STATUS_LABELS } from '@/lib/constants';
import { CatalogPicker } from '@/components/equipment/catalog-picker';

interface Props {
  projectId: string;
  items: ProjectEquipmentItem[];
  showStatusToggle?: boolean;
  catalogItems?: EquipmentItem[];
  catalogPackages?: EquipmentPackage[];
}

export function EquipmentList({ projectId, items, showStatusToggle = false, catalogItems = [], catalogPackages = [] }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [qty, setQty] = useState('1');
  const [isAdding, setIsAdding] = useState(false);
  const [editingDays, setEditingDays] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = async () => {
    if (!name.trim()) return;
    setIsAdding(true);
    await addEquipment(projectId, name, category || undefined, parseInt(qty) || 1);
    setName(''); setCategory(''); setQty('1');
    setShowForm(false);
    setIsAdding(false);
    router.refresh();
  };

  const cycleStatus = async (item: ProjectEquipmentItem) => {
    const flow = ['geplant', 'bestaetigt', 'gepackt', 'vor_ort', 'zurueck'];
    const idx = flow.indexOf(item.status);
    const next = flow[(idx + 1) % flow.length];
    await updateEquipmentStatus(item.id, next, projectId);
    router.refresh();
  };

  const statusColor = (s: string) => {
    if (s === 'gepackt' || s === 'vor_ort') return '#10B981';
    if (s === 'bestaetigt') return '#F59E0B';
    if (s === 'zurueck') return 'var(--neu-accent)';
    return 'var(--neu-accent-mid)';
  };

  const handleDaysSave = (item: ProjectEquipmentItem, val: string) => {
    const days = parseInt(val) || 1;
    startTransition(async () => {
      await updateProjectEquipmentDays(item.id, projectId, days);
      router.refresh();
    });
    setEditingDays(null);
  };

  // Kalkulation: nur Items mit day_rate
  const calcItems = items.filter(i => i.day_rate != null);
  const totalCost = calcItems.reduce((sum, i) => sum + (i.day_rate! * i.days_count), 0);
  const hasCatalog = catalogItems.length > 0 || catalogPackages.length > 0;

  return (
    <div className="neu-raised p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Equipment</h3>
        <div className="flex gap-1">
          {hasCatalog && (
            <button onClick={() => setShowCatalog(true)} className="neu-btn h-8 px-2.5 flex items-center gap-1.5 text-xs" title="Aus Archiv">
              <Database className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent)' }} />
              Archiv
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="neu-btn h-8 w-8 flex items-center justify-center">
            <Plus className="h-4 w-4" style={{ color: 'var(--neu-accent)' }} />
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Equipment-Name" className="neu-input flex-1 text-sm" />
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Kategorie" className="neu-input w-32 text-sm" />
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Anz." className="neu-input w-16 text-sm text-center" />
          <button onClick={handleAdd} disabled={isAdding} className="neu-btn-primary px-4 py-2 text-sm disabled:opacity-50">+</button>
        </div>
      )}

      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-2 neu-pressed group">
            {showStatusToggle && (
              <button onClick={() => cycleStatus(item)} className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ color: statusColor(item.status), border: `1px solid ${statusColor(item.status)}` }}>
                {EQUIPMENT_STATUS_LABELS[item.status]}
              </button>
            )}

            {/* Catalog/Package indicator */}
            {item.package_id && <span title="Paket"><Package className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--neu-accent-mid)' }} /></span>}
            {item.catalog_item_id && !item.package_id && <span title="Aus Archiv"><Database className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--neu-accent-mid)' }} /></span>}

            <span className="flex-1 text-sm truncate" style={{ color: 'var(--neu-text)' }}>
              {item.quantity > 1 && <span className="font-bold">{item.quantity}x </span>}
              {item.name}
            </span>
            {item.category && <span className="text-xs hidden sm:inline" style={{ color: 'var(--neu-accent-mid)' }}>{item.category}</span>}

            {/* Days & rate */}
            {item.day_rate != null && (
              <div className="flex items-center gap-1.5 shrink-0">
                {editingDays === item.id ? (
                  <input
                    type="number" min="1" defaultValue={item.days_count}
                    className="w-12 text-xs text-center py-0.5"
                    autoFocus
                    onBlur={e => handleDaysSave(item, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleDaysSave(item, (e.target as HTMLInputElement).value); }}
                  />
                ) : (
                  <button onClick={() => setEditingDays(item.id)}
                    className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--neu-text-secondary)', background: 'var(--neu-surface)' }}>
                    {item.days_count}T
                  </button>
                )}
                <span className="text-xs font-semibold" style={{ color: 'var(--neu-text)' }}>
                  {(item.day_rate * item.days_count).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            )}

            {!showStatusToggle && (
              <span className="text-xs font-medium" style={{ color: statusColor(item.status) }}>{EQUIPMENT_STATUS_LABELS[item.status]}</span>
            )}
            <button onClick={async () => { await deleteEquipment(item.id, projectId); router.refresh(); }} className="opacity-0 group-hover:opacity-100 p-1 transition-opacity">
              <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
            </button>
          </div>
        ))}
        {items.length === 0 && !showForm && (
          <p className="text-sm" style={{ color: 'var(--neu-accent-mid)' }}>Kein Equipment eingetragen</p>
        )}
      </div>

      {/* Kalkulations-Summe */}
      {calcItems.length > 0 && (
        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--neu-border-subtle)' }}>
          <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
            Equipment-Kosten ({calcItems.length} {calcItems.length === 1 ? 'Position' : 'Positionen'})
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
            {totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      )}

      {showCatalog && (
        <CatalogPicker
          projectId={projectId}
          items={catalogItems}
          packages={catalogPackages}
          onClose={() => { setShowCatalog(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
