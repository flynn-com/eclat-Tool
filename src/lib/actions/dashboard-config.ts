'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function revalidate() {
  revalidatePath('/dashboard');
}

export async function addWidget(widgetKey: string, colSpan: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  // Place at the end
  const { data: existing } = await supabase
    .from('user_dashboard_config')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const nextPos = existing ? existing.position + 1 : 0;

  const { error } = await supabase.from('user_dashboard_config').upsert(
    { user_id: user.id, widget_key: widgetKey, col_span: colSpan, position: nextPos },
    { onConflict: 'user_id,widget_key' }
  );
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function removeWidget(widgetKey: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const { error } = await supabase
    .from('user_dashboard_config')
    .delete()
    .eq('user_id', user.id)
    .eq('widget_key', widgetKey);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function reorderWidgets(orderedKeys: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const updates = orderedKeys.map((widget_key, position) => ({
    user_id: user.id,
    widget_key,
    position,
  }));

  const { error } = await supabase
    .from('user_dashboard_config')
    .upsert(updates, { onConflict: 'user_id,widget_key' });
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function resizeWidget(widgetKey: string, colSpan: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const { error } = await supabase
    .from('user_dashboard_config')
    .update({ col_span: colSpan })
    .eq('user_id', user.id)
    .eq('widget_key', widgetKey);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

/** Wechselt ein Widget zur anderen Variante (gleiche Position, neuer key + col_span) */
export async function switchWidgetVariant(oldKey: string, newKey: string, newColSpan: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  // Aktuelle Position holen
  const { data: current } = await supabase
    .from('user_dashboard_config')
    .select('position')
    .eq('user_id', user.id)
    .eq('widget_key', oldKey)
    .single();

  if (!current) return { error: 'Widget nicht gefunden' };

  // Alten Eintrag löschen, neuen einfügen
  await supabase.from('user_dashboard_config').delete().eq('user_id', user.id).eq('widget_key', oldKey);

  const { error } = await supabase.from('user_dashboard_config').insert({
    user_id: user.id,
    widget_key: newKey,
    col_span: newColSpan,
    position: current.position,
  });
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function initDefaultWidgets(
  defaults: { widget_key: string; col_span: number; position: number }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const rows = defaults.map(d => ({ ...d, user_id: user.id }));
  const { error } = await supabase
    .from('user_dashboard_config')
    .upsert(rows, { onConflict: 'user_id,widget_key' });
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}
