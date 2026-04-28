export function CardSkeleton() {
  return (
    <div className="neu-raised p-5 animate-pulse">
      <div className="h-4 rounded w-1/3 mb-3" style={{ background: 'var(--neu-surface)' }} />
      <div className="h-3 rounded w-2/3 mb-2" style={{ background: 'var(--neu-surface)' }} />
      <div className="h-3 rounded w-1/2" style={{ background: 'var(--neu-surface)' }} />
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}
