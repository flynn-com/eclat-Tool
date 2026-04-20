export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: 'var(--neu-text-secondary)' }}>Fortschritt</span>
        <span className="text-xs font-bold" style={{ color: 'var(--neu-text)' }}>{value} %</span>
      </div>
      <div className="neu-pressed h-3 w-full overflow-hidden">
        <div
          className="h-full rounded-xl transition-all duration-500"
          style={{ width: `${value}%`, background: value >= 100 ? '#10B981' : 'var(--neu-accent)' }}
        />
      </div>
    </div>
  );
}
