import Link from 'next/link';
import { Clock } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MonatsabrechnungSettingsForm } from '@/components/einstellungen/monatsabrechnung-settings';
import { VertriebsbonusSettings } from '@/components/einstellungen/vertriebsbonus-settings';
import {
  loadSettingsServer,
  DEFAULT_MONATSABRECHNUNG,
  DEFAULT_STAFFELN,
  type MonatsabrechnungSettings,
  type Staffel,
} from '@/lib/settings';

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  const maRaw = await loadSettingsServer('monatsabrechnung');
  const staffelnRaw = await loadSettingsServer('vertrieb_staffeln');

  const maSettings: MonatsabrechnungSettings = maRaw ?? DEFAULT_MONATSABRECHNUNG;
  const staffeln: Staffel[] = staffelnRaw ?? DEFAULT_STAFFELN;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Einstellungen</h1>
        <p style={{ color: 'var(--neu-text-secondary)' }} className="mt-1 text-sm">App-Konfiguration und Rechner-Parameter</p>
      </div>
      <div className="space-y-6 max-w-2xl">
        {/* Stundenkonten verwalten */}
        <Link href="/einstellungen/stundenkonten" className="neu-raised p-5 flex items-center gap-4 block transition-all hover:opacity-90">
          <div className="neu-raised-sm h-10 w-10 flex items-center justify-center" style={{ color: 'var(--neu-accent)' }}>
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--neu-text)' }}>Stundenkonten verwalten</h3>
            <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Stunden manuell bearbeiten, hinzufuegen oder loeschen</p>
          </div>
        </Link>

        <MonatsabrechnungSettingsForm initial={maSettings} />
        <VertriebsbonusSettings initial={staffeln} />
      </div>
    </div>
  );
}
