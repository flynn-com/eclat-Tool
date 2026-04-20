import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProjectHeader } from '@/components/projekte/project-header';
import { ProjectPhaseTabs } from '@/components/projekte/project-phase-tabs';

export default async function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (!project) redirect('/projekte');

  return (
    <div>
      <Link href="/projekte" className="inline-flex items-center gap-1 text-sm mb-3 transition-colors" style={{ color: 'var(--neu-accent-mid)' }}>
        <ArrowLeft className="h-4 w-4" /> Alle Projekte
      </Link>
      <ProjectHeader project={project} />
      <ProjectPhaseTabs projectId={id} />
      {children}
    </div>
  );
}
