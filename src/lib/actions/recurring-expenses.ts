'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function revalidate() {
  revalidatePath('/finanzen');
  revalidatePath('/finanzen/monatsabrechnung');
}

export async function createRecurringExpense(name: string, betrag: number, kategorie: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('recurring_expenses').insert({
    name: name.trim(),
    betrag,
    kategorie: kategorie.trim() || null,
  });
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function updateRecurringExpense(id: string, data: { name?: string; betrag?: number; kategorie?: string; aktiv?: boolean }) {
  const supabase = await createClient();
  const { error } = await supabase.from('recurring_expenses').update(data).eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function deleteRecurringExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}
