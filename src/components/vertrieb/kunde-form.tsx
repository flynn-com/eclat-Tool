'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createKunde, updateKunde } from '@/app/(protected)/vertrieb/actions';
import { Kunde } from '@/lib/types';

interface Props {
  kunde?: Kunde;
}

export function KundeForm({ kunde }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    if (kunde) {
      const result = await updateKunde(kunde.id, formData);
      if (result.error) { setError(result.error); setIsLoading(false); return; }
      router.push('/vertrieb/kunden');
    } else {
      const result = await createKunde(formData);
      if (result.error) { setError(result.error); setIsLoading(false); return; }
      router.push('/vertrieb/kunden');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      {/* Stammdaten */}
      <div className="neu-raised p-5 space-y-4">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Stammdaten</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Firma *</label>
            <input name="firma" type="text" required defaultValue={kunde?.firma ?? ''} className="neu-input w-full text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Ansprechpartner</label>
            <input name="ansprechpartner" type="text" defaultValue={kunde?.ansprechpartner ?? ''} className="neu-input w-full text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>E-Mail</label>
            <input name="email" type="email" defaultValue={kunde?.email ?? ''} className="neu-input w-full text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Telefon</label>
            <input name="telefon" type="tel" defaultValue={kunde?.telefon ?? ''} className="neu-input w-full text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Webseite</label>
            <input name="webseite" type="url" defaultValue={kunde?.webseite ?? ''} placeholder="https://" className="neu-input w-full text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Branche</label>
            <input name="branche" type="text" defaultValue={kunde?.branche ?? ''} className="neu-input w-full text-sm" />
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="neu-raised p-5 space-y-4">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Adresse</h3>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Strasse + Nr.</label>
          <input name="strasse" type="text" defaultValue={kunde?.strasse ?? ''} className="neu-input w-full text-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>PLZ</label>
            <input name="plz" type="text" defaultValue={kunde?.plz ?? ''} className="neu-input w-full text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Stadt</label>
            <input name="stadt" type="text" defaultValue={kunde?.stadt ?? ''} className="neu-input w-full text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Land</label>
            <input name="land" type="text" defaultValue={kunde?.land ?? 'Deutschland'} className="neu-input w-full text-sm" />
          </div>
        </div>
      </div>

      {/* Sonstiges */}
      <div className="neu-raised p-5 space-y-4">
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Sonstiges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>USt-ID</label>
            <input name="ust_id" type="text" defaultValue={kunde?.ust_id ?? ''} className="neu-input w-full text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Status</label>
            <select name="status" defaultValue={kunde?.status ?? 'aktiv'} className="neu-input w-full text-sm">
              <option value="lead">Lead (Interessent)</option>
              <option value="aktiv">Aktiv</option>
              <option value="inaktiv">Inaktiv</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--neu-text-secondary)' }}>Notizen</label>
          <textarea name="notizen" defaultValue={kunde?.notizen ?? ''} rows={4} className="neu-input w-full text-sm resize-none" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isLoading} className="neu-btn-primary px-5 py-2.5 text-sm disabled:opacity-50">
          {isLoading ? 'Speichere...' : kunde ? 'Speichern' : 'Kunde erstellen'}
        </button>
        <button type="button" onClick={() => router.back()} className="neu-btn px-5 py-2.5 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}
