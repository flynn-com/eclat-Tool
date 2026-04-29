'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ReportType, ReportStatus } from '@/lib/types';

export async function createReport(
  type: ReportType,
  title: string,
  description: string,
  pageUrl?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Nicht angemeldet' };

  const { error } = await supabase.from('reports').insert({
    type,
    title: title.trim(),
    description: description.trim(),
    page_url: pageUrl ?? null,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath('/einstellungen');
  return { error: null };
}

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', reportId);
  if (error) return { error: error.message };
  revalidatePath('/einstellungen');
  return { error: null };
}

export async function deleteReport(reportId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('reports').delete().eq('id', reportId);
  if (error) return { error: error.message };
  revalidatePath('/einstellungen');
  return { error: null };
}
