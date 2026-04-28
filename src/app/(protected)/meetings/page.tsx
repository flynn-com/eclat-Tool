import Link from 'next/link';
import { Calendar, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CreateMeetingButton } from '@/components/meetings/create-meeting-button';

export default async function MeetingsPage() {
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from('meetings')
    .select('id, name, date, created_at, profiles:created_by(full_name)')
    .order('date', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Meetings</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Live-Notizen & Aufgaben</p>
        </div>
        <CreateMeetingButton />
      </div>

      {(!meetings || meetings.length === 0) ? (
        <div className="neu-raised p-8 text-center" style={{ color: 'var(--neu-accent-mid)' }}>
          Noch keine Meetings angelegt
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {meetings.map((m) => {
            const erstellerObj = m.profiles as unknown as { full_name: string } | null;
            const ersteller = erstellerObj?.full_name ?? 'Unbekannt';
            return (
              <Link key={m.id} href={`/meetings/${m.id}`} className="neu-raised p-4 flex items-center gap-4 transition-all hover:opacity-90">
                <div className="neu-raised-sm h-10 w-10 flex items-center justify-center" style={{ color: 'var(--neu-accent)' }}>
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: 'var(--neu-text)' }}>{m.name}</p>
                  <p className="text-xs" style={{ color: 'var(--neu-text-secondary)' }}>
                    {new Date(m.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' • '}
                    von {ersteller}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
