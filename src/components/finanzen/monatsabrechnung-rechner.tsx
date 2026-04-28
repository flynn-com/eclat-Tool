'use client';

import { useState, useEffect } from 'react';
import { Calculator, Check, Download, Plus, Trash2, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import type { MonatsabrechnungSettings, Staffel } from '@/lib/settings';

export interface PersonDaten {
  id: string;
  name: string;
  uebertragStunden: number;  // Stunden aus Vormonaten (nach Abzug bisheriger Abrechnungen)
  monatsStunden: number;      // Stunden im Abrechnungsmonat
  gesamtStunden: number;      // uebertrag + monat = verfuegbar
}

interface EinnahmePosition {
  projekt: string;
  betrag: string;
}

interface BonusEintrag {
  personId: string;
  typ: 'neukunde' | 'wiederkehrend';
  umsatz: string;
  bonus: number;
}

interface MonatsabrechnungRechnerProps {
  settings: MonatsabrechnungSettings;
  staffeln: Staffel[];
  personen: PersonDaten[];
  abrechnungsMonat: string;        // z.B. "2026-03"
  abrechnungsMonatLabel: string;   // z.B. "Maerz 2026"
}

interface PersonErgebnis {
  id: string;
  name: string;
  uebertragStunden: number;
  monatsStunden: number;
  gesamtStunden: number;
  zugeteilteStunden: number;
  abzurechnendeStunden: number;
  anteil: number;
  bonus: number;
  auszahlung: number;
}

const STORAGE_KEY = 'monatsabrechnung_entwurf';

function formatEuro(v: number): string {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function berechneStaffelBonus(umsatz: number, staffeln: Staffel[]): number {
  let bonus = 0;
  for (const s of staffeln) {
    const betrag = Math.min(Math.max(umsatz - s.von, 0), s.bis - s.von);
    if (betrag > 0) bonus += betrag * (s.prozent / 100);
  }
  return bonus;
}

export function MonatsabrechnungRechner({ settings, staffeln, personen, abrechnungsMonat, abrechnungsMonatLabel }: MonatsabrechnungRechnerProps) {
  const [einnahmePositionen, setEinnahmePositionen] = useState<EinnahmePosition[]>([{ projekt: '', betrag: '' }]);
  const [ausgaben, setAusgaben] = useState('');
  const [boni, setBoni] = useState<BonusEintrag[]>([]);
  const [stundenManual, setStundenManual] = useState<Record<string, string>>({});
  const [ergebnis, setErgebnis] = useState<{
    personen: PersonErgebnis[];
    gesamtSumme: number;
    steuerruecklage: number;
    investruecklage: number;
    boniSumme: number;
    abrechnungsgrundlage: number;
    anteileTopf: number;
    stundenTopf: number;
    maxStunden: number;
    gesamtAuszahlung: number;
    restStundenBudget: number;
  } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const { profile } = useUser();

  // Draft persistence
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        setEinnahmePositionen(draft.einnahmePositionen?.length > 0 ? draft.einnahmePositionen : [{ projekt: '', betrag: '' }]);
        setAusgaben(draft.ausgaben || '');
        setBoni(draft.boni || []);
        setStundenManual(draft.stundenManual || {});
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ einnahmePositionen, ausgaben, boni, stundenManual }));
    } catch {}
  }, [einnahmePositionen, ausgaben, boni, stundenManual, loaded]);

  const clearCalc = () => { setErgebnis(null); setGespeichert(false); };

  // Einnahme helpers
  const addEinnahme = () => {
    setEinnahmePositionen([...einnahmePositionen, { projekt: '', betrag: '' }]);
    clearCalc();
  };
  const updateEinnahme = (index: number, field: keyof EinnahmePosition, value: string) => {
    const neu = [...einnahmePositionen];
    neu[index] = { ...neu[index], [field]: value };
    setEinnahmePositionen(neu);
    clearCalc();
  };
  const removeEinnahme = (index: number) => {
    if (einnahmePositionen.length <= 1) return;
    setEinnahmePositionen(einnahmePositionen.filter((_, i) => i !== index));
    clearCalc();
  };

  // Bonus helpers
  const addBonus = (personId: string, typ: 'neukunde' | 'wiederkehrend') => {
    const umsatz = '';
    const umsatzZahl = parseFloat(umsatz.replace(/\./g, '').replace(',', '.')) || 0;
    const bonus = typ === 'neukunde'
      ? berechneStaffelBonus(umsatzZahl, staffeln)
      : umsatzZahl * (settings.wiederholterBonusProzent / 100);
    setBoni([...boni, { personId, typ, umsatz, bonus }]);
    clearCalc();
  };

  const updateBonusUmsatz = (index: number, value: string) => {
    const neu = [...boni];
    neu[index] = { ...neu[index], umsatz: value };
    const umsatz = parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
    neu[index].bonus = neu[index].typ === 'neukunde'
      ? berechneStaffelBonus(umsatz, staffeln)
      : umsatz * (settings.wiederholterBonusProzent / 100);
    setBoni(neu);
    clearCalc();
  };

  const removeBonus = (index: number) => {
    setBoni(boni.filter((_, i) => i !== index));
    clearCalc();
  };

  const boniProPerson = (personId: string) => boni.filter((b) => b.personId === personId).reduce((s, b) => s + b.bonus, 0);
  const boniSummeGesamt = boni.reduce((s, b) => s + b.bonus, 0);

  // Live calculation values
  const parse = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
  const einnahmenZahl = einnahmePositionen.reduce((s, p) => s + parse(p.betrag), 0);
  const ausgabenZahl = parse(ausgaben);
  const gesamtSumme = einnahmenZahl - ausgabenZahl;
  const steuerruecklage = gesamtSumme * (settings.steuerProzent / 100);
  const investruecklage = gesamtSumme * (settings.investProzent / 100);
  const restProzent = 100 - settings.steuerProzent - settings.investProzent;
  const abrechnungsgrundlage = Math.max(gesamtSumme - steuerruecklage - investruecklage - boniSummeGesamt, 0);
  const anteileTopf = abrechnungsgrundlage * (settings.anteileProzent / 100);
  const stundenTopf = abrechnungsgrundlage * (settings.stundenProzent / 100);
  const maxStunden = settings.stundenSatz > 0 ? stundenTopf / settings.stundenSatz : 0;

  const berechnen = () => {
    setFehler(null);
    setErgebnis(null);
    setGespeichert(false);

    if (einnahmenZahl <= 0) { setFehler('Bitte Einnahmen eingeben.'); return; }
    if (gesamtSumme <= 0) { setFehler('Einnahmen muessen groesser als Ausgaben sein.'); return; }

    const teilnehmer = personen.filter((p) => p.gesamtStunden > 0);
    if (teilnehmer.length === 0) { setFehler('Kein Mitarbeiter hat Stunden auf dem Konto.'); return; }

    const totalStunden = teilnehmer.reduce((s, p) => s + p.gesamtStunden, 0);
    const anteilProPerson = anteileTopf / teilnehmer.length;

    // Calculate default proportional hours
    const defaultStunden: Record<string, number> = {};
    for (const p of teilnehmer) {
      if (totalStunden <= maxStunden) {
        defaultStunden[p.id] = p.gesamtStunden;
      } else {
        defaultStunden[p.id] = Math.round((p.gesamtStunden / totalStunden) * maxStunden * 100) / 100;
      }
    }

    // Apply manual overrides if set, otherwise use default
    const ergebnisPersonen: PersonErgebnis[] = teilnehmer.map((p) => {
      const manualVal = stundenManual[p.id];
      const zugeteilteStunden = defaultStunden[p.id];
      const abzurechnendeStunden = manualVal !== undefined && manualVal !== ''
        ? Math.min(parseFloat(manualVal.replace(',', '.')) || 0, p.gesamtStunden)
        : zugeteilteStunden;

      const bonus = boniProPerson(p.id);
      const auszahlung = bonus + anteilProPerson + (abzurechnendeStunden * settings.stundenSatz);

      return {
        id: p.id,
        name: p.name,
        uebertragStunden: p.uebertragStunden,
        monatsStunden: p.monatsStunden,
        gesamtStunden: p.gesamtStunden,
        zugeteilteStunden,
        abzurechnendeStunden,
        anteil: anteilProPerson,
        bonus,
        auszahlung,
      };
    });

    // Initialize manual fields with calculated values if not already set
    const newManual = { ...stundenManual };
    for (const p of ergebnisPersonen) {
      if (newManual[p.id] === undefined || newManual[p.id] === '') {
        newManual[p.id] = p.zugeteilteStunden.toFixed(1);
      }
    }
    setStundenManual(newManual);

    const gesamtAuszahlung = ergebnisPersonen.reduce((s, p) => s + p.auszahlung, 0);
    const ausgezahlteStunden = ergebnisPersonen.reduce((s, p) => s + p.abzurechnendeStunden, 0);
    const restStundenBudget = stundenTopf - (ausgezahlteStunden * settings.stundenSatz);

    setErgebnis({
      personen: ergebnisPersonen,
      gesamtSumme,
      steuerruecklage,
      investruecklage,
      boniSumme: boniSummeGesamt,
      abrechnungsgrundlage,
      anteileTopf,
      stundenTopf,
      maxStunden,
      gesamtAuszahlung,
      restStundenBudget: Math.max(restStundenBudget, 0),
    });
  };

  // Recalculate when manual hours change
  const updateManualStunden = (personId: string, value: string) => {
    setStundenManual({ ...stundenManual, [personId]: value });
    if (ergebnis) {
      // Recalculate with new manual value
      const anteilProPerson = anteileTopf / ergebnis.personen.length;
      const updated = ergebnis.personen.map((p) => {
        const val = p.id === personId ? value : (stundenManual[p.id] ?? p.zugeteilteStunden.toFixed(1));
        const abzurechnendeStunden = Math.min(parseFloat(String(val).replace(',', '.')) || 0, p.gesamtStunden);
        const bonus = boniProPerson(p.id);
        const auszahlung = bonus + anteilProPerson + (abzurechnendeStunden * settings.stundenSatz);
        return { ...p, abzurechnendeStunden, auszahlung };
      });
      const gesamtAuszahlung = updated.reduce((s, p) => s + p.auszahlung, 0);
      const ausgezahlteStd = updated.reduce((s, p) => s + p.abzurechnendeStunden, 0);
      const restStundenBudget = Math.max(ergebnis.stundenTopf - (ausgezahlteStd * settings.stundenSatz), 0);
      setErgebnis({ ...ergebnis, personen: updated, gesamtAuszahlung, restStundenBudget });
    }
  };

  const abschliessen = async () => {
    if (!ergebnis) return;
    setIsSaving(true);
    setFehler(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFehler('Nicht angemeldet'); setIsSaving(false); return; }

    for (const p of ergebnis.personen) {
      if (p.abzurechnendeStunden > 0) {
        const { error } = await supabase.from('stunden_abrechnungen').insert({
          user_id: p.id,
          stunden: p.abzurechnendeStunden,
          beschreibung: `Monatsabrechnung ${abrechnungsMonatLabel}: ${formatEuro(p.auszahlung)}`,
        });
        if (error) { setFehler('Fehler: ' + error.message); setIsSaving(false); return; }
      }
    }

    const { error: archivError } = await supabase.from('gewinnverteilungen').insert({
      erstellt_von: user.id,
      gesamtgewinn: ergebnis.gesamtSumme,
      gewinn_nach_bonus: ergebnis.abrechnungsgrundlage,
      gesamt_bonus: ergebnis.boniSumme,
      steuerruecklage: ergebnis.steuerruecklage,
      investruecklage: ergebnis.investruecklage,
      einnahmen: einnahmenZahl,
      ausgaben: ausgabenZahl,
      abrechnungsgrundlage: ergebnis.abrechnungsgrundlage,
      monat: abrechnungsMonat,
      verteilung_prozent: { ...settings, einnahmePositionen: einnahmePositionen.filter(p => parse(p.betrag) > 0) },
      positionen: ergebnis.personen,
    });

    if (archivError) { setFehler('Fehler beim Archivieren: ' + archivError.message); setIsSaving(false); return; }

    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setGespeichert(true);
    setIsSaving(false);
    router.refresh();
  };

  const downloadPdf = async () => {
    if (!ergebnis) return;
    // Lazy load PDF library only when needed (saves ~600KB on initial load)
    const { generateMonatsabrechnungPdf } = await import('@/lib/pdf-monatsabrechnung');
    const datum = new Date().toLocaleDateString('de-DE');
    const doc = await generateMonatsabrechnungPdf({
      monat: abrechnungsMonatLabel,
      einnahmePositionen: einnahmePositionen.filter(p => parse(p.betrag) > 0),
      einnahmen: einnahmenZahl,
      ausgaben: ausgabenZahl,
      gesamtSumme: ergebnis.gesamtSumme,
      steuerruecklage: ergebnis.steuerruecklage,
      investruecklage: ergebnis.investruecklage,
      boniSumme: ergebnis.boniSumme,
      abrechnungsgrundlage: ergebnis.abrechnungsgrundlage,
      anteileTopf: ergebnis.anteileTopf,
      stundenTopf: ergebnis.stundenTopf,
      maxStunden: ergebnis.maxStunden,
      settings,
      positionen: ergebnis.personen,
      erstelltVon: profile?.full_name || 'Unbekannt',
      datum,
    });
    doc.save(`Monatsabrechnung_${datum.replace(/\./g, '-')}.pdf`);
  };

  const resetAbrechnungen = async () => {
    if (!confirm('Alle abgerechneten Stunden zuruecksetzen?')) return;
    const supabase = createClient();
    await supabase.from('stunden_abrechnungen').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    router.refresh();
  };

  // Total manually assigned hours
  const totalManualStunden = ergebnis
    ? ergebnis.personen.reduce((s, p) => s + p.abzurechnendeStunden, 0)
    : 0;

  return (
    <div className="max-w-3xl space-y-6">
      {/* 1. Stundenkonto */}
      <div className="neu-raised p-5">
        <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Stundenkonten</h3>
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-1 text-xs font-medium" style={{ color: 'var(--neu-accent-mid)' }}>
            <span className="flex-1">Person</span>
            <span className="w-28 text-right">Uebertrag</span>
            <span className="w-28 text-right">+ {abrechnungsMonatLabel.split(' ')[0]}</span>
            <span className="w-24 text-right">= Verfuegbar</span>
          </div>
          {personen.map((p) => (
            <div key={p.id} className="flex items-center gap-4 neu-pressed px-4 py-3">
              <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--neu-text)' }}>{p.name}</span>
              <span className="w-28 text-right text-sm" style={{ color: 'var(--neu-text-secondary)' }}>{p.uebertragStunden.toFixed(1)} Std</span>
              <span className="w-28 text-right text-sm" style={{ color: '#10B981' }}>+{p.monatsStunden.toFixed(1)} Std</span>
              <span className="w-24 text-right text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{p.gesamtStunden.toFixed(1)} Std</span>
            </div>
          ))}
        </div>
        <button onClick={resetAbrechnungen} className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: '#EF4444' }}>
          <RotateCcw className="h-3 w-3" /> Abgerechnete Stunden zuruecksetzen
        </button>
      </div>

      {/* 2. Einnahmen */}
      <div className="neu-raised p-5">
        <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Einnahmen</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--neu-text-secondary)' }}>Alle Einnahmen dieses Monats nach Auftrag/Projekt auflisten (netto)</p>
        <div className="space-y-2 mb-3">
          {einnahmePositionen.map((pos, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={pos.projekt}
                onChange={(e) => updateEinnahme(i, 'projekt', e.target.value)}
                placeholder="Auftrag / Projekt"
                className="neu-input flex-1 text-sm py-1.5"
              />
              <input
                type="text"
                value={pos.betrag}
                onChange={(e) => updateEinnahme(i, 'betrag', e.target.value)}
                placeholder="Betrag (EUR)"
                className="neu-input w-32 text-sm py-1.5 text-right"
              />
              {einnahmePositionen.length > 1 && (
                <button onClick={() => removeEinnahme(i)} className="p-1">
                  <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addEinnahme} className="neu-btn flex items-center gap-1 px-3 py-1.5 text-xs mb-4" style={{ color: 'var(--neu-accent)' }}>
          <Plus className="h-3 w-3" /> Weitere Einnahme
        </button>

        <div className="neu-pressed px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: 'var(--neu-text-secondary)' }}>Einnahmen gesamt</span>
          <span className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>{formatEuro(einnahmenZahl)}</span>
        </div>
      </div>

      {/* 3. Ausgaben */}
      <div className="neu-raised p-5">
        <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Ausgaben</h3>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Ausgaben gesamt netto (EUR)</label>
          <input type="text" value={ausgaben} onChange={(e) => { setAusgaben(e.target.value); clearCalc(); }} placeholder="z.B. 15000" className="neu-input w-full text-sm" />
        </div>
        <div className="mt-3 neu-pressed px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: 'var(--neu-text-secondary)' }}>Gesamt zu verteilende Summe</span>
          <span className="text-lg font-bold" style={{ color: gesamtSumme > 0 ? 'var(--neu-text)' : '#EF4444' }}>{formatEuro(gesamtSumme)}</span>
        </div>
      </div>

      {/* 3. Boni (vor Ruecklagen, weil sie abgezogen werden) */}
      <div className="neu-raised p-5">
        <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Vertriebsboni</h3>

        {/* Add bonus */}
        <div className="flex items-center gap-2 mb-4">
          <select id="bonus-person" className="neu-input text-sm py-1.5 flex-1">
            {personen.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => { const sel = (document.getElementById('bonus-person') as HTMLSelectElement)?.value; if (sel) addBonus(sel, 'neukunde'); }} className="neu-btn-primary px-4 py-1.5 text-xs whitespace-nowrap">
            Neukunde
          </button>
          <button onClick={() => { const sel = (document.getElementById('bonus-person') as HTMLSelectElement)?.value; if (sel) addBonus(sel, 'wiederkehrend'); }} className="neu-btn px-4 py-1.5 text-xs whitespace-nowrap" style={{ color: 'var(--neu-accent)' }}>
            Bestandskunde
          </button>
        </div>

        {/* Bonus list */}
        {boni.length > 0 && (
          <div className="space-y-2">
            {boni.map((b, i) => {
              const person = personen.find((p) => p.id === b.personId);
              return (
                <div key={i} className="flex items-center gap-2 neu-pressed px-3 py-2">
                  <span className="text-xs font-semibold w-20 truncate" style={{ color: 'var(--neu-text)' }}>{person?.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{
                    background: b.typ === 'neukunde' ? '#00192E' : '#F59E0B',
                    color: 'white',
                  }}>
                    {b.typ === 'neukunde' ? 'Neukunde' : 'Bestandskunde'}
                  </span>
                  <div className="flex-1">
                    <input type="text" value={b.umsatz} onChange={(e) => updateBonusUmsatz(i, e.target.value)} placeholder="Umsatz (EUR)" className="neu-input text-xs py-1 w-full" />
                  </div>
                  <span className="text-xs font-bold w-24 text-right" style={{ color: '#10B981' }}>{formatEuro(b.bonus)}</span>
                  <button onClick={() => removeBonus(i)} className="p-1"><Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--neu-accent-mid)' }} /></button>
                </div>
              );
            })}
          </div>
        )}
        {boniSummeGesamt > 0 && (
          <div className="mt-3 text-sm font-semibold" style={{ color: '#10B981' }}>Boni gesamt: {formatEuro(boniSummeGesamt)}</div>
        )}
      </div>

      {/* 4. Aufschluesselung */}
      <div className="neu-raised p-5">
        <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Aufschluesselung</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span style={{ color: 'var(--neu-text-secondary)' }}>Gesamt zu verteilende Summe</span><span className="font-medium" style={{ color: 'var(--neu-text)' }}>{formatEuro(gesamtSumme)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--neu-text-secondary)' }}>- {settings.steuerProzent}% Steuerruecklage</span><span className="font-medium" style={{ color: 'var(--neu-text)' }}>{formatEuro(steuerruecklage)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--neu-text-secondary)' }}>- {settings.investProzent}% Investitionsruecklage</span><span className="font-medium" style={{ color: 'var(--neu-text)' }}>{formatEuro(investruecklage)}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--neu-text-secondary)' }}>- Vertriebsboni</span><span className="font-medium" style={{ color: 'var(--neu-text)' }}>{formatEuro(boniSummeGesamt)}</span></div>
          <hr className="my-1" style={{ borderColor: 'var(--neu-accent-mid)', opacity: 0.3 }} />
          <div className="flex justify-between text-base font-bold" style={{ color: 'var(--neu-text)' }}>
            <span>= Abrechnungsgrundlage ({restProzent}% offen)</span>
            <span>{formatEuro(abrechnungsgrundlage)}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="neu-pressed px-3 py-2.5">
            <span className="block text-xs font-medium" style={{ color: 'var(--neu-text-secondary)' }}>{settings.anteileProzent}% Gesellschafteranteil</span>
            <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{formatEuro(anteileTopf)}</span>
          </div>
          <div className="neu-pressed px-3 py-2.5">
            <span className="block text-xs font-medium" style={{ color: 'var(--neu-text-secondary)' }}>{settings.stundenProzent}% Stunden ({settings.stundenSatz} EUR/Std)</span>
            <span className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{formatEuro(stundenTopf)}</span>
            <span className="block text-xs font-semibold mt-0.5" style={{ color: '#10B981' }}>Max. {maxStunden.toFixed(1)} Std abrechenbar</span>
          </div>
        </div>
      </div>

      {/* Berechnen Button */}
      <button onClick={berechnen} className="neu-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
        <Calculator className="h-4 w-4" /> Abrechnung berechnen
      </button>

      {fehler && <p className="text-sm text-red-500">{fehler}</p>}

      {/* 5. Ergebnis — Stundenverteilung + Auszahlung */}
      {ergebnis && (
        <div className="neu-raised p-5 space-y-4">
          {/* Stundenverteilung (editierbar) */}
          <div>
            <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Stundenverteilung</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--neu-text-secondary)' }}>
              Max. {maxStunden.toFixed(1)} Std abrechenbar. Stunden manuell anpassen — Gesamt: {totalManualStunden.toFixed(1)} / {maxStunden.toFixed(1)} Std
            </p>
            <div className="space-y-2">
              {ergebnis.personen.map((p) => (
                <div key={p.id} className="flex items-center gap-3 neu-pressed px-4 py-2.5">
                  <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{p.name}</span>
                  <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Konto: {p.gesamtStunden.toFixed(1)} Std</span>
                  <span className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Vorschlag: {p.zugeteilteStunden.toFixed(1)}</span>
                  <input
                    type="text"
                    value={stundenManual[p.id] ?? p.zugeteilteStunden.toFixed(1)}
                    onChange={(e) => updateManualStunden(p.id, e.target.value)}
                    className="neu-input w-20 text-sm text-center py-1"
                  />
                </div>
              ))}
            </div>
            {totalManualStunden > maxStunden && (
              <p className="text-xs mt-2" style={{ color: '#EF4444' }}>
                Achtung: {totalManualStunden.toFixed(1)} Std zugewiesen, aber nur {maxStunden.toFixed(1)} Std abrechenbar!
              </p>
            )}
          </div>

          <hr style={{ borderColor: 'var(--neu-accent-mid)', opacity: 0.3 }} />

          {/* Auszahlung pro Person */}
          <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Auszahlung pro Person</h3>
          {ergebnis.personen.map((p) => (
            <div key={p.id} className="neu-pressed p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base" style={{ color: 'var(--neu-text)' }}>{p.name}</span>
                <span className="text-xl font-bold" style={{ color: '#10B981' }}>{formatEuro(p.auszahlung)}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                {p.bonus > 0 && <><span>Vertriebsbonus</span><span className="text-right font-medium">{formatEuro(p.bonus)}</span></>}
                <span>Gesellschafteranteil ({settings.anteileProzent}%)</span><span className="text-right font-medium">{formatEuro(p.anteil)}</span>
                <span>Stunden ({p.abzurechnendeStunden.toFixed(1)} x {settings.stundenSatz} EUR)</span><span className="text-right font-medium">{formatEuro(p.abzurechnendeStunden * settings.stundenSatz)}</span>
              </div>
            </div>
          ))}

          {/* Gesamt-Auszahlung */}
          <div className="neu-pressed p-4 flex items-center justify-between">
            <span className="font-bold text-base" style={{ color: 'var(--neu-text)' }}>Gesamt-Auszahlung</span>
            <span className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>{formatEuro(ergebnis.gesamtAuszahlung)}</span>
          </div>

          {/* Restbetrag */}
          {ergebnis.restStundenBudget > 0 && (
            <div className="neu-pressed p-4 border-l-4" style={{ borderColor: '#F59E0B' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm" style={{ color: '#F59E0B' }}>Nicht ausgezahlter Restbetrag</span>
                <span className="text-lg font-bold" style={{ color: '#F59E0B' }}>{formatEuro(ergebnis.restStundenBudget)}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                Aus dem Stundentopf ({formatEuro(ergebnis.stundenTopf)}) wurden nur {formatEuro(ergebnis.stundenTopf - ergebnis.restStundenBudget)} ausgezahlt.
                Der Rest von {formatEuro(ergebnis.restStundenBudget)} bleibt im Unternehmen.
              </p>
            </div>
          )}

          <hr style={{ borderColor: 'var(--neu-accent-mid)', opacity: 0.3 }} />

          {!gespeichert ? (
            <div className="space-y-3">
              <button onClick={downloadPdf} className="w-full neu-btn flex items-center justify-center gap-2 py-2.5 text-sm" style={{ color: 'var(--neu-accent)' }}>
                <Download className="h-4 w-4" /> Vorschau als PDF
              </button>
              <button onClick={abschliessen} disabled={isSaving} className="w-full neu-btn-primary py-2.5 text-sm disabled:opacity-50">
                {isSaving ? 'Speichere...' : 'Abschliessen, Stunden abbuchen und archivieren'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold" style={{ color: '#10B981' }}>
                <Check className="h-5 w-5" /> Gespeichert und archiviert
              </div>
              <button onClick={downloadPdf} className="w-full neu-btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
                <Download className="h-4 w-4" /> Als PDF herunterladen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
