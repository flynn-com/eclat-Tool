// PUBLIC route — no auth required, for debugging only
// Visit: https://your-app.vercel.app/diagnose

import { createClient } from '@/lib/supabase/server';

async function runChecks() {
  const results: Array<{ label: string; ok: boolean; detail: string }> = [];

  // 1. Env vars
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  results.push({
    label: 'NEXT_PUBLIC_SUPABASE_URL',
    ok: hasUrl,
    detail: hasUrl
      ? process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/^(https:\/\/\w{6}).*/, '$1…')
      : 'FEHLT — in Vercel unter Settings → Environment Variables setzen',
  });
  results.push({
    label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ok: hasKey,
    detail: hasKey
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.slice(0, 20) + '…'
      : 'FEHLT — in Vercel unter Settings → Environment Variables setzen',
  });

  if (!hasUrl || !hasKey) {
    return results;
  }

  // 2. DB connection
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    results.push({
      label: 'Datenbankverbindung',
      ok: !error,
      detail: error ? `Fehler: ${error.message} (${error.code})` : 'Verbindung OK',
    });

    // 3. Auth session (server-side)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    results.push({
      label: 'Server-Auth-Session',
      ok: !!user && !authError,
      detail: authError
        ? `Auth-Fehler: ${authError.message}`
        : user
        ? `Eingeloggt als: ${user.email} (${user.id.slice(0, 8)}…)`
        : 'Nicht eingeloggt (keine Server-Session)',
    });
  } catch (err) {
    results.push({
      label: 'Datenbankverbindung',
      ok: false,
      detail: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  return results;
}

export default async function DiagnosePage() {
  const checks = await runChecks();
  const allOk = checks.every((c) => c.ok);

  return (
    <html>
      <body style={{ margin: 0, padding: '2rem', fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0', minHeight: '100vh' }}>
        <h1 style={{ color: '#38bdf8', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          🔍 Firmen-Tool — Diagnose
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '2rem' }}>
          Server-seitige Checks (diese Seite braucht keinen Login)
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '600px' }}>
          {checks.map((c, i) => (
            <div key={i} style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              background: c.ok ? '#052e16' : '#3b0764',
              border: `1px solid ${c.ok ? '#16a34a' : '#a21caf'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1rem' }}>{c.ok ? '✅' : '❌'}</span>
                <span style={{ fontWeight: 'bold', color: c.ok ? '#4ade80' : '#e879f9' }}>{c.label}</span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', paddingLeft: '1.5rem' }}>{c.detail}</div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          background: allOk ? '#052e16' : '#1e1b4b',
          border: `1px solid ${allOk ? '#16a34a' : '#4f46e5'}`,
          maxWidth: '600px',
        }}>
          {allOk ? (
            <p style={{ color: '#4ade80', margin: 0 }}>
              ✅ Server-Konfiguration OK — Problem liegt im Browser-Client
            </p>
          ) : (
            <p style={{ color: '#a5b4fc', margin: 0 }}>
              ❌ Server-Konfiguration fehlerhaft — das erklärt den Ausfall
            </p>
          )}
        </div>

        <div style={{ marginTop: '2rem', color: '#475569', fontSize: '0.75rem', maxWidth: '600px' }}>
          <p style={{ margin: '0 0 0.5rem' }}>Browser-Check: Öffne F12 → Console und schau ob dort rote Fehler stehen.</p>
          <p style={{ margin: '0 0 0.5rem' }}>Diese Seite danach aus dem Code löschen.</p>
          <p style={{ margin: 0 }}>
            <a href="/login" style={{ color: '#38bdf8' }}>→ Zum Login</a>
            {' | '}
            <a href="/api/auth/signout" style={{ color: '#38bdf8' }}>→ Session löschen + neu einloggen</a>
          </p>
        </div>
      </body>
    </html>
  );
}
