'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function revalidate(projectId: string) {
  revalidatePath('/projekte');
  revalidatePath(`/projekte/${projectId}`);
  revalidatePath('/dashboard');
}

// ========== Project Phase & Progress ==========

export async function updateProjectPhase(projectId: string, phase: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('projects').update({ phase }).eq('id', projectId);
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

export async function updateProjectProgress(projectId: string, progress: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('projects').update({ progress }).eq('id', projectId);
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

export async function updateProjectDetails(projectId: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.from('projects').update(data).eq('id', projectId);
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

// ========== Notes ==========

export async function addNote(projectId: string, category: string, content: string, title?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('project_notes').insert({
    project_id: projectId, category, content, title: title || null, created_by: user?.id,
  });
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

export async function deleteNote(noteId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_notes').delete().eq('id', noteId);
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

// ========== Tasks ==========

export async function addTask(projectId: string, phase: string, category: string, title: string, assigneeId?: string, dueDate?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('project_tasks').insert({
    project_id: projectId, phase, category, title,
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
    created_by: user?.id,
  });
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

export async function updateTaskStatus(taskId: string, status: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_tasks').update({ status }).eq('id', taskId);
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

// ========== Team ==========

export async function addTeamMember(projectId: string, role: string, userId?: string, externalName?: string, externalContact?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_team').insert({
    project_id: projectId, role,
    user_id: userId || null,
    external_name: externalName || null,
    external_contact: externalContact || null,
  });
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

export async function removeTeamMember(memberId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_team').delete().eq('id', memberId);
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

// ========== Equipment ==========

export async function addEquipment(projectId: string, name: string, category?: string, quantity?: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_equipment').insert({
    project_id: projectId, name, category: category || null, quantity: quantity || 1,
  });
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

export async function updateEquipmentStatus(itemId: string, status: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_equipment').update({ status }).eq('id', itemId);
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

export async function deleteEquipment(itemId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_equipment').delete().eq('id', itemId);
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

// ========== Schedule ==========

export async function addScheduleEntry(projectId: string, title: string, date: string, startTime?: string, endTime?: string, location?: string, description?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_schedule').insert({
    project_id: projectId, title, date,
    start_time: startTime || null, end_time: endTime || null,
    location: location || null, description: description || null,
  });
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}

export async function deleteScheduleEntry(entryId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('project_schedule').delete().eq('id', entryId);
  if (error) return { error: error.message };
  revalidate(projectId);
  return { error: null };
}
