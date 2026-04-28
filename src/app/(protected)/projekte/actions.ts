'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nicht angemeldet');

  const name = formData.get('name') as string;
  if (!name?.trim()) throw new Error('Projektname ist erforderlich');

  const kundeId = (formData.get('kunde_id') as string) || null;

  // Falls Kunde gewaehlt, Firmenname als client_name uebernehmen
  let clientName = (formData.get('client_name') as string) || null;
  if (kundeId) {
    const { data: kunde } = await supabase.from('kunden').select('firma').eq('id', kundeId).maybeSingle();
    if (kunde) clientName = kunde.firma;
  }

  const { error } = await supabase.from('projects').insert({
    name: name.trim(),
    description: (formData.get('description') as string) || null,
    color: (formData.get('color') as string) || '#3B82F6',
    client_name: clientName,
    kunde_id: kundeId,
    campaign_type: (formData.get('campaign_type') as string) || null,
    budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : null,
    deadline: (formData.get('deadline') as string) || null,
    created_by: user.id,
  });

  if (error) throw new Error('Projekt konnte nicht erstellt werden: ' + error.message);

  revalidatePath('/projekte');
  revalidatePath('/zeiterfassung');
  revalidatePath('/dashboard');
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  if (!name?.trim()) return { error: 'Projektname ist erforderlich' };

  const { error } = await supabase.from('projects').update({
    name: name.trim(),
    description: (formData.get('description') as string) || null,
    color: (formData.get('color') as string) || '#3B82F6',
    client_name: (formData.get('client_name') as string) || null,
    campaign_type: (formData.get('campaign_type') as string) || null,
    budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : null,
    deadline: (formData.get('deadline') as string) || null,
  }).eq('id', projectId);

  if (error) return { error: error.message };
  revalidatePath('/projekte');
  revalidatePath(`/projekte/${projectId}`);
  return { error: null };
}

export async function archiveProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('projects').update({ status: 'archived' }).eq('id', projectId);
  if (error) return { error: error.message };
  revalidatePath('/projekte');
  return { error: null };
}

export async function unarchiveProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('projects').update({ status: 'active' }).eq('id', projectId);
  if (error) return { error: error.message };
  revalidatePath('/projekte');
  return { error: null };
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) return { error: error.message };
  revalidatePath('/projekte');
  revalidatePath('/dashboard');
  return { error: null };
}
