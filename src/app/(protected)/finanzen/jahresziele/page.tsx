import { createClient } from '@/lib/supabase/server';
import { JahreszieleView } from '@/components/finanzen/jahresziel-view';
import { ManuelleEinnahmenManager } from '@/components/finanzen/manuelle-einnahmen-manager';

export default async function JahreszieleSeite() {
  const supabase = await createClient();
  const jahr = new Date().getFullYear();

  const startOfYear = `${jahr}-01`;
  const endOfYear   = `${jahr}-12`;

  const [{ data: zielRow }, { data: abrechnungen }, { data: manuelleRaw }] = await Promise.all([
    supabase.from('jahresziele').select('umsatzziel').eq('jahr', jahr).maybeSingle(),
    supabase.from('gewinnverteilungen')
      .select('einnahmen, monat')
      .gte('monat', startOfYear)
      .lte('monat', endOfYear),
    supabase.from('manuelle_einnahmen')
      .select('id, monat, bezeichnung, betrag')
      .gte('monat', startOfYear)
      .lte('monat', endOfYear)
      .order('monat', { ascending: false }),
  ]);

  const umsatzziel = Number(zielRow?.umsatzziel ?? 0);

  const einnahmenAbrechnungen = (abrechnungen ?? []).reduce((s, r) => s + Number(r.einnahmen ?? 0), 0);
  const einnahmenManuell      = (manuelleRaw ?? []).reduce((s, r) => s + Number(r.betrag ?? 0), 0);
  const einnahmenJahr         = einnahmenAbrechnungen + einnahmenManuell;

  const now = new Date();
  const startYear = new Date(jahr, 0, 1);
  const endYear   = new Date(jahr + 1, 0, 1);
  const prozentJahr = Math.round(
    ((now.getTime() - startYear.getTime()) / (endYear.getTime() - startYear.getTime())) * 100
  );

  const manuelleEinnahmen = (manuelleRaw ?? []).map(r => ({
    id: r.id,
    monat: r.monat as string,
    bezeichnung: r.bezeichnung as string,
    betrag: Number(r.betrag),
  }));

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

      <ManuelleEinnahmenManager
        jahr={jahr}
        einnahmen={manuelleEinnahmen}
      />
    </div>
  );
}
