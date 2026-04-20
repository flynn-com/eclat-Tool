import { PHASE_LABELS, PHASE_COLORS } from '@/lib/constants';
import { ProjectPhase } from '@/lib/types';

export function PhaseBadge({ phase }: { phase: ProjectPhase }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: PHASE_COLORS[phase] ?? '#6E7F8D' }}
    >
      {PHASE_LABELS[phase] ?? phase}
    </span>
  );
}
