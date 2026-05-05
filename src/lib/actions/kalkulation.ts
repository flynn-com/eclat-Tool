'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function revalidate() {
  revalidatePath('/finanzen/leistungen');
  revalidatePath('/finanzen/projektkalkulation');
}

// ========== Leistungen ==========

export async function createLeistung(name: string, beschreibung: string, stundensatz: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('kalkulation_leistungen').insert({
    name: name.trim(),
    beschreibung: beschreibung.trim() || null,
    stundensatz,
  });
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function updateLeistung(id: string, name: string, beschreibung: string, stundensatz: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('kalkulation_leistungen')
    .update({ name: name.trim(), beschreibung: beschreibung.trim() || null, stundensatz })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function deleteLeistung(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('kalkulation_leistungen').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

// ========== Personas ==========

export async function createPersona(name: string, stundensatz: number, farbe?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('kalkulation_personas').insert({
    name: name.trim(),
    stundensatz,
    farbe: farbe ?? null,
  });
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function updatePersona(id: string, name: string, stundensatz: number, farbe?: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('kalkulation_personas')
    .update({ name: name.trim(), stundensatz, farbe: farbe ?? null })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function deletePersona(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('kalkulation_personas').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}
