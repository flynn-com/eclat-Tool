'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createManuelleEinnahme(monat: string, bezeichnung: string, betrag: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('manuelle_einnahmen').insert({
    monat,
    bezeichnung: bezeichnung.trim(),
    betrag,
  });
  if (error) return { error: error.message };
  revalidatePath('/finanzen/jahresziele');
  revalidatePath('/finanzen');
  revalidatePath('/dashboard');
  return { error: null };
}

export async function deleteManuelleEinnahme(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('manuelle_einnahmen').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/finanzen/jahresziele');
  revalidatePath('/finanzen');
  revalidatePath('/dashboard');
  return { error: null };
}
