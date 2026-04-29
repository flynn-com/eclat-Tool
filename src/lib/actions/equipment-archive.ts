'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { EquipmentCategory } from '@/lib/types';

function revalidate() {
  revalidatePath('/equipment');
}

// ========== Equipment Items ==========

export async function createEquipmentItem(data: {
  name: string;
  category: EquipmentCategory;
  description?: string;
  eq_owner_id?: string;
  serial_number?: string;
  purchase_price?: number;
  purchase_date?: string;
  depreciation_years?: number;
  current_value?: number;
  warranty_until?: string;
  day_rate?: number;
  hour_rate?: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('equipment_items').insert({
    name: data.name.trim(),
    category: data.category,
    description: data.description?.trim() || null,
    eq_owner_id: data.eq_owner_id || null,
    serial_number: data.serial_number?.trim() || null,
    purchase_price: data.purchase_price ?? null,
    purchase_date: data.purchase_date || null,
    depreciation_years: data.depreciation_years ?? null,
    current_value: data.current_value ?? null,
    warranty_until: data.warranty_until || null,
    day_rate: data.day_rate ?? null,
    hour_rate: data.hour_rate ?? null,
    notes: data.notes?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function updateEquipmentItem(id: string, data: {
  name: string;
  category: EquipmentCategory;
  description?: string;
  eq_owner_id?: string;
  serial_number?: string;
  purchase_price?: number;
  purchase_date?: string;
  depreciation_years?: number;
  current_value?: number;
  warranty_until?: string;
  day_rate?: number;
  hour_rate?: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('equipment_items').update({
    name: data.name.trim(),
    category: data.category,
    description: data.description?.trim() || null,
    eq_owner_id: data.eq_owner_id || null,
    serial_number: data.serial_number?.trim() || null,
    purchase_price: data.purchase_price ?? null,
    purchase_date: data.purchase_date || null,
    depreciation_years: data.depreciation_years ?? null,
    current_value: data.current_value ?? null,
    warranty_until: data.warranty_until || null,
    day_rate: data.day_rate ?? null,
    hour_rate: data.hour_rate ?? null,
    notes: data.notes?.trim() || null,
  }).eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function archiveEquipmentItem(id: string, archived: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('equipment_items')
    .update({ status: archived ? 'archived' : 'active' })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function deleteEquipmentItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('equipment_items').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

// ========== Equipment Packages ==========

export async function createEquipmentPackage(data: {
  name: string;
  description?: string;
  day_rate?: number;
  itemIds: { id: string; quantity: number }[];
}) {
  const supabase = await createClient();
  const { data: pkg, error } = await supabase.from('equipment_packages').insert({
    name: data.name.trim(),
    description: data.description?.trim() || null,
    day_rate: data.day_rate ?? null,
  }).select('id').single();
  if (error) return { error: error.message };

  if (data.itemIds.length > 0) {
    const { error: itemsError } = await supabase.from('equipment_package_items').insert(
      data.itemIds.map(({ id, quantity }) => ({
        package_id: pkg.id,
        item_id: id,
        quantity,
      }))
    );
    if (itemsError) return { error: itemsError.message };
  }

  revalidate();
  return { error: null };
}

export async function updateEquipmentPackage(id: string, data: {
  name: string;
  description?: string;
  day_rate?: number;
  itemIds: { id: string; quantity: number }[];
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('equipment_packages').update({
    name: data.name.trim(),
    description: data.description?.trim() || null,
    day_rate: data.day_rate ?? null,
  }).eq('id', id);
  if (error) return { error: error.message };

  // Replace all items
  await supabase.from('equipment_package_items').delete().eq('package_id', id);
  if (data.itemIds.length > 0) {
    await supabase.from('equipment_package_items').insert(
      data.itemIds.map(({ id: itemId, quantity }) => ({
        package_id: id,
        item_id: itemId,
        quantity,
      }))
    );
  }

  revalidate();
  return { error: null };
}

export async function deleteEquipmentPackage(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('equipment_packages').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

// ========== Equipment Owners ==========

export async function createEquipmentOwner(name: string, notes?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('equipment_owners')
    .insert({ name: name.trim(), notes: notes?.trim() || null })
    .select('id, name, notes, created_at')
    .single();
  if (error) return { error: error.message, owner: null };
  revalidate();
  return { error: null, owner: data };
}

export async function deleteEquipmentOwner(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('equipment_owners').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

// ========== Project: Add from catalog ==========

export async function addEquipmentFromCatalog(
  projectId: string,
  catalogItemId: string,
  dayRate: number,
  daysCount: number,
  name: string,
  category: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_equipment').insert({
    project_id: projectId,
    name,
    category,
    quantity: 1,
    catalog_item_id: catalogItemId,
    day_rate: dayRate,
    days_count: daysCount,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projekte/${projectId}`);
  return { error: null };
}

export async function addPackageFromCatalog(
  projectId: string,
  packageId: string,
  dayRate: number,
  daysCount: number,
  name: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_equipment').insert({
    project_id: projectId,
    name,
    category: 'paket',
    quantity: 1,
    package_id: packageId,
    day_rate: dayRate,
    days_count: daysCount,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projekte/${projectId}`);
  return { error: null };
}

export async function updateProjectEquipmentDays(
  itemId: string,
  projectId: string,
  daysCount: number
) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_equipment')
    .update({ days_count: daysCount })
    .eq('id', itemId);
  if (error) return { error: error.message };
  revalidatePath(`/projekte/${projectId}`);
  return { error: null };
}
