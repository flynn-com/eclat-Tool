'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createProjectExpense(data: {
  project_id: string;
  bezeichnung: string;
  betrag: number;
  kategorie: string | null;
  datum: string;
  rechnung_url: string | null;
  rechnung_name: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };
  const { error } = await supabase.from('project_expenses').insert({ ...data, created_by: user.id });
  if (error) return { error: error.message };
  revalidatePath('/finanzen/projektausgaben');
  revalidatePath('/finanzen');
  revalidatePath(`/projekte/${data.project_id}/abschluss`);
  return { error: null };
}

export async function deleteProjectExpense(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_expenses').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/finanzen/projektausgaben');
  revalidatePath('/finanzen');
  revalidatePath(`/projekte/${projectId}/abschluss`);
  return { error: null };
}
