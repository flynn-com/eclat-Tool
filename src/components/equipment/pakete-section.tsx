'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, Package, ChevronDown, ChevronUp, X, Search } from 'lucide-react';
import { EquipmentItem, EquipmentPackage, EquipmentCategory } from '@/lib/types';
import { createEquipmentPackage, updateEquipmentPackage, deleteEquipmentPackage } from '@/lib/actions/equipment-archive';

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  kamera: 'Kamera', objektiv: 'Objektiv', licht: 'Licht', ton: 'Ton',
  stativ: 'Stativ', speicher: 'Speicher', zubehoer: 'Zubehör', sonstiges: 'Sonstiges',
};

interface PackageFormProps {
  pkg?: EquipmentPackage;
  allItems: EquipmentItem[];
  onClose: () => void;
}

function PackageForm({ pkg, allItems, onClose }: PackageFormProps) {
  const isEdit = !!pkg;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(pkg?.name ?? '');
  const [description, setDescription] = useState(pkg?.description ?? '');
  const [customRate, setCustomRate] = useState(pkg?.day_rate != null ? String(pkg.day_rate) : '');
  const [search, setSearch] = useState('');

  // Selected items: { id, quantity }[]
  const initialSelected = (pkg?.equipment_package_items ?? []).map(pi => ({
    id: pi.item_id,
    quantity: pi.quantity,
  }));
  const [selected, setSelected] = useState<{ id: string; quantity: number }[]>(initialSelected);

  const activeItems = allItems.filter(i => i.status === 'active');
  const filtered = activeItems.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    CATEGORY_LABELS[i.category].toLowerCase().includes(search.toLowerCase())
  );

  function toggleItem(itemId: string) {
    setSelected(prev => {
      const exists = prev.find(s => s.id === itemId);
      if (exists) return prev.filter(s => s.id !== itemId);
      return [...prev, { id: itemId, quantity: 1 }];
    });
  }

  function setQty(itemId: string, qty: number) {
    setSelected(prev => prev.map(s => s.id === itemId ? { ...s, quantity: Math.max(1, qty) } : s));
  }

  // Auto-sum of selected items day_rates
  const autoSum = selected.reduce((sum, s) => {
    const item = allItems.find(i => i.id === s.id);
    return sum + (item?.day_rate ?? 0) * s.quantity;
  }, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    const data = {
      name,
      description: description || undefined,
      day_rate: customRate ? parseFloat(customRate) : undefined,
      itemIds: selected,
    };
    startTransition(async () => {
      const result = isEdit
        ? await updateEquipmentPackage(pkg.id, data)
        : await createEquipmentPackage(data);
      if (result.error) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]"
        style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--neu-border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--neu-text)' }}>
            {isEdit ? 'Paket bearbeiten' : 'Neues Paket'}
          </h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--neu-accent-mid)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Kamera-Set komplett"
                  required className="w-full text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>
                  Custom Tagesrate (€)
                </label>
                <input type="number" min="0" step="0.01" value={customRate} onChange={e => setCustomRate(e.target.value)}
                  placeholder={autoSum > 0 ? `Auto: ${autoSum.toFixed(2)} €` : '0.00'}
                  className="w-full text-sm" />
                {autoSum > 0 && !customRate && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--neu-accent-mid)' }}>
                    Summe der Items: {autoSum.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Beschreibung</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="optional"
                  className="w-full text-sm" />
              </div>
            </div>

            {/* Item picker */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-accent-mid)' }}>
                Equipment auswählen ({selected.length} gewählt)
              </p>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Suchen…" className="w-full text-sm pl-8" />
              </div>
              <div className="space-y-1 max-h-52 overflow-y-auto rounded-xl" style={{ border: '1px solid var(--neu-border-subtle)' }}>
                {filtered.map(item => {
                  const sel = selected.find(s => s.id === item.id);
                  const isSelected = !!sel;
                  return (
                    <div key={item.id}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
                      style={{ background: isSelected ? 'var(--neu-surface)' : 'transparent' }}
                      onClick={() => toggleItem(item.id)}
                    >
                      <div className="h-4 w-4 rounded flex items-center justify-center shrink-0"
                        style={{ background: isSelected ? '#ffffff' : 'transparent', border: `1px solid ${isSelected ? '#ffffff' : 'var(--neu-border)'}` }}>
                        {isSelected && <span style={{ color: '#111112', fontSize: 10, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span className="flex-1 text-sm" style={{ color: 'var(--neu-text)' }}>{item.name}</span>
                      <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
                        {item.day_rate != null ? `${item.day_rate.toFixed(2)} €/Tag` : '—'}
                      </span>
                      {isSelected && (
                        <input type="number" min="1" value={sel.quantity}
                          onChange={e => { e.stopPropagation(); setQty(item.id, parseInt(e.target.value) || 1); }}
                          onClick={e => e.stopPropagation()}
                          className="w-14 text-sm text-center" />
                      )}
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="p-4 text-sm text-center" style={{ color: 'var(--neu-accent-mid)' }}>Keine Items gefunden</p>
                )}
              </div>
            </div>

            {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}
          </div>

          <div className="px-6 pb-6 flex gap-3 shrink-0">
            <button type="button" onClick={onClose} className="neu-btn flex-1 py-2.5 text-sm">Abbrechen</button>
            <button type="submit" disabled={isPending || !name.trim()} className="neu-btn-primary flex-1 py-2.5 text-sm disabled:opacity-40">
              {isPending ? 'Speichern…' : isEdit ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Props {
  packages: EquipmentPackage[];
  allItems: EquipmentItem[];
}

export function PaketeSection({ packages, allItems }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editPkg, setEditPkg] = useState<EquipmentPackage | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Paket "${name}" löschen?`)) return;
    startTransition(async () => { await deleteEquipmentPackage(id); });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
          {packages.length} {packages.length === 1 ? 'Paket' : 'Pakete'}
        </p>
        <button onClick={() => setShowForm(true)} className="neu-btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" />
          Neues Paket
        </button>
      </div>

      <div className="space-y-2">
        {packages.map(pkg => {
          const pkgItems = pkg.equipment_package_items ?? [];
          const autoSum = pkgItems.reduce((sum, pi) => {
            const item = allItems.find(i => i.id === pi.item_id);
            return sum + (item?.day_rate ?? 0) * pi.quantity;
          }, 0);
          const effectiveRate = pkg.day_rate ?? autoSum;
          const isExpanded = expanded === pkg.id;

          return (
            <div key={pkg.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--neu-border-subtle)' }}>
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" style={{ background: 'var(--neu-bg)' }}
                onClick={() => setExpanded(isExpanded ? null : pkg.id)}>
                <Package className="h-4 w-4 shrink-0" style={{ color: 'var(--neu-accent-mid)' }} />
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--neu-text)' }}>{pkg.name}</span>
                <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--neu-text)' }}>
                  {effectiveRate > 0 ? `${effectiveRate.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Tag` : '—'}
                </span>
                <span className="text-xs shrink-0" style={{ color: 'var(--neu-accent-mid)' }}>
                  {pkgItems.length} {pkgItems.length === 1 ? 'Item' : 'Items'}
                </span>
                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setEditPkg(pkg)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:opacity-70" style={{ color: 'var(--neu-accent-mid)' }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(pkg.id, pkg.name)} disabled={isPending} className="h-7 w-7 flex items-center justify-center rounded-lg hover:opacity-70" style={{ color: 'var(--neu-accent-mid)' }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: 'var(--neu-accent-mid)' }} /> : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--neu-accent-mid)' }} />}
              </div>

              {isExpanded && (
                <div className="px-4 pb-3 pt-2 space-y-1" style={{ background: 'var(--neu-bg)', borderTop: '1px solid var(--neu-border-subtle)' }}>
                  {pkg.description && <p className="text-xs mb-2" style={{ color: 'var(--neu-text-secondary)' }}>{pkg.description}</p>}
                  {pkgItems.map(pi => {
                    const item = allItems.find(i => i.id === pi.item_id);
                    if (!item) return null;
                    return (
                      <div key={pi.id} className="flex items-center gap-2">
                        <span className="text-sm flex-1" style={{ color: 'var(--neu-text)' }}>
                          {pi.quantity > 1 && <span className="font-bold">{pi.quantity}× </span>}
                          {item.name}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
                          {CATEGORY_LABELS[item.category]}
                        </span>
                        {item.day_rate != null && (
                          <span className="text-xs font-medium" style={{ color: 'var(--neu-text-secondary)' }}>
                            {(item.day_rate * pi.quantity).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Tag
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {pkg.day_rate != null && autoSum > 0 && (
                    <p className="text-xs pt-1" style={{ color: 'var(--neu-accent-mid)' }}>
                      Custom-Rate aktiv (Auto wäre {autoSum.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Tag)
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {packages.length === 0 && (
          <div className="py-12 text-center" style={{ color: 'var(--neu-accent-mid)' }}>
            <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Noch keine Pakete erstellt</p>
          </div>
        )}
      </div>

      {showForm && <PackageForm allItems={allItems} onClose={() => setShowForm(false)} />}
      {editPkg && <PackageForm pkg={editPkg} allItems={allItems} onClose={() => setEditPkg(null)} />}
    </div>
  );
}
