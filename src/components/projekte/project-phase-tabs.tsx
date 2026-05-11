'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Clapperboard, Film, CheckCircle2 } from 'lucide-react';

const TABS = [
  { href: 'vorplanung', label: 'Vorplanung', icon: FileText },
  { href: 'produktion', label: 'Produktion', icon: Clapperboard },
  { href: 'postproduktion', label: 'Post-Produktion', icon: Film },
];

export function ProjectPhaseTabs({ projectId, phase }: { projectId: string; phase: string }) {
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
      {phase === 'abgeschlossen' && (
        <Link
          href={`/projekte/${projectId}/abschluss`}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === `/projekte/${projectId}/abschluss` ? 'neu-pressed' : 'neu-raised-sm'
          }`}
          style={{
            color:
              pathname === `/projekte/${projectId}/abschluss`
                ? 'var(--neu-accent)'
                : 'var(--neu-accent-mid)',
          }}
        >
          <CheckCircle2 className="h-4 w-4" />
          Abschluss
        </Link>
      )}
    </div>
  );
}
