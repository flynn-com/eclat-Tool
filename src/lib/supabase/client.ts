import { createBrowserClient } from '@supabase/ssr';

// createBrowserClient is already a singleton in @supabase/ssr — this function
// returns the cached client after the first call.
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase Umgebungsvariablen fehlen!\n' +
      'NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
      'muessen in den Vercel Project Settings → Environment Variables gesetzt sein.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
