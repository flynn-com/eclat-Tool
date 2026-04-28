import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SharedNotes } from '@/components/meetings/shared-notes';
import { MeetingTaskList } from '@/components/meetings/meeting-task-list';
import { MeetingAgenda } from '@/components/meetings/meeting-agenda';
import { Meeting, MeetingTask, MeetingAgendaItem } from '@/lib/types';

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: meeting },
    { data: tasks },
    { data: agenda },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('meetings').select('*').eq('id', id).maybeSingle(),
    supabase.from('meeting_tasks').select('*').eq('meeting_id', id).order('created_at'),
    supabase.from('meeting_agenda').select('*').eq('meeting_id', id).order('created_at'),
    supabase.from('profiles').select('id, full_name').order('full_name'),
  ]);

  if (!meeting) redirect('/meetings');

  const m = meeting as Meeting;
  const datum = new Date(m.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <Link href="/meetings" className="inline-flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--neu-accent-mid)' }}>
        <ArrowLeft className="h-4 w-4" /> Alle Meetings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>{m.name}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>{datum}</p>
      </div>

      <div className="space-y-4">
        <MeetingAgenda meetingId={id} initialItems={(agenda as MeetingAgendaItem[]) ?? []} />
        <SharedNotes meetingId={id} initialNotes={m.shared_notes ?? ''} />
        <MeetingTaskList meetingId={id} tasks={(tasks as MeetingTask[]) ?? []} profiles={profiles ?? []} />
      </div>
    </div>
  );
}
