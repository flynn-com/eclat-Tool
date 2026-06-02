import { createClient } from '@/lib/supabase/server';
import { JahreszieleView } from '@/components/finanzen/jahresziel-view';

export default async function JahreszieleSeite() {
  const supabase = await createClient();
  const jahr = new Date().getFullYear();

  const startOfYear = `${jahr}-01-01`;
  const endOfYear = `${jahr}-12-31`;

  const [{ data: zielRow }, { data: abrechnungen }] = await Promise.all([
    supabase.from('jahresziele').select('umsatzziel').eq('jahr', jahr).maybeSingle(),
    supabase.from('gewinnverteilungen')
      .select('einnahmen, monat')
      .gte('monat', startOfYear)
      .lte('monat', endOfYear),
  ]);

  const umsatzziel = Number(zielRow?.umsatzziel ?? 0);
  const einnahmenJahr = (abrechnungen ?? []).reduce((s, r) => s + Number(r.einnahmen ?? 0), 0);

  // Wie weit ist das Jahr abgelaufen (0-100)?
  const now = new Date();
  const startYear = new Date(jahr, 0, 1);
  const endYear = new Date(jahr + 1, 0, 1);
  const prozentJahr = Math.round(((now.getTime() - startYear.getTime()) / (endYear.getTime() - startYear.getTime())) * 100);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Jahresziel</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Umsatzziel und Fortschritt {jahr}</p>
      </div>
      <JahreszieleView
        jahr={jahr}
        umsatzziel={umsatzziel}
        einnahmenJahr={einnahmenJahr}
        prozentJahr={prozentJahr}
      />
    </div>
  );
}
