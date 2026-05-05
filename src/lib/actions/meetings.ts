'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function revalidate(meetingId?: string) {
  revalidatePath('/meetings');
  if (meetingId) revalidatePath(`/meetings/${meetingId}`);
  revalidatePath('/aufgaben');
  revalidatePath('/dashboard');
}

// ========== Meetings ==========

export async function createMeeting(name: string, date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet', id: null };

  const { data, error } = await supabase
    .from('meetings')
    .insert({
      name: name?.trim() || 'Weekly Meeting',
      date: date || new Date().toISOString().split('T')[0],
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return { error: error.message, id: null };
  revalidate(data.id);
  return { error: null, id: data.id };
}

export async function deleteMeeting(meetingId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('meetings').delete().eq('id', meetingId);
  if (error) return { error: error.message };
  revalidate();
  return { error: null };
}

export async function updateMeetingName(meetingId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('meetings').update({ name }).eq('id', meetingId);
  if (error) return { error: error.message };
  revalidate(meetingId);
  return { error: null };
}

export async function updateMeetingDate(meetingId: string, date: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('meetings').update({ date }).eq('id', meetingId);
  if (error) return { error: error.message };
  revalidate(meetingId);
  return { error: null };
}

export async function updateSharedNotes(meetingId: string, content: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('meetings').update({ shared_notes: content }).eq('id', meetingId);
  if (error) return { error: error.message };
  return { error: null };
}

// ========== Meeting Tasks ==========

export async function addMeetingTask(meetingId: string, title: string, assigneeId?: string | null, dueDate?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const { error } = await supabase.from('meeting_tasks').insert({
    meeting_id: meetingId,
    title,
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidate(meetingId);
  return { error: null };
}

export async function updateMeetingTaskStatus(taskId: string, status: string, meetingId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('meeting_tasks').update({ status }).eq('id', taskId);
  if (error) return { error: error.message };
  revalidate(meetingId);
  return { error: null };
}

export async function updateMeetingTaskAssignee(taskId: string, assigneeId: string | null, meetingId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('meeting_tasks').update({ assignee_id: assigneeId }).eq('id', taskId);
  if (error) return { error: error.message };
  revalidate(meetingId);
  return { error: null };
}

export async function deleteMeetingTask(taskId: string, meetingId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('meeting_tasks').delete().eq('id', taskId);
  if (error) return { error: error.message };
  revalidate(meetingId);
  return { error: null };
}

// ========== Meeting Agenda ==========

export async function addAgendaItem(meetingId: string, title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const { error } = await supabase.from('meeting_agenda').insert({
    meeting_id: meetingId,
    title,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidate(meetingId);
  return { error: null };
}

export async function toggleAgendaItem(itemId: string, isChecked: boolean, meetingId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('meeting_agenda').update({ is_checked: isChecked }).eq('id', itemId);
  if (error) return { error: error.message };
  revalidate(meetingId);
  return { error: null };
}

export async function updateAgendaItem(itemId: string, title: string, meetingId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('meeting_agenda').update({ title: title.trim() }).eq('id', itemId);
  if (error) return { error: error.message };
  revalidate(meetingId);
  return { error: null };
}

export async function deleteAgendaItem(itemId: string, meetingId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('meeting_agenda').delete().eq('id', itemId);
  if (error) return { error: error.message };
  revalidate(meetingId);
  return { error: null };
}
