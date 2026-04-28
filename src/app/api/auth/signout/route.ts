import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force sign-out: clears server-side session AND all auth cookies.
// Called when the browser client detects it has no session but the server
// still has one (they got out of sync, e.g. after cookie corruption or
// PKCE flow interruption).
export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  );

  // Belt-and-suspenders: delete all sb-* cookies explicitly
  const cookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
  ];
  cookieNames.forEach((name) => {
    response.cookies.set(name, '', { maxAge: 0, path: '/' });
  });

  return response;
}
