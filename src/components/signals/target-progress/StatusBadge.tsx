import { cn, formatPrice } from '@/lib/utils';
import type { ProgressBarState, PulseState } from './types';

interface StatusBadgeProps {
  state: ProgressBarState;
  pulse: PulseState;
  isCompleted: boolean;
  closedResult?: 'tp_hit' | 'sl_hit' | string;
}

export function StatusBadge({ state, pulse: p, isCompleted, closedResult }: StatusBadgeProps) {
  const { nearEntry, isAboveEntry, targetLabel, targetPercent, pipsFromEntry, displayPrice, isJpy, isActivated } = state;
  const { pulse, pulseColor } = p;
  const sym = isJpy ? 'JPY' : 'EUR/USD';

  // Not activated yet — show pending badge
  if (!isActivated && !isCompleted) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full font-bold mt-1 text-[10px] sm:text-xs bg-white/10 text-white/50 whitespace-nowrap">
        ⏳ Pendiente
      </div>
    );
  }

  const icon = isCompleted
    ? closedResult === 'tp_hit' ? '✅' : closedResult === 'sl_hit' ? '❌' : '⏱'
    : '';

  const priceStr = isCompleted && displayPrice != null ? ` @ ${formatPrice(displayPrice, sym)}` : '';

  const statusText = isCompleted
    ? `${icon} ${targetLabel} ${targetPercent.toFixed(0)}% · ${pipsFromEntry.toFixed(1)}p${priceStr}`
    : `${targetLabel} ${targetPercent.toFixed(0)}% · ${pipsFromEntry.toFixed(1)}p`;

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-full font-bold mt-1 transition-all duration-500 whitespace-nowrap",
        isCompleted ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm",
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
