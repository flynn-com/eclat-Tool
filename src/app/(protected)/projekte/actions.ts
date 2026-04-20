'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht angemeldet');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error('Keine Berechtigung');

  const name = formData.get('name') as string;
  if (!name?.trim()) throw new Error('Projektname ist erforderlich');

  const { error } = await supabase.from('projects').insert({
    name: name.trim(),
    description: (formData.get('description') as string) || null,
    color: (formData.get('color') as string) || '#3B82F6',
    client_name: (formData.get('client_name') as string) || null,
    campaign_type: (formData.get('campaign_type') as string) || null,
    budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : null,
    deadline: (formData.get('deadline') as string) || null,
    created_by: user.id,
  });

  if (error) throw new Error('Projekt konnte nicht erstellt werden');

  revalidatePath('/projekte');
  revalidatePath('/zeiterfassung');
  revalidatePath('/dashboard');
}
