'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Clapperboard, Film } from 'lucide-react';

const TABS = [
  { href: 'vorplanung', label: 'Vorplanung', icon: FileText },
  { href: 'produktion', label: 'Produktion', icon: Clapperboard },
  { href: 'postproduktion', label: 'Post-Produktion', icon: Film },
];

export function ProjectPhaseTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {TABS.map((tab) => {
        const fullHref = `/projekte/${projectId}/${tab.href}`;
        const isActive = pathname === fullHref;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={fullHref}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive ? 'neu-pressed' : 'neu-raised-sm'
            }`}
            style={{ color: isActive ? 'var(--neu-accent)' : 'var(--neu-accent-mid)' }}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
