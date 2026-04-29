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

interface MobileNavProps {
  role: AppRole | null;
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const filteredItems = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3">
      <div
        className="neu-raised h-16 flex items-center"
        style={{ overflow: 'hidden' }}
      >
        {/* Scrollable icon row */}
        <div
          className="mobile-nav-scroll flex items-center h-full"
          style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            paddingLeft: '4px',
            paddingRight: '4px',
          }}
        >
          {filteredItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 py-1 shrink-0"
                style={{
                  width: '72px',
                  scrollSnapAlign: 'start',
                  color: isActive ? 'var(--neu-accent)' : 'var(--neu-accent-mid)',
                }}
              >
                {Icon && <Icon className="h-5 w-5" />}
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? 'var(--neu-accent)' : 'var(--neu-accent-mid)' }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
