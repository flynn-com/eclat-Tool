'use client';

import { useState } from 'react';
import { Archive, Package } from 'lucide-react';

interface Props {
  archivContent: React.ReactNode;
  paketeContent: React.ReactNode;
}

export function EquipmentTabs({ archivContent, paketeContent }: Props) {
  const [tab, setTab] = useState<'archiv' | 'pakete'>('archiv');

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--neu-surface)', border: '1px solid var(--neu-border)' }}>
        {([
          { key: 'archiv', label: 'Archiv', icon: <Archive className="h-4 w-4" /> },
          { key: 'pakete', label: 'Pakete', icon: <Package className="h-4 w-4" /> },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? 'var(--neu-bg)' : 'transparent',
              color: tab === t.key ? 'var(--neu-text)' : 'var(--neu-accent-mid)',
              border: tab === t.key ? '1px solid var(--neu-border)' : '1px solid transparent',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'archiv' && archivContent}
      {tab === 'pakete' && paketeContent}
    </div>
  );
}
