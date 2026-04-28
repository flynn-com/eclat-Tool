import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { ADMIN_ONLY_ROUTES } from '@/lib/constants';

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (pathname === '/login' || pathname === '/diagnose' || pathname.startsWith('/auth/')) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Admin-only routes: check role from user metadata or let the page handle it
  // (removed DB query here — each admin page checks role server-side)

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
