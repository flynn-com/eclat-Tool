'use client';

import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { Topbar } from './topbar';
import { AppRole } from '@/lib/types';

interface AppShellProps {
  role: AppRole | null;
  children: React.ReactNode;
}

export function AppShell({ role, children }: AppShellProps) {
  return (
    <div className="h-full" style={{ background: 'var(--neu-bg)' }}>
      <Sidebar role={role} />
      <div className="md:pl-20 flex flex-col h-full">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
          <div className="mx-auto" style={{ maxWidth: '1500px' }}>
            {children}
          </div>
        </main>
      </div>
      <MobileNav role={role} />
    </div>
  );
}
