import { cn } from '@/lib/utils';
import { Target, ShieldAlert } from 'lucide-react';
import { useProgressBarState } from './target-progress/useProgressBarState';
import { BarTrack } from './target-progress/BarTrack';
import { PriceLabels } from './target-progress/PriceLabels';
import { CompactBar } from './target-progress/CompactBar';
import type { TargetProgressBarProps } from './target-progress/types';

// Re-export types for external consumers
export type { TargetProgressBarProps } from './target-progress/types';

/**
 * Horizontal progress bar:
 *   LEFT  = Stop Loss (red)
 *   CENTER = Entry Price (white marker, always 50%)
 *   RIGHT = Take Profit (green)
 *
 * The current price dot floats along the bar showing real-time position.
 * Works identically for BUY and SELL — the mapping handles direction internally.
 */
export function TargetProgressBar(props: TargetProgressBarProps) {
  const {
    entryPrice, takeProfit, takeProfit2, takeProfit3,
    stopLoss, isCompleted = false, closedResult, compact = false,
  } = props;

  const { state, pulse, hasRange } = useProgressBarState(props);

  if (!hasRange) return null;

  if (compact) {
    return <CompactBar state={state} pulse={pulse} />;
  }

  return (
    <div className={cn("mx-4 mb-3 mt-1 transition-all duration-300", pulse.pulse && "animate-[zone-bar-pulse_1.2s_ease-out]")}>
      {/* Top labels: SL — TP */}
      <div className="flex items-center justify-between mb-1.5">
        <div className={cn("flex items-center gap-1 transition-all duration-500", pulse.pulse && state.currentZone === 'sl' && "scale-110")}>
          <ShieldAlert className={cn("w-3 h-3 text-rose-400 transition-all", pulse.pulse && state.currentZone === 'sl' && "animate-[icon-shake_0.5s_ease-out]")} />
          <span className="text-[10px] text-rose-400 font-semibold">SL</span>
        </div>
        <div className={cn("flex items-center gap-1 transition-all duration-500", pulse.pulse && state.currentZone === 'tp' && "scale-110")}>
          <span className="text-[10px] text-emerald-400 font-semibold">TP</span>
          <Target className={cn("w-3 h-3 text-emerald-400 transition-all", pulse.pulse && state.currentZone === 'tp' && "animate-[icon-shake_0.5s_ease-out]")} />
        </div>
      </div>

      <BarTrack
        state={state}
        pulse={pulse}
        takeProfit2={takeProfit2}
        takeProfit3={takeProfit3}
      />

      <PriceLabels
        state={state}
        pulse={pulse}
        entryPrice={entryPrice}
        stopLoss={stopLoss}
        takeProfit={takeProfit}
        takeProfit2={takeProfit2}
        takeProfit3={takeProfit3}
        isCompleted={isCompleted}
        closedResult={closedResult}
      />
    </div>
  );
}
