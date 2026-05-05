'use client';

import { useTransition } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { pinWidget, unpinWidget } from '@/lib/actions/widgets';

interface Props {
  widgetId: string;
  isPinned: boolean;
}

export function WidgetPinButton({ widgetId, isPinned }: Props) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (isPinned) await unpinWidget(widgetId);
      else await pinWidget(widgetId);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={isPinned ? 'Vom Dashboard entfernen' : 'Auf Dashboard pinnen'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
      style={{
        background: isPinned ? 'rgba(16,185,129,0.12)' : 'var(--neu-surface)',
        border: `1px solid ${isPinned ? 'rgba(16,185,129,0.3)' : 'var(--neu-border)'}`,
        color: isPinned ? '#10b981' : 'var(--neu-text-secondary)',
      }}
    >
      {isPinned
        ? <><PinOff className="h-3.5 w-3.5" /> Vom Dashboard entfernen</>
        : <><Pin className="h-3.5 w-3.5" /> Auf Dashboard pinnen</>
      }
    </button>
  );
}
