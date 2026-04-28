import { GridSkeleton } from '@/components/ui/loading-skeleton';

export default function Loading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 rounded w-32 mb-2 animate-pulse" style={{ background: 'var(--neu-surface)' }} />
          <div className="h-4 rounded w-48 animate-pulse" style={{ background: 'var(--neu-surface)' }} />
        </div>
      </div>
      <GridSkeleton count={6} />
    </div>
  );
}
