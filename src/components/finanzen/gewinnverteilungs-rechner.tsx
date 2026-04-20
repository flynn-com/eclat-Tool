'use client';

import { useState, useEffect } from 'react';
import { Calculator, Check, Download, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { generateGewinnverteilungPdf } from '@/lib/pdf-gewinnverteilung';
import type { GewinnverteilungSettings as GVSettings } from '@/lib/settings';

export interface OffenerBonus {
  id: string;
  bonus: number;
  umsatz: number;
  datum: string;
}

export interface PersonDaten {
  id: string;
  name: string;
  gesamtStunden: number;
  abgerechnet: number;
  verfuegbar: number;
  offeneBoni: OffenerBonus[];
}

interface GewinnverteilungsRechnerProps {
  verteilung?: GVSettings;
  personen: PersonDaten[];
}

interface PersonErgebnis {
  id: string;
  name: string;
  eingesetztStunden: number;
  anteilGleich: number;
  anteilStunden: number;
  bonus: number;
  gesamt: number;
  stundenlohn: number;
}

interface GespeicherterStand {
  gewinn: string;
  stundenEingabe: Record<string, string>;
  ausgewaehlteBoni: Record<string, boolean>;
}

const STORAGE_KEY = 'gewinnverteilung_entwurf';

function formatEuro(value: number): string {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function loadEntwurf(): GespeicherterStand | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveEntwurf(stand: GespeicherterStand) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stand)); } catch {}
}

function clearEntwurf() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function GewinnverteilungsRechner({ verteilung, personen }: GewinnverteilungsRechnerProps) {
  const pGleich = (verteilung?.gleich ?? 30) / 100;
  const pStunden = (verteilung?.stunden ?? 40) / 100;
  const pSteuer = (verteilung?.steuer ?? 30) / 100;

  const [gewinn, setGewinn] = useState('');
  const [ausgewaehlteBoni, setAusgewaehlteBoni] = useState<Record<string, boolean>>({});
  const [stundenEingabe, setStundenEingabe] = useState<Record<string, string>>(
    Object.fromEntries(personen.map((p) => [p.id, '']))
  );
  const [ergebnis, setErgebnis] = useState<{
    personen: PersonErgebnis[];
    steuerruecklage: number;
    gewinnNachBonus: number;
    gesamtBonus: number;
  } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [gespeichert, setGespeichert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const { profile } = useUser();

  // Load saved draft on mount
  useEffect(() => {
    const entwurf = loadEntwurf();
    if (entwurf) {
      setGewinn(entwurf.gewinn || '');
      setAusgewaehlteBoni(entwurf.ausgewaehlteBoni || {});
      setStundenEingabe((prev) => ({ ...prev, ...entwurf.stundenEingabe }));
    }
    setLoaded(true);
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    if (!loaded) return;
    saveEntwurf({ gewinn, stundenEingabe, ausgewaehlteBoni });
  }, [gewinn, stundenEingabe, ausgewaehlteBoni, loaded]);

  const toggleBonus = (bonusId: string) => {
    setAusgewaehlteBoni({ ...ausgewaehlteBoni, [bonusId]: !ausgewaehlteBoni[bonusId] });
    setErgebnis(null);
    setGespeichert(false);
  };

  const updateStunden = (id: string, value: string) => {
    setStundenEingabe({ ...stundenEingabe, [id]: value });
    setErgebnis(null);
    setGespeichert(false);
  };

  const bonusProPerson = (personId: string): number => {
    const person = personen.find((p) => p.id === personId);
    if (!person) return 0;
    return person.offeneBoni
      .filter((b) => ausgewaehlteBoni[b.id])
      .reduce((sum, b) => sum + b.bonus, 0);
  };

  const gesamtBonusAusgewaehlt = personen.reduce((sum, p) => sum + bonusProPerson(p.id), 0);

  const berechnen = () => {
    setFehler(null);
    setErgebnis(null);
    setGespeichert(false);

    const gewinnZahl = parseFloat(gewinn.replace(/\./g, '').replace(',', '.'));
    if (isNaN(gewinnZahl) || gewinnZahl <= 0) {
      setFehler('Bitte einen gueltigen Gesamtgewinn eingeben.');
      return;
    }

    const personenMitStunden = personen.map((p) => {
      const stunden = parseFloat((stundenEingabe[p.id] || '0').replace(',', '.')) || 0;
      return { ...p, eingesetzt: stunden, bonus: bonusProPerson(p.id) };
    });

    for (const p of personenMitStunden) {
      if (p.eingesetzt > p.verfuegbar) {
        setFehler(`${p.name}: Nur ${p.verfuegbar.toFixed(1)} Std verfuegbar, aber ${p.eingesetzt} eingegeben.`);
        return;
      }
    }

    const aktivePersonen = personenMitStunden.filter((p) => p.eingesetzt > 0);
    if (aktivePersonen.length === 0) {
      setFehler('Bitte mindestens fuer eine Person Stunden eingeben.');
      return;
    }

    const gewinnNachBonus = gewinnZahl - gesamtBonusAusgewaehlt;
    const anzahl = aktivePersonen.length;
    const anteilGleich = (gewinnNachBonus * pGleich) / anzahl;
    const steuerruecklage = gewinnNachBonus * pSteuer;
    const gesamtStunden = aktivePersonen.reduce((sum, p) => sum + p.eingesetzt, 0);
    const anteilProStunde = gesamtStunden > 0 ? (gewinnNachBonus * pStunden) / gesamtStunden : 0;

    const ergebnisPersonen: PersonErgebnis[] = aktivePersonen.map((p) => {
      const anteilStunden = p.eingesetzt * anteilProStunde;
      const gesamt = anteilGleich + anteilStunden + p.bonus;
      const stundenlohn = p.eingesetzt > 0 ? anteilStunden / p.eingesetzt : 0;

      return {
        id: p.id,
        name: p.name,
        eingesetztStunden: p.eingesetzt,
        anteilGleich,
        anteilStunden,
        bonus: p.bonus,
        gesamt,
        stundenlohn,
      };
    });

    setErgebnis({ personen: ergebnisPersonen, steuerruecklage, gewinnNachBonus, gesamtBonus: gesamtBonusAusgewaehlt });
  };

  const stundenAbbuchen = async () => {
    if (!ergebnis) return;
    setIsSaving(true);
    setFehler(null);

    const supabase = createClient();
    const datum = new Date().toLocaleDateString('de-DE');
    const gewinnZahl = parseFloat(gewinn.replace(/\./g, '').replace(',', '.'));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setFehler('Nicht angemeldet'); setIsSaving(false); return; }

    // 1. Deduct hours
    for (const p of ergebnis.personen) {
      if (p.eingesetztStunden > 0) {
        const { error } = await supabase.from('stunden_abrechnungen').insert({
          user_id: p.id,
          stunden: p.eingesetztStunden,
          beschreibung: `Gewinnverteilung vom ${datum}: ${formatEuro(p.gesamt)}`,
        });
        if (error) {
          setFehler('Fehler beim Abbuchen der Stunden: ' + error.message);
          setIsSaving(false);
          return;
        }
      }
    }

    // 2. Mark used boni
    const usedBoniIds = Object.entries(ausgewaehlteBoni)
      .filter(([, selected]) => selected)
      .map(([id]) => id);

    if (usedBoniIds.length > 0) {
      const { error } = await supabase
        .from('gespeicherte_boni')
        .update({ verwendet: true })
        .in('id', usedBoniIds);
      if (error) {
        setFehler('Fehler beim Verrechnen der Boni: ' + error.message);
        setIsSaving(false);
        return;
      }
    }

    // 3. Save to archive
    const positionen = ergebnis.personen.map((p) => ({
      name: p.name,
      stunden: p.eingesetztStunden,
      anteilGleich: p.anteilGleich,
      anteilStunden: p.anteilStunden,
      bonus: p.bonus,
      gesamt: p.gesamt,
      stundenlohn: p.stundenlohn,
    }));

    const archivData = {
      erstellt_von: user.id,
      gesamtgewinn: gewinnZahl,
      gewinn_nach_bonus: ergebnis.gewinnNachBonus,
      gesamt_bonus: ergebnis.gesamtBonus,
      steuerruecklage: ergebnis.steuerruecklage,
      verteilung_prozent: {
        gleich: verteilung?.gleich ?? 30,
        stunden: verteilung?.stunden ?? 40,
        steuer: verteilung?.steuer ?? 30,
      },
      positionen,
    };

    const { error: archivError } = await supabase.from('gewinnverteilungen').insert(archivData);

    if (archivError) {
      setFehler('Fehler beim Archivieren: ' + archivError.message);
      setIsSaving(false);
      return;
    }

    // 4. Clear draft
    clearEntwurf();
    setGespeichert(true);
    setIsSaving(false);
    router.refresh();
  };

  const downloadPdf = () => {
    if (!ergebnis) return;
    const gewinnZahl = parseFloat(gewinn.replace(/\./g, '').replace(',', '.'));
    const datum = new Date().toLocaleDateString('de-DE');

    const doc = generateGewinnverteilungPdf({
      gesamtgewinn: gewinnZahl,
      gewinnNachBonus: ergebnis.gewinnNachBonus,
      gesamtBonus: ergebnis.gesamtBonus,
      steuerruecklage: ergebnis.steuerruecklage,
      verteilungProzent: {
        gleich: verteilung?.gleich ?? 30,
        stunden: verteilung?.stunden ?? 40,
        steuer: verteilung?.steuer ?? 30,
      },
      positionen: ergebnis.personen.map((p) => ({
        name: p.name,
        stunden: p.eingesetztStunden,
        anteilGleich: p.anteilGleich,
        anteilStunden: p.anteilStunden,
        bonus: p.bonus,
        gesamt: p.gesamt,
        stundenlohn: p.stundenlohn,
      })),
      erstelltVon: profile?.full_name ?? 'Unbekannt',
      datum,
    });

    doc.save(`Gewinnverteilung_${datum.replace(/\./g, '-')}.pdf`);
  };

  const resetAbrechnungen = async () => {
    if (!confirm('Alle abgerechneten Stunden zuruecksetzen? Die erfassten Stunden aus der Zeiterfassung bleiben erhalten.')) return;
    setFehler(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('stunden_abrechnungen')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      setFehler('Fehler beim Zuruecksetzen: ' + error.message);
      return;
    }

    router.refresh();
  };

  const hatOffeneBoni = personen.some((p) => p.offeneBoni.length > 0);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Gesamtgewinn */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gesamtgewinn (Euro)</label>
        <input
          type="text"
          value={gewinn}
          onChange={(e) => { setGewinn(e.target.value); setErgebnis(null); setGespeichert(false); }}
          placeholder="z.B. 50000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Offene Boni */}
      {hatOffeneBoni && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gespeicherte Vertriebsboni</label>
          <div className="space-y-2">
            {personen.map((p) =>
              p.offeneBoni.map((b) => (
                <label
                  key={b.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                    ausgewaehlteBoni[b.id]
                      ? 'bg-green-50 border-green-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!ausgewaehlteBoni[b.id]}
                    onChange={() => toggleBonus(b.id)}
                    className="h-4 w-4 text-green-600 rounded"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({b.datum}, Umsatz: {formatEuro(b.umsatz)})</span>
                  </div>
                  <span className="font-semibold text-green-600">{formatEuro(b.bonus)}</span>
                </label>
              ))
            )}
          </div>
          {gesamtBonusAusgewaehlt > 0 && (
            <p className="text-sm font-medium text-green-700 mt-2">
              Bonus gesamt: {formatEuro(gesamtBonusAusgewaehlt)} (wird vom Gewinn abgezogen)
            </p>
          )}
        </div>
      )}

      {/* Personen mit Stundenkonto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Mitarbeiter und Stunden</label>
        <div className="space-y-3">
          {personen.map((p) => (
            <div key={p.id} className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">Erfasst: {p.gesamtStunden.toFixed(1)} | Abgerechnet: {p.abgerechnet.toFixed(1)}</p>
              </div>
              <span className="text-base font-semibold text-blue-700 whitespace-nowrap">
                {p.verfuegbar.toFixed(1)} Std frei
              </span>
              <input
                type="text"
                value={stundenEingabe[p.id] || ''}
                onChange={(e) => updateStunden(p.id, e.target.value)}
                placeholder="0"
                className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-center"
              />
            </div>
          ))}
        </div>
        <button
          onClick={resetAbrechnungen}
          className="mt-3 flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Abgerechnete Stunden zuruecksetzen
        </button>
      </div>

      {/* Verteilungs-Info */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-2">Verteilungsschluessel:</p>
        <p>{verteilung?.gleich ?? 30} % — Gleichmaessig auf alle Personen</p>
        <p>{verteilung?.stunden ?? 40} % — Nach Arbeitsstunden</p>
        <p>{verteilung?.steuer ?? 30} % — Steuerruecklage</p>
      </div>

      {/* Button */}
      <button
        onClick={berechnen}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        <Calculator className="h-4 w-4" />
        Gewinn verteilen
      </button>

      {fehler && <p className="text-sm text-red-600">{fehler}</p>}

      {/* Ergebnis */}
      {ergebnis && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Gewinn nach Bonus-Abzug:</span>
            <span className="font-medium text-gray-900">{formatEuro(ergebnis.gewinnNachBonus)}</span>
          </div>

          <hr className="border-gray-200" />

          {ergebnis.personen.map((p) => (
            <div key={p.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900">{p.name}</p>
                <p className="text-xl font-bold text-green-600">{formatEuro(p.gesamt)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">{verteilung?.gleich ?? 30} % gleichmaessig:</div>
                <div className="text-right font-medium">{formatEuro(p.anteilGleich)}</div>
                <div className="text-gray-600">Anteil nach Stunden ({p.eingesetztStunden} Std):</div>
                <div className="text-right font-medium">{formatEuro(p.anteilStunden)}</div>
                {p.bonus > 0 && (
                  <>
                    <div className="text-gray-600">Vertriebsbonus:</div>
                    <div className="text-right font-medium text-green-600">+ {formatEuro(p.bonus)}</div>
                  </>
                )}
                <div className="text-gray-600">Stundenlohn:</div>
                <div className="text-right font-medium">{formatEuro(p.stundenlohn)} / Std</div>
              </div>
            </div>
          ))}

          <hr className="border-gray-200" />

          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900">Steuerruecklage ({verteilung?.steuer ?? 30} %)</p>
            <p className="text-lg font-bold text-orange-600">{formatEuro(ergebnis.steuerruecklage)}</p>
          </div>

          <hr className="border-gray-200" />

          {!gespeichert ? (
            <div className="space-y-3">
              <button
                onClick={downloadPdf}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Vorschau als PDF herunterladen
              </button>
              <button
                onClick={stundenAbbuchen}
                disabled={isSaving}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Speichere...' : 'Abschliessen, Stunden abbuchen und archivieren'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-2.5 text-green-600 font-medium">
                <Check className="h-5 w-5" />
                Gespeichert und archiviert
              </div>
              <button
                onClick={downloadPdf}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Als PDF herunterladen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
