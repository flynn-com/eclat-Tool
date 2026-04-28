'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';
import { AppRole } from '@/lib/types';
import {
  LayoutDashboard,
  Clock,
  Calculator,
  FolderKanban,
  Users,
  Wrench,
  Settings,
  CheckSquare,
  MessageSquare,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Clock,
  Calculator,
  FolderKanban,
  Users,
  Wrench,
  Settings,
  CheckSquare,
  MessageSquare,
};

interface SidebarProps {
  role: AppRole | null;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const filteredItems = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <aside className="hidden md:flex md:flex-col md:w-20 md:fixed md:inset-y-0 items-center py-6" style={{ background: 'var(--neu-bg)' }}>
      {/* Logo */}
      <div className="neu-raised-sm h-12 w-12 flex items-center justify-center mb-8" style={{ background: 'var(--neu-accent)' }}>
        <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>F</span>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col items-center gap-4 flex-1">
        {filteredItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all ${
                isActive
                  ? 'neu-pressed'
                  : 'neu-raised-sm hover:opacity-80'
              }`}
            >
              {Icon && (
                <div style={{ color: isActive ? 'var(--neu-accent)' : 'var(--neu-accent-mid)' }}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
