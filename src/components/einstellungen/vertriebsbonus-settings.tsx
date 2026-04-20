'use client';

import { useState } from 'react';
import { Save, Check, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Staffel } from '@/lib/settings';

interface Props {
  initial: Staffel[];
}

export function VertriebsbonusSettings({ initial }: Props) {
  const [staffeln, setStaffeln] = useState<Staffel[]>(initial);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateStaffel = (index: number, field: keyof Staffel, value: string) => {
    const neu = [...staffeln];
    neu[index] = { ...neu[index], [field]: parseFloat(value) || 0 };
    setStaffeln(neu);
  };

  const addStaffel = () => {
    const letzte = staffeln[staffeln.length - 1];
    setStaffeln([...staffeln, { von: letzte?.bis ?? 0, bis: (letzte?.bis ?? 0) + 10000, prozent: 1 }]);
  };

  const removeStaffel = (index: number) => {
    if (staffeln.length <= 1) return;
    setStaffeln(staffeln.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    for (let i = 0; i < staffeln.length; i++) {
      const s = staffeln[i];
      if (s.bis <= s.von) {
        setError(`Staffel ${i + 1}: "Bis" muss groesser als "Von" sein`);
        return;
      }
      if (s.prozent <= 0 || s.prozent > 100) {
        setError(`Staffel ${i + 1}: Prozent muss zwischen 0 und 100 liegen`);
        return;
      }
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from('app_settings')
      .upsert({ key: 'vertrieb_staffeln', value: staffeln, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (saveError) {
      setError('Fehler beim Speichern: ' + saveError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vertriebsbonus-Staffeln</h3>
      <p className="text-sm text-gray-500 mb-4">
        Definiere die Umsatz-Staffeln und den jeweiligen Bonus-Prozentsatz.
      </p>

      <div className="space-y-3">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-3 text-xs font-medium text-gray-500 uppercase px-1">
          <span>Von (Euro)</span>
          <span>Bis (Euro)</span>
          <span>Bonus (%)</span>
          <span className="w-9" />
        </div>

        {staffeln.map((s, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
            <div>
              <label className="sm:hidden text-xs text-gray-500">Von (Euro)</label>
              <input
                type="number"
                value={s.von}
                onChange={(e) => updateStaffel(i, 'von', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="sm:hidden text-xs text-gray-500">Bis (Euro)</label>
              <input
                type="number"
                value={s.bis}
                onChange={(e) => updateStaffel(i, 'bis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="sm:hidden text-xs text-gray-500">Bonus (%)</label>
              <input
                type="number"
                step="0.5"
                value={s.prozent}
                onChange={(e) => updateStaffel(i, 'prozent', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            {staffeln.length > 1 && (
              <button
                onClick={() => removeStaffel(i)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors self-end sm:self-center"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addStaffel}
        className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <Plus className="h-4 w-4" /> Staffel hinzufuegen
      </button>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <button
        onClick={handleSave}
        disabled={isLoading}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {success ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {isLoading ? 'Speichere...' : success ? 'Gespeichert' : 'Speichern'}
      </button>
    </div>
  );
}
