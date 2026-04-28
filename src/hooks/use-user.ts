'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { User } from '@supabase/supabase-js';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Stable client ref — createBrowserClient is already a singleton but we
  // wrap it in useMemo to make the reference stable across renders.
  const supabase = useMemo(() => createClient(), []);
  // Prevent acting on stale effects after unmount
  const mounted = useRef(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (dbError) throw dbError;
      if (mounted.current) setProfile(data);
    } catch (err) {
      console.error('[useUser] fetchProfile failed:', err);
      // Profile fetch failure is non-fatal; keep user logged in
    }
  }, [supabase]);

  useEffect(() => {
    mounted.current = true;

    const init = async () => {
      try {
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (!mounted.current) return;

        if (authError) {
          // Auth error — session is broken, force re-login
          console.error('[useUser] getUser error:', authError.message);
          setError(authError.message);
          setIsLoading(false);
          window.location.href = '/api/auth/signout';
          return;
        }

        if (!currentUser) {
          // No session in browser — server might still have one.
          // Force signout to clear everything and redirect to login.
          console.warn('[useUser] No browser session found. Redirecting to signout.');
          setIsLoading(false);
          window.location.href = '/api/auth/signout';
          return;
        }

        setUser(currentUser);
        await fetchProfile(currentUser.id);
        if (mounted.current) setIsLoading(false);
      } catch (err) {
        console.error('[useUser] Unexpected error:', err);
        if (mounted.current) {
          setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
          setIsLoading(false);
        }
      }
    };

    init();

    // Listen for auth state changes (token refresh, logout from another tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          window.location.href = '/login';
          return;
        }

        const newUser = session?.user ?? null;
        if (newUser) {
          setUser(newUser);
          await fetchProfile(newUser.id);
        }
      }
    );

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount — supabase and fetchProfile are stable

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/login';
    }
  }, [supabase]);

  return { user, profile, role: profile?.role ?? null, isLoading, error, signOut };
}
