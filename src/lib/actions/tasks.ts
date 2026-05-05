'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function revalidate() {
  revalidatePath('/dashboard');
  revalidatePath('/aufgaben');
}

export async function createGeneralTask(title: string, assigneeIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({ title: title.trim(), created_by: user.id })
    .select('id')
    .single();

  if (error || !task) return { error: error?.message ?? 'Fehler beim Erstellen' };

  if (assigneeIds.length > 0) {
    await supabase.from('task_assignees').insert(
      assigneeIds.map(uid => ({ task_id: task.id, user_id: uid }))
    );
  }

  revalidate();
  return { error: null };
}

export async function toggleMeetingTask(taskId: string, currentStatus: string) {
  const supabase = await createClient();
  const next = currentStatus === 'erledigt' ? 'offen' : 'erledigt';
  await supabase.from('meeting_tasks').update({ status: next }).eq('id', taskId);
  revalidate();
}

export async function toggleProjectTask(taskId: string, currentStatus: string) {
  const supabase = await createClient();
  const next = currentStatus === 'erledigt' ? 'offen' : 'erledigt';
  await supabase.from('project_tasks').update({ status: next }).eq('id', taskId);
  revalidate();
}

export async function toggleGeneralTask(taskId: string, currentStatus: string) {
  const supabase = await createClient();
  const next = currentStatus === 'erledigt' ? 'offen' : 'erledigt';
  await supabase.from('tasks').update({ status: next }).eq('id', taskId);
  revalidate();
}
