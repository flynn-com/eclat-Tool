import { ListSkeleton } from '@/components/ui/loading-skeleton';

export default function Loading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-8 rounded w-48 mb-2 animate-pulse" style={{ background: 'var(--neu-surface)' }} />
        <div className="h-4 rounded w-32 animate-pulse" style={{ background: 'var(--neu-surface)' }} />
      </div>
      <div className="neu-raised p-4 h-20 animate-pulse" />
      <ListSkeleton count={3} />
    </div>
  );
}
