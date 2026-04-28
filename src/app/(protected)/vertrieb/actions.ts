'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function revalidate(kundeId?: string) {
  revalidatePath('/vertrieb');
  revalidatePath('/vertrieb/kunden');
  if (kundeId) revalidatePath(`/vertrieb/kunden/${kundeId}`);
  revalidatePath('/projekte');
  revalidatePath('/projekte/neu');
}

export async function createKunde(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet', id: null };

  const firma = formData.get('firma') as string;
  if (!firma?.trim()) return { error: 'Firma ist erforderlich', id: null };

  const { data, error } = await supabase.from('kunden').insert({
    firma: firma.trim(),
    ansprechpartner: (formData.get('ansprechpartner') as string) || null,
    email: (formData.get('email') as string) || null,
    telefon: (formData.get('telefon') as string) || null,
    webseite: (formData.get('webseite') as string) || null,
    strasse: (formData.get('strasse') as string) || null,
    plz: (formData.get('plz') as string) || null,
    stadt: (formData.get('stadt') as string) || null,
    land: (formData.get('land') as string) || 'Deutschland',
    ust_id: (formData.get('ust_id') as string) || null,
    branche: (formData.get('branche') as string) || null,
    notizen: (formData.get('notizen') as string) || null,
    status: (formData.get('status') as string) || 'aktiv',
    created_by: user.id,
  }).select('id').single();

  if (error) return { error: error.message, id: null };
  revalidate(data.id);
  return { error: null, id: data.id };
}

export async function updateKunde(kundeId: string, formData: FormData) {
  const supabase = await createClient();
  const firma = formData.get('firma') as string;
  if (!firma?.trim()) return { error: 'Firma ist erforderlich' };

  const { error } = await supabase.from('kunden').update({
    firma: firma.trim(),
    ansprechpartner: (formData.get('ansprechpartner') as string) || null,
    email: (formData.get('email') as string) || null,
    telefon: (formData.get('telefon') as string) || null,
    webseite: (formData.get('webseite') as string) || null,
    strasse: (formData.get('strasse') as string) || null,
    plz: (formData.get('plz') as string) || null,
    stadt: (formData.get('stadt') as string) || null,
    land: (formData.get('land') as string) || 'Deutschland',
    ust_id: (formData.get('ust_id') as string) || null,
    branche: (formData.get('branche') as string) || null,
    notizen: (formData.get('notizen') as string) || null,
    status: (formData.get('status') as string) || 'aktiv',
  }).eq('id', kundeId);

  if (error) return { error: error.message };
  revalidate(kundeId);
  return { error: null };
}

export async function deleteKunde(kundeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('kunden').delete().eq('id', kundeId);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}
