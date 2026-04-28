'use client';

import { useEffect } from 'react';

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ProtectedError]', error);
  }, [error]);

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--neu-bg)' }}
    >
      <div className="text-center p-8 neu-raised max-w-md">
        <h2
          className="text-lg font-bold mb-2"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}
        >
          Fehler in dieser Ansicht
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--neu-text-secondary)' }}>
          {error.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
          {error.digest && (
            <span className="block mt-1 text-xs opacity-60">Code: {error.digest}</span>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="neu-btn-primary px-5 py-2 text-sm"
          >
            Erneut versuchen
          </button>
          <a
            href="/dashboard"
            className="neu-btn px-5 py-2 text-sm"
            style={{ color: 'var(--neu-accent)' }}
          >
            Zum Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
