import { createClient } from '@/lib/supabase/server';
import { EquipmentItem, EquipmentPackage, EquipmentOwner } from '@/lib/types';
import { ArchivSection } from '@/components/equipment/archiv-section';
import { PaketeSection } from '@/components/equipment/pakete-section';
import { EquipmentTabs } from '@/components/equipment/equipment-tabs';

export default async function EquipmentPage() {
  const supabase = await createClient();

  const [
    { data: itemsRaw },
    { data: packagesRaw },
    { data: ownersRaw },
  ] = await Promise.all([
    supabase.from('equipment_items')
      .select('*, equipment_owners:eq_owner_id(id, name, notes, created_at)')
      .order('category')
      .order('name'),
    supabase.from('equipment_packages')
      .select('*, equipment_package_items(id, item_id, quantity, equipment_items(*))')
      .order('name'),
    supabase.from('equipment_owners').select('*').order('name'),
  ]);

  const items = (itemsRaw ?? []) as EquipmentItem[];
  const packages = (packagesRaw ?? []) as EquipmentPackage[];
  const owners = (ownersRaw ?? []) as EquipmentOwner[];

  const activeCount = items.filter(i => i.status === 'active').length;

  const totalValue = items
    .filter(i => i.status === 'active' && i.current_value != null)
    .reduce((sum, i) => sum + (i.current_value ?? 0), 0);

  const annualDep = items
    .filter(i => i.status === 'active' && i.purchase_price && i.depreciation_years)
    .reduce((sum, i) => sum + (i.purchase_price! / i.depreciation_years!), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>
          Equipment
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
          Archiv, Pakete & Kalkulation
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Aktive Geräte" value={String(activeCount)} />
        <StatCard label="Pakete" value={String(packages.length)} />
        <StatCard
          label="Gesamtwert"
          value={totalValue > 0 ? totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '—'}
        />
        <StatCard
          label="Abschreibung/J."
          value={annualDep > 0 ? annualDep.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '—'}
        />
      </div>

      <EquipmentTabs
        archivContent={<ArchivSection items={items} owners={owners} />}
        paketeContent={<PaketeSection packages={packages} allItems={items} />}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="neu-raised p-4">
      <p className="text-xs mb-1" style={{ color: 'var(--neu-text-secondary)' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>{value}</p>
    </div>
  );
}
