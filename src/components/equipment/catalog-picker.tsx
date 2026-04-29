'use client';

import { useState, useTransition } from 'react';
import { X, Search, Package, Wrench } from 'lucide-react';
import { EquipmentItem, EquipmentPackage, EquipmentCategory } from '@/lib/types';
import { addEquipmentFromCatalog, addPackageFromCatalog } from '@/lib/actions/equipment-archive';

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  kamera: 'Kamera', objektiv: 'Objektiv', licht: 'Licht', ton: 'Ton',
  stativ: 'Stativ', speicher: 'Speicher', zubehoer: 'Zubehör', sonstiges: 'Sonstiges',
};

interface Props {
  projectId: string;
  items: EquipmentItem[];
  packages: EquipmentPackage[];
  onClose: () => void;
}

export function CatalogPicker({ projectId, items, packages, onClose }: Props) {
  const [tab, setTab] = useState<'items' | 'pakete'>('items');
  const [search, setSearch] = useState('');
  const [days, setDays] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState<string | null>(null);

  const activeItems = items.filter(i => i.status === 'active');

  const filteredItems = activeItems.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    CATEGORY_LABELS[i.category].toLowerCase().includes(search.toLowerCase())
  );

  const filteredPackages = packages.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function getDays(id: string) {
    return parseInt(days[id] ?? '1') || 1;
  }

  function addItem(item: EquipmentItem) {
    if (!item.day_rate) return;
    setAdding(item.id);
    startTransition(async () => {
      await addEquipmentFromCatalog(
        projectId, item.id, item.day_rate!, getDays(item.id),
        item.name, item.category
      );
      setAdding(null);
      onClose();
    });
  }

  function addPackage(pkg: EquipmentPackage) {
    const pkgItems = pkg.equipment_package_items ?? [];
    const autoSum = pkgItems.reduce((sum, pi) => {
      const item = items.find(i => i.id === pi.item_id);
      return sum + (item?.day_rate ?? 0) * pi.quantity;
    }, 0);
    const rate = pkg.day_rate ?? autoSum;
    if (!rate) return;
    setAdding(pkg.id);
    startTransition(async () => {
      await addPackageFromCatalog(projectId, pkg.id, rate, getDays(pkg.id), pkg.name);
      setAdding(null);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col max-h-[85vh]"
        style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--neu-border)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--neu-text)' }}>Aus Archiv hinzufügen</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--neu-accent-mid)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs + Search */}
        <div className="px-5 pt-4 shrink-0 space-y-3">
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--neu-bg)', border: '1px solid var(--neu-border)' }}>
            <button onClick={() => setTab('items')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: tab === 'items' ? 'var(--neu-surface)' : 'transparent',
                color: tab === 'items' ? 'var(--neu-text)' : 'var(--neu-accent-mid)',
                border: tab === 'items' ? '1px solid var(--neu-border)' : '1px solid transparent',
              }}>
              <Wrench className="h-3.5 w-3.5" />
              Geräte ({activeItems.length})
            </button>
            <button onClick={() => setTab('pakete')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: tab === 'pakete' ? 'var(--neu-surface)' : 'transparent',
                color: tab === 'pakete' ? 'var(--neu-text)' : 'var(--neu-accent-mid)',
                border: tab === 'pakete' ? '1px solid var(--neu-border)' : '1px solid transparent',
              }}>
              <Package className="h-3.5 w-3.5" />
              Pakete ({packages.length})
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Suchen…" className="w-full text-sm pl-8" />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-1">
          {tab === 'items' && filteredItems.map(item => {
            const hasRate = item.day_rate != null;
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--neu-bg)', border: '1px solid var(--neu-border-subtle)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--neu-text)' }}>{item.name}</p>
                  <p className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
                    {CATEGORY_LABELS[item.category]}
                    {hasRate && ` · ${item.day_rate!.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Tag`}
                    {!hasRate && ' · keine Tagesrate'}
                  </p>
                </div>
                {hasRate && (
                  <>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>Tage:</span>
                      <input type="number" min="1" value={days[item.id] ?? '1'}
                        onChange={e => setDays(d => ({ ...d, [item.id]: e.target.value }))}
                        className="w-14 text-sm text-center" />
                    </div>
                    <button
                      onClick={() => addItem(item)}
                      disabled={isPending && adding === item.id}
                      className="neu-btn-primary px-3 py-1.5 text-xs shrink-0 disabled:opacity-40"
                    >
                      {adding === item.id ? '…' : `${(item.day_rate! * getDays(item.id)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`}
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {tab === 'pakete' && filteredPackages.map(pkg => {
            const pkgItems = pkg.equipment_package_items ?? [];
            const autoSum = pkgItems.reduce((sum, pi) => {
              const item = items.find(i => i.id === pi.item_id);
              return sum + (item?.day_rate ?? 0) * pi.quantity;
            }, 0);
            const rate = pkg.day_rate ?? autoSum;
            const hasRate = rate > 0;

            return (
              <div key={pkg.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--neu-bg)', border: '1px solid var(--neu-border-subtle)' }}>
                <Package className="h-4 w-4 shrink-0" style={{ color: 'var(--neu-accent-mid)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--neu-text)' }}>{pkg.name}</p>
                  <p className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>
                    {pkgItems.length} Items
                    {hasRate && ` · ${rate.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Tag`}
                    {!hasRate && ' · keine Rate'}
                  </p>
                </div>
                {hasRate && (
                  <>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs" style={{ color: 'var(--neu-accent-mid)' }}>Tage:</span>
                      <input type="number" min="1" value={days[pkg.id] ?? '1'}
                        onChange={e => setDays(d => ({ ...d, [pkg.id]: e.target.value }))}
                        className="w-14 text-sm text-center" />
                    </div>
                    <button
                      onClick={() => addPackage(pkg)}
                      disabled={isPending && adding === pkg.id}
                      className="neu-btn-primary px-3 py-1.5 text-xs shrink-0 disabled:opacity-40"
                    >
                      {adding === pkg.id ? '…' : `${(rate * getDays(pkg.id)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`}
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {tab === 'items' && filteredItems.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--neu-accent-mid)' }}>Keine Geräte gefunden</p>
          )}
          {tab === 'pakete' && filteredPackages.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--neu-accent-mid)' }}>Keine Pakete gefunden</p>
          )}
        </div>
      </div>
    </div>
  );
}
