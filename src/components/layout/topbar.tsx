'use client';

import { useUser } from '@/hooks/use-user';
import { TimerBadge } from '@/components/zeiterfassung/timer-badge';
import { LogOut, AlertCircle } from 'lucide-react';

export function Topbar() {
  const { profile, role, signOut, error } = useUser();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 mx-3 mt-3 neu-raised-sm">
      <div className="md:hidden">
        <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-accent)' }}>
          Firmen-Tool
        </h1>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        {error && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#FEF2F2', color: '#EF4444' }}>
            <AlertCircle className="h-3.5 w-3.5" />
            Session-Fehler — wird neu geladen
          </div>
        )}
        <TimerBadge />
        {profile && (
          <>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{profile.full_name}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--neu-text-secondary)' }}>{role}</p>
            </div>
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'var(--neu-accent)' }}
            >
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          </>
        )}
        <button
          onClick={signOut}
          className="neu-btn h-9 w-9 flex items-center justify-center"
          title="Abmelden"
        >
          <LogOut className="h-4 w-4" style={{ color: 'var(--neu-accent)' }} />
        </button>
      </div>
    </header>
  );
}
