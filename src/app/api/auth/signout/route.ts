import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Redirect back to the login page on the same domain
  const url = new URL('/login', request.url);
  return NextResponse.redirect(url);
}
