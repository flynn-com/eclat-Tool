'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html>
      <body style={{ background: '#EFF2F9', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: '#1E2A38', marginBottom: '0.5rem' }}>Etwas ist schiefgelaufen</h2>
          <p style={{ color: '#6E7F8D', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{ padding: '0.5rem 1.25rem', background: '#6E7F8D', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
              Erneut versuchen
            </button>
            <a
              href="/login"
              style={{ padding: '0.5rem 1.25rem', background: '#EFF2F9', color: '#6E7F8D', border: '1px solid #d1d5db', borderRadius: '0.5rem', textDecoration: 'none' }}
            >
              Zum Login
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
