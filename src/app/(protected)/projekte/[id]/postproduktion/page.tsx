import { createClient } from '@/lib/supabase/server';
import { TaskBoard } from '@/components/projekte/task-board';
import { POST_PRODUCTION_CATEGORIES } from '@/lib/constants';

export default async function PostProduktionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: tasks },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('project_tasks').select('*').eq('project_id', id).eq('phase', 'postproduktion').order('sort_order'),
    supabase.from('profiles').select('id, full_name').order('full_name'),
  ]);

  const allTasks = tasks ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {POST_PRODUCTION_CATEGORIES.map((cat) => (
        <TaskBoard
          key={cat.key}
          projectId={id}
          phase="postproduktion"
          category={cat.key}
          tasks={allTasks.filter((t) => t.category === cat.key)}
          title={cat.label}
          profiles={profiles ?? []}
        />
      ))}
    </div>
  );
}
