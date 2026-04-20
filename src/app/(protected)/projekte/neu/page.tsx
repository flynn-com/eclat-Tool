import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreateProjectForm } from '@/components/projekte/create-project-form';

export default async function NeuesProjektPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/projekte');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Neues Projekt</h1>
        <p className="text-gray-500 mt-1">Erstelle ein neues Projekt</p>
      </div>
      <CreateProjectForm />
    </div>
  );
}
