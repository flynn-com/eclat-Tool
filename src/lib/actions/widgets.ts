'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function pinWidget(widgetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const { error } = await supabase.from('user_widgets').upsert(
    { user_id: user.id, widget_id: widgetId },
    { onConflict: 'user_id,widget_id' }
  );
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/finanzen');
  return { error: null };
}

export async function unpinWidget(widgetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const { error } = await supabase.from('user_widgets')
    .delete()
    .eq('user_id', user.id)
    .eq('widget_id', widgetId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/finanzen');
  return { error: null };
}
