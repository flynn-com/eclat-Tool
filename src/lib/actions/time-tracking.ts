'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function startTimer(projectId: string | null, description: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  // Sanitize inputs - empty string to null
  const cleanProjectId = projectId && projectId.trim() !== '' ? projectId : null;
  const cleanDescription = description && description.trim() !== '' ? description : null;

  // Check no active timer
  const { data: active } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', user.id)
    .is('end_time', null)
    .limit(1);

  if (active && active.length > 0) {
    return { error: 'Es laeuft bereits ein Timer' };
  }

  const { error } = await supabase.from('time_entries').insert({
    user_id: user.id,
    project_id: cleanProjectId,
    description: cleanDescription,
    start_time: new Date().toISOString(),
    is_manual: false,
  });

  if (error) return { error: 'Timer konnte nicht gestartet werden: ' + error.message };

  revalidatePath('/zeiterfassung');
  revalidatePath('/dashboard');
  return { error: null };
}

export async function stopTimer(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const { data: entry, error: fetchError } = await supabase
    .from('time_entries')
    .select('start_time, user_id')
    .eq('id', entryId)
    .single();

  if (fetchError || !entry) return { error: 'Eintrag nicht gefunden: ' + (fetchError?.message ?? '') };
  if (entry.user_id !== user.id) return { error: 'Keine Berechtigung' };

  const endTime = new Date();
  const startTime = new Date(entry.start_time);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const { error } = await supabase
    .from('time_entries')
    .update({
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq('id', entryId);

  if (error) return { error: 'Timer konnte nicht gestoppt werden: ' + error.message };

  revalidatePath('/zeiterfassung');
  revalidatePath('/dashboard');
  return { error: null };
}

export async function createManualEntry(
  date: string,
  startTimeStr: string,
  endTimeStr: string,
  projectId: string | null,
  description: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  if (!date || !startTimeStr || !endTimeStr) {
    return { error: 'Datum, Start- und Endzeit sind erforderlich' };
  }

  // Sanitize inputs
  const cleanProjectId = projectId && projectId.trim() !== '' ? projectId : null;
  const cleanDescription = description && description.trim() !== '' ? description : null;

  const startTime = new Date(`${date}T${startTimeStr}:00`);
  const endTime = new Date(`${date}T${endTimeStr}:00`);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return { error: 'Ungueltiges Datum oder Zeitformat' };
  }

  if (endTime <= startTime) {
    return { error: 'Endzeit muss nach Startzeit liegen' };
  }

  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const { error } = await supabase.from('time_entries').insert({
    user_id: user.id,
    project_id: cleanProjectId,
    description: cleanDescription,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration_minutes: durationMinutes,
    is_manual: true,
  });

  if (error) return { error: 'Eintrag konnte nicht erstellt werden: ' + error.message };

  revalidatePath('/zeiterfassung');
  revalidatePath('/dashboard');
  return { error: null };
}

export async function deleteTimeEntry(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId);

  if (error) return { error: 'Eintrag konnte nicht geloescht werden: ' + error.message };

  revalidatePath('/zeiterfassung');
  revalidatePath('/dashboard');
  return { error: null };
}
