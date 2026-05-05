'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function uploadAvatar(userId: string, formData: FormData) {
  const supabase = await createClient();

  const file = formData.get('avatar') as File;
  if (!file || file.size === 0) return { error: 'Keine Datei ausgewählt' };

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  // Remove old avatar first (ignore errors)
  await supabase.storage.from('avatars').remove([path]);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  // Append cache-buster so Next.js Image picks up the new file
  const urlWithBust = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: urlWithBust })
    .eq('id', userId);

  if (updateError) return { error: updateError.message };

  revalidatePath('/einstellungen');
  return { error: null, url: urlWithBust };
}

export async function removeAvatar(userId: string) {
  const supabase = await createClient();

  // Try all common extensions
  await supabase.storage.from('avatars').remove([
    `${userId}/avatar.jpg`,
    `${userId}/avatar.jpeg`,
    `${userId}/avatar.png`,
    `${userId}/avatar.webp`,
    `${userId}/avatar.gif`,
  ]);

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);

  if (error) return { error: error.message };
  revalidatePath('/einstellungen');
  return { error: null };
}
