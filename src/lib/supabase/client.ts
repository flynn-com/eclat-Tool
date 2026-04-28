import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // This will be visible in the Vercel build log if env vars are missing
  throw new Error(
    'Supabase environment variables are missing.\n' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel project settings.'
  );
}

// createBrowserClient is already a singleton in @supabase/ssr — this function
// returns the cached client after the first call.
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseKey!);
}
