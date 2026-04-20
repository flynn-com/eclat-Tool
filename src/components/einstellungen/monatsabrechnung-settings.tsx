'use client';

import { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { MonatsabrechnungSettings } from '@/lib/settings';

interface Props {
  initial: MonatsabrechnungSettings;
}

export function MonatsabrechnungSettingsForm({ initial }: Props) {
  const [steuer, setSteuer] = useState(String(initial.steuerProzent));
  const [invest, setInvest] = useState(String(initial.investProzent));
  const [anteile, setAnteile] = useState(String(initial.anteileProzent));
  const [stunden, setStunden] = useState(String(initial.stundenProzent));
  const [satz, setSatz] = useState(String(initial.stundenSatz));
  const [wiederholt, setWiederholt] = useState(String(initial.wiederholterBonusProzent));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const verteilungSumme = (parseFloat(anteile) || 0) + (parseFloat(stunden) || 0);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    const a = parseFloat(anteile) || 0;
    const s = parseFloat(stunden) || 0;
    if (a + s !== 100) {
      setError(`Anteile + Stunden muessen 100% ergeben (aktuell: ${a + s}%)`);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from('app_settings')
      .upsert({
        key: 'monatsabrechnung',
        value: {
          steuerProzent: parseFloat(steuer) || 0,
          investProzent: parseFloat(invest) || 0,
          anteileProzent: a,
          stundenProzent: s,
          stundenSatz: parseFloat(satz) || 20,
          wiederholterBonusProzent: parseFloat(wiederholt) || 1,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (saveError) setError('Fehler: ' + saveError.message);
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    setIsLoading(false);
  };

  return (
    <div className="neu-raised p-5">
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Monatsabrechnung</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Steuerruecklage (%)</label>
          <input type="number" value={steuer} onChange={(e) => setSteuer(e.target.value)} className="neu-input w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Investitionsruecklage (%)</label>
          <input type="number" value={invest} onChange={(e) => setInvest(e.target.value)} className="neu-input w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Anteil gleichmaessig (%)</label>
          <input type="number" value={anteile} onChange={(e) => setAnteile(e.target.value)} className="neu-input w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Anteil nach Stunden (%)</label>
          <input type="number" value={stunden} onChange={(e) => setStunden(e.target.value)} className="neu-input w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Stundensatz (EUR)</label>
          <input type="number" value={satz} onChange={(e) => setSatz(e.target.value)} className="neu-input w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Wiederholter Bonus (%)</label>
          <input type="number" value={wiederholt} onChange={(e) => setWiederholt(e.target.value)} className="neu-input w-full text-sm" />
        </div>
      </div>

      <p className={`text-sm font-medium mt-3 ${verteilungSumme === 100 ? 'text-green-600' : 'text-red-500'}`}>
        Anteile + Stunden = {verteilungSumme}%
      </p>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      <button onClick={handleSave} disabled={isLoading || verteilungSumme !== 100}
        className="neu-btn-primary px-4 py-2 text-sm mt-4 disabled:opacity-50 flex items-center gap-2">
        {success ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {isLoading ? 'Speichere...' : success ? 'Gespeichert' : 'Speichern'}
      </button>
    </div>
  );
}
