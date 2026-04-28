import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreateProjectForm } from '@/components/projekte/create-project-form';

export default async function NeuesProjektPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: kunden }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user!.id).maybeSingle(),
    supabase.from('kunden').select('id, firma').neq('status', 'inaktiv').order('firma'),
  ]);

  if (profile?.role !== 'admin') {
    redirect('/projekte');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--neu-text)' }}>Neues Projekt</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>Erstelle ein neues Projekt</p>
      </div>
      <CreateProjectForm kunden={kunden ?? []} />
    </div>
  );
}
