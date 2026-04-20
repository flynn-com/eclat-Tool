import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from('projects').select('phase').eq('id', id).single();

  // Redirect to the current phase tab
  const phaseMap: Record<string, string> = {
    planung: 'vorplanung',
    produktion: 'produktion',
    postproduktion: 'postproduktion',
    review: 'postproduktion',
    abgeschlossen: 'postproduktion',
  };

  const tab = phaseMap[project?.phase ?? 'planung'] ?? 'vorplanung';
  redirect(`/projekte/${id}/${tab}`);
}
