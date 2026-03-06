import { cn } from '@/lib/utils';
import type { ProgressBarState, PulseState } from './types';

interface StatusBadgeProps {
  state: ProgressBarState;
  pulse: PulseState;
  isCompleted: boolean;
  closedResult?: 'tp_hit' | 'sl_hit' | string;
}

export function StatusBadge({ state, pulse: p, isCompleted, closedResult }: StatusBadgeProps) {
  const { nearEntry, isAboveEntry, targetLabel, targetPercent, pipsFromEntry } = state;
  const { pulse, pulseColor } = p;

  const statusText = isCompleted
    ? closedResult === 'tp_hit' ? '✅ TP' : closedResult === 'sl_hit' ? '❌ SL' : '⏱ Exp'
    : `${targetLabel} ${targetPercent.toFixed(0)}% · ${pipsFromEntry.toFixed(1)}p`;

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold mt-1 transition-all duration-500",
        isCompleted && closedResult === 'tp_hit' ? "bg-emerald-500/20 text-emerald-400"
          : isCompleted && closedResult === 'sl_hit' ? "bg-rose-500/20 text-rose-400"
            : nearEntry ? "bg-yellow-500/15 text-yellow-400"
              : isAboveEntry ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400",
        pulse && "scale-110 shadow-lg"
      )}
      style={pulse ? { boxShadow: `0 0 12px ${pulseColor}50` } : {}}
    >
      {statusText}
    </div>
  );
}
