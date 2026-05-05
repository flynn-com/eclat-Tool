'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function revalidate() {
  revalidatePath('/finanzen/pakete');
  revalidatePath('/finanzen/projektkalkulation');
}

// ========== Pakete ==========

export async function createPaket(name: string, beschreibung: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('kalkulation_pakete').insert({
    name: name.trim(),
    beschreibung: beschreibung.trim() || null,
  });
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function updatePaket(id: string, name: string, beschreibung: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('kalkulation_pakete')
    .update({ name: name.trim(), beschreibung: beschreibung.trim() || null })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function deletePaket(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('kalkulation_pakete').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

// ========== Positionen ==========

export async function createPosition(
  paketId: string,
  bezeichnung: string,
  stunden: number,
  sortOrder: number
) {
  const supabase = await createClient();
  const { error } = await supabase.from('kalkulation_paket_positionen').insert({
    paket_id: paketId,
    bezeichnung: bezeichnung.trim(),
    stunden,
    sort_order: sortOrder,
  });
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function updatePosition(id: string, bezeichnung: string, stunden: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('kalkulation_paket_positionen')
    .update({ bezeichnung: bezeichnung.trim(), stunden })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function deletePosition(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('kalkulation_paket_positionen')
    .delete()
    .eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}
