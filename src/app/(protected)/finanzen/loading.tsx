import { GridSkeleton } from '@/components/ui/loading-skeleton';

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 rounded w-32 mb-2 animate-pulse" style={{ background: 'var(--neu-surface)' }} />
        <div className="h-4 rounded w-48 animate-pulse" style={{ background: 'var(--neu-surface)' }} />
      </div>
      <GridSkeleton count={3} />
    </div>
  );
}
