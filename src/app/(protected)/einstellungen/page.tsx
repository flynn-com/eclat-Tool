import Link from 'next/link';
import { Clock, MessageCirclePlus, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MonatsabrechnungSettingsForm } from '@/components/einstellungen/monatsabrechnung-settings';
import { VertriebsbonusSettings } from '@/components/einstellungen/vertriebsbonus-settings';
import { ReportsList } from '@/components/einstellungen/reports-list';
import { TeamAvatars } from '@/components/einstellungen/team-avatars';
import {
  loadSettingsServer,
  DEFAULT_MONATSABRECHNUNG,
  DEFAULT_STAFFELN,
  type MonatsabrechnungSettings,
  type Staffel,
} from '@/lib/settings';
import { Report } from '@/lib/types';

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  const [maRaw, staffelnRaw, { data: reportsRaw }, { data: profilesRaw }] = await Promise.all([
    loadSettingsServer('monatsabrechnung'),
    loadSettingsServer('vertrieb_staffeln'),
    supabase
      .from('reports')
      .select('*, profiles:created_by(full_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .order('full_name'),
  ]);

  const maSettings: MonatsabrechnungSettings = maRaw ?? DEFAULT_MONATSABRECHNUNG;
  const staffeln: Staffel[] = staffelnRaw ?? DEFAULT_STAFFELN;
  const reports = (reportsRaw ?? []) as (Report & { profiles?: { full_name: string } | null })[];
  const offeneReports = reports.filter(r => r.status !== 'erledigt').length;
  const teamProfiles = (profilesRaw ?? []) as {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    avatar_url: string | null;
  }[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Einstellungen</h1>
        <p style={{ color: 'var(--neu-text-secondary)' }} className="mt-1 text-sm">App-Konfiguration und Rechner-Parameter</p>
      </div>
      <div className="space-y-6 max-w-2xl">

        {/* Team-Mitglieder / Profilbilder */}
        <div className="neu-raised p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="neu-raised-sm h-10 w-10 flex items-center justify-center" style={{ color: 'var(--neu-accent)' }}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--neu-text)' }}>Team-Mitglieder</h3>
              <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>Profilbilder hochladen · {teamProfiles.length} Personen</p>
            </div>
          </div>
          <TeamAvatars profiles={teamProfiles} />
        </div>

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

        {/* Reports */}
        <div className="neu-raised p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="neu-raised-sm h-10 w-10 flex items-center justify-center" style={{ color: 'var(--neu-accent)' }}>
              <MessageCirclePlus className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: 'var(--neu-text)' }}>Feedback & Reports</h3>
              <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                {offeneReports > 0 ? `${offeneReports} offen` : 'Alle erledigt'} · {reports.length} gesamt
              </p>
            </div>
          </div>
          <ReportsList reports={reports} />
        </div>
      </div>
    </div>
  );
}
