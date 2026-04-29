'use client';

import Link from 'next/link';
import Image from 'next/image';
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

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
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
    <aside className="hidden md:flex md:flex-col md:w-20 md:fixed md:inset-y-0 items-center py-6" style={{ background: 'var(--neu-bg)', borderRight: '1px solid var(--neu-border)' }}>
      {/* Logo */}
      <div className="flex items-center justify-center mb-8 h-12 w-12">
        <Image
          src="/logo-icon.png"
          alt="é"
          width={36}
          height={36}
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col items-center gap-3 flex-1">
        {filteredItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="h-11 w-11 flex items-center justify-center rounded-xl transition-all"
              style={{
                background: isActive ? 'var(--neu-surface)' : 'transparent',
                border: isActive ? '1px solid var(--neu-border)' : '1px solid transparent',
              }}
            >
              {Icon && (
                <Icon
                  className="h-5 w-5"
                  style={{ color: isActive ? '#ffffff' : 'var(--neu-accent-mid)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
