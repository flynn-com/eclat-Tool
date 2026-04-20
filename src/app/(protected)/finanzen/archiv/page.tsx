import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ArchivListe } from '@/components/finanzen/archiv-liste';

export default async function ArchivPage() {
  const supabase = await createClient();

  const { data: verteilungen } = await supabase
    .from('gewinnverteilungen')
    .select('*, profiles:erstellt_von(full_name)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <Link href="/finanzen" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="h-4 w-4" /> Zurueck zu Finanzen
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Gewinnverteilungs-Archiv</h1>
        <p className="text-gray-500 mt-1">Alle abgeschlossenen Gewinnverteilungen</p>
      </div>
      <ArchivListe verteilungen={verteilungen ?? []} />
    </div>
  );
}
