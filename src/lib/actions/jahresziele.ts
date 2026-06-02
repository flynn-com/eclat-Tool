'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function upsertJahresziel(jahr: number, umsatzziel: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('jahresziele')
    .upsert({ jahr, umsatzziel, updated_at: new Date().toISOString() }, { onConflict: 'jahr' });
  if (error) return { error: error.message };
  revalidatePath('/finanzen/jahresziele');
  revalidatePath('/dashboard');
  return { error: null };
}
