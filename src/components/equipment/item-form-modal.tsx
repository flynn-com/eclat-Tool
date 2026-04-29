'use client';

import { useState, useTransition } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { EquipmentItem, EquipmentCategory, EquipmentOwner } from '@/lib/types';
import { createEquipmentItem, updateEquipmentItem, createEquipmentOwner, deleteEquipmentOwner } from '@/lib/actions/equipment-archive';

const CATEGORIES: { value: EquipmentCategory; label: string }[] = [
  { value: 'kamera',    label: 'Kamera' },
  { value: 'objektiv',  label: 'Objektiv' },
  { value: 'licht',     label: 'Licht' },
  { value: 'ton',       label: 'Ton / Audio' },
  { value: 'stativ',    label: 'Stativ / Stabilizer' },
  { value: 'speicher',  label: 'Speicher / Karten' },
  { value: 'zubehoer',  label: 'Zubehör' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

interface Props {
  item?: EquipmentItem;
  owners: EquipmentOwner[];
  onClose: () => void;
}

function numOrEmpty(v: number | null | undefined): string {
  return v != null ? String(v) : '';
}

// Inline Owner Manager: shown inside the form as a small panel
function OwnerManager({
  owners,
  selected,
  onSelect,
}: {
  owners: EquipmentOwner[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [isAdding, startAdd] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [localOwners, setLocalOwners] = useState<EquipmentOwner[]>(owners);

  function handleAdd() {
    if (!newName.trim()) return;
    startAdd(async () => {
      const result = await createEquipmentOwner(newName.trim());
      if (!result.error && result.owner) {
        setLocalOwners(prev => [...prev, result.owner!]);
        onSelect(result.owner!.id);
      }
      setNewName('');
      setShowAdd(false);
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Inhaber löschen?')) return;
    startDelete(async () => {
      await deleteEquipmentOwner(id);
      setLocalOwners(prev => prev.filter(o => o.id !== id));
      if (selected === id) onSelect('');
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={e => onSelect(e.target.value)}
          className="w-full text-sm flex-1"
        >
          <option value="">— kein Inhaber —</option>
          {localOwners.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="neu-btn h-9 w-9 flex items-center justify-center shrink-0"
          title="Neuen Inhaber hinzufügen"
        >
          <Plus className="h-4 w-4" style={{ color: 'var(--neu-accent)' }} />
        </button>
      </div>

      {/* Add new owner inline */}
      {showAdd && (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            placeholder="Name des Inhabers"
            className="flex-1 text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={isAdding || !newName.trim()}
            className="neu-btn-primary px-3 py-1.5 text-sm disabled:opacity-40"
          >
            {isAdding ? '…' : 'Hinzufügen'}
          </button>
          <button type="button" onClick={() => { setShowAdd(false); setNewName(''); }} className="neu-btn px-3 py-1.5 text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Owner list with delete */}
      {localOwners.length > 0 && (
        <div className="mt-2 space-y-1">
          {localOwners.map(o => (
            <div key={o.id} className="flex items-center gap-2 px-2 py-1 rounded-lg group"
              style={{ background: selected === o.id ? 'var(--neu-surface)' : 'transparent' }}>
              <span className="flex-1 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>{o.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(o.id)}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--neu-accent-mid)' }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ItemFormModal({ item, owners, onClose }: Props) {
  const isEdit = !!item;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<EquipmentCategory>(item?.category ?? 'sonstiges');
  const [description, setDescription] = useState(item?.description ?? '');
  const [eqOwnerId, setEqOwnerId] = useState(item?.eq_owner_id ?? '');
  const [serial, setSerial] = useState(item?.serial_number ?? '');
  const [purchasePrice, setPurchasePrice] = useState(numOrEmpty(item?.purchase_price));
  const [purchaseDate, setPurchaseDate] = useState(item?.purchase_date ?? '');
  const [depYears, setDepYears] = useState(numOrEmpty(item?.depreciation_years));
  const [currentValue, setCurrentValue] = useState(numOrEmpty(item?.current_value));
  const [warranty, setWarranty] = useState(item?.warranty_until ?? '');
  const [dayRate, setDayRate] = useState(numOrEmpty(item?.day_rate));
  const [hourRate, setHourRate] = useState(numOrEmpty(item?.hour_rate));
  const [notes, setNotes] = useState(item?.notes ?? '');

  const calcDepreciation = () => {
    const price = parseFloat(purchasePrice);
    const years = parseInt(depYears);
    if (!price || !years || !purchaseDate) return;
    const bought = new Date(purchaseDate);
    const now = new Date();
    const ageYears = (now.getTime() - bought.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const remaining = Math.max(0, price - (price / years) * ageYears);
    setCurrentValue(remaining.toFixed(2));
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    const data = {
      name,
      category,
      description: description || undefined,
      eq_owner_id: eqOwnerId || undefined,
      serial_number: serial || undefined,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
      purchase_date: purchaseDate || undefined,
      depreciation_years: depYears ? parseInt(depYears) : undefined,
      current_value: currentValue ? parseFloat(currentValue) : undefined,
      warranty_until: warranty || undefined,
      day_rate: dayRate ? parseFloat(dayRate) : undefined,
      hour_rate: hourRate ? parseFloat(hourRate) : undefined,
      notes: notes || undefined,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateEquipmentItem(item.id, data)
        : await createEquipmentItem(data);
      if (result.error) { setError(result.error); return; }
      onClose();
    });
  }

  const field = (label: string, children: React.ReactNode, hint?: string) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs mt-0.5" style={{ color: 'var(--neu-accent-mid)' }}>{hint}</p>}
    </div>
  );

  const inp = (value: string, onChange: (v: string) => void, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input value={value} onChange={e => onChange(e.target.value)} className="w-full text-sm" {...props} />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]"
        style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--neu-border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--neu-text)' }}>
            {isEdit ? 'Equipment bearbeiten' : 'Equipment hinzufügen'}
          </h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--neu-accent-mid)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-5">

            {/* Grunddaten */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--neu-accent-mid)' }}>Grunddaten</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field('Name *', inp(name, setName, { placeholder: 'z.B. Sony FX6', required: true }))}
                {field('Kategorie', (
                  <select value={category} onChange={e => setCategory(e.target.value as EquipmentCategory)} className="w-full text-sm">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                ))}
                <div className="sm:col-span-2">
                  {field('Beschreibung', (
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                      rows={2} className="w-full text-sm resize-none" placeholder="Kurze Beschreibung..." />
                  ))}
                </div>
                <div className="sm:col-span-2">
                  {field('Inhaber',
                    <OwnerManager owners={owners} selected={eqOwnerId} onSelect={setEqOwnerId} />,
                    'Wähle einen Inhaber oder füge einen neuen hinzu (+ Button)'
                  )}
                </div>
                {field('Seriennummer', inp(serial, setSerial, { placeholder: 'optional' }))}
              </div>
            </div>

            {/* Kalkulation */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--neu-accent-mid)' }}>Kalkulation</p>
              <div className="grid grid-cols-2 gap-3">
                {field('Tagesrate (€)', inp(dayRate, setDayRate, { type: 'number', min: '0', step: '0.01', placeholder: '0.00' }))}
                {field('Stundensatz (€)', inp(hourRate, setHourRate, { type: 'number', min: '0', step: '0.01', placeholder: '0.00' }))}
              </div>
            </div>

            {/* Finanzen / Abschreibung */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--neu-accent-mid)' }}>Finanzen & Abschreibung</p>
              <div className="grid grid-cols-2 gap-3">
                {field('Anschaffungspreis (€)', inp(purchasePrice, setPurchasePrice, { type: 'number', min: '0', step: '0.01', placeholder: '0.00' }))}
                {field('Anschaffungsdatum', inp(purchaseDate, setPurchaseDate, { type: 'date' }))}
                {field('Abschreibung (Jahre)', inp(depYears, setDepYears, { type: 'number', min: '1', step: '1', placeholder: 'z.B. 5' }))}
                {field('Aktueller Wert (€)',
                  <div className="flex gap-2">
                    {inp(currentValue, setCurrentValue, { type: 'number', min: '0', step: '0.01', placeholder: '0.00' })}
                    <button type="button" onClick={calcDepreciation}
                      className="neu-btn shrink-0 px-2 text-xs whitespace-nowrap">
                      Berechnen
                    </button>
                  </div>,
                  'Oder automatisch aus Anschaffungspreis + Datum berechnen'
                )}
                {field('Garantie bis', inp(warranty, setWarranty, { type: 'date' }))}
              </div>
            </div>

            {/* Notizen */}
            <div>
              {field('Notizen', (
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={3} className="w-full text-sm resize-none" placeholder="Interne Notizen..." />
              ))}
            </div>

            {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3 shrink-0">
            <button type="button" onClick={onClose} className="neu-btn flex-1 py-2.5 text-sm">Abbrechen</button>
            <button type="submit" disabled={isPending || !name.trim()} className="neu-btn-primary flex-1 py-2.5 text-sm disabled:opacity-40">
              {isPending ? 'Speichern…' : isEdit ? 'Speichern' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
