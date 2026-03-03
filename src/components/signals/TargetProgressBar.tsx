import { cn } from '@/lib/utils';
import { Target, ShieldAlert } from 'lucide-react';

interface TargetProgressBarProps {
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  currentPrice: number | null;
  action: 'BUY' | 'SELL';
  isCompleted?: boolean;
  closedResult?: 'tp_hit' | 'sl_hit' | string;
  closedPrice?: number;
  /** compact = smaller version for SignalCardCompact */
  compact?: boolean;
}

/**
 * Horizontal progress bar showing where the current price sits
 * between Stop Loss (left/red) and Take Profit (right/green).
 * Entry price is the center reference point.
 *
 * Once the signal is completed, it freezes showing the final state.
 */
export function TargetProgressBar({
  entryPrice,
  takeProfit,
  stopLoss,
  currentPrice,
  action,
  isCompleted = false,
  closedResult,
  closedPrice,
  compact = false,
}: TargetProgressBarProps) {
  // Use closed price if completed, otherwise current price
  const displayPrice = isCompleted && closedPrice ? closedPrice : currentPrice;
  if (!displayPrice) return null;

  const isBuy = action === 'BUY';

  // Calculate position as percentage (0% = SL, 50% = Entry, 100% = TP)
  const totalRange = Math.abs(takeProfit - stopLoss);
  if (totalRange === 0) return null;

  let position: number;
  if (isBuy) {
    // BUY: SL is below entry, TP is above
    position = ((displayPrice - stopLoss) / totalRange) * 100;
  } else {
    // SELL: SL is above entry, TP is below — invert
    position = ((stopLoss - displayPrice) / totalRange) * 100;
  }
  position = Math.max(0, Math.min(100, position));

  // Entry position on the bar
  let entryPosition: number;
  if (isBuy) {
    entryPosition = ((entryPrice - stopLoss) / totalRange) * 100;
  } else {
    entryPosition = ((stopLoss - entryPrice) / totalRange) * 100;
  }

  // Determine zone color
  const isAboveEntry = position > entryPosition;
  const nearEntry = Math.abs(position - entryPosition) < 5;
  const progressColor = nearEntry
    ? 'hsl(45, 80%, 55%)'
    : isAboveEntry
      ? 'hsl(142, 70%, 50%)'
      : 'hsl(0, 70%, 55%)';

  // Pips from entry
  const isJpy = takeProfit.toString().split('.')[1]?.length <= 2 ||
    Math.abs(takeProfit) > 50;
  const pipMultiplier = isJpy ? 100 : 10000;
  const pipsFromEntry = Math.abs((displayPrice - entryPrice) * pipMultiplier);

  // Percentage to TP or SL
  let targetLabel: string;
  let targetPercent: number;
  if (isAboveEntry || nearEntry) {
    // Heading towards TP
    const distToTP = isBuy
      ? Math.abs(takeProfit - displayPrice)
      : Math.abs(displayPrice - takeProfit);
    const totalToTP = isBuy
      ? Math.abs(takeProfit - entryPrice)
      : Math.abs(entryPrice - takeProfit);
    targetPercent = totalToTP > 0 ? Math.min(100, ((totalToTP - distToTP) / totalToTP) * 100) : 0;
    targetLabel = 'TP1';
  } else {
    // Heading towards SL
    const distToSL = isBuy
      ? Math.abs(displayPrice - stopLoss)
      : Math.abs(stopLoss - displayPrice);
    const totalToSL = isBuy
      ? Math.abs(entryPrice - stopLoss)
      : Math.abs(stopLoss - entryPrice);
    targetPercent = totalToSL > 0 ? Math.min(100, ((totalToSL - distToSL) / totalToSL) * 100) : 0;
    targetLabel = 'SL';
  }

  if (compact) {
    return (
      <div className="w-full px-4 pb-2">
        <div className="relative h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
          {/* Entry marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-white/40 z-10"
            style={{ left: `${entryPosition}%` }}
          />
          {/* Progress fill */}
          <div
            className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${position}%`,
              background: `linear-gradient(90deg, hsl(0, 70%, 55%) 0%, ${progressColor} 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-rose-400/70 font-mono">SL</span>
          <span className={cn(
            "text-[8px] font-bold font-mono",
            nearEntry ? "text-yellow-400" : isAboveEntry ? "text-emerald-400" : "text-rose-400"
          )}>
            {targetLabel} {targetPercent.toFixed(0)}% · {pipsFromEntry.toFixed(1)}p
          </span>
          <span className="text-[8px] text-emerald-400/70 font-mono">TP</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3">
      {/* Labels */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span className="text-[10px] text-rose-400 font-semibold">SL</span>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
          isCompleted && closedResult === 'tp_hit'
            ? "bg-emerald-500/20 text-emerald-400"
            : isCompleted && closedResult === 'sl_hit'
              ? "bg-rose-500/20 text-rose-400"
              : nearEntry
                ? "bg-yellow-500/15 text-yellow-400"
                : isAboveEntry
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
        )}>
          {isCompleted
            ? closedResult === 'tp_hit' ? '✅ TP Alcanzado' : closedResult === 'sl_hit' ? '❌ SL Alcanzado' : '⏱ Expirada'
            : `${targetLabel} ${targetPercent.toFixed(0)}% · ${pipsFromEntry.toFixed(1)} pips`
          }
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-emerald-400 font-semibold">TP</span>
          <Target className="w-3 h-3 text-emerald-400" />
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-2 rounded-full overflow-hidden"
        style={{ background: 'linear-gradient(90deg, hsla(0, 70%, 25%, 0.4) 0%, hsla(210, 30%, 15%, 0.6) 50%, hsla(142, 70%, 25%, 0.4) 100%)' }}
      >
        {/* Entry marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
          style={{ left: `${entryPosition}%` }}
        />
        {/* Price position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-20 border-2 border-white/80 transition-all duration-700 ease-out shadow-lg"
          style={{
            left: `${position}%`,
            transform: `translateX(-50%) translateY(-50%)`,
            backgroundColor: progressColor,
            boxShadow: `0 0 8px ${progressColor}`,
          }}
        />
        {/* Fill from SL side to price position */}
        <div
          className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ease-out opacity-60"
          style={{
            width: `${position}%`,
            background: `linear-gradient(90deg, hsl(0, 70%, 45%) 0%, ${progressColor} 100%)`,
          }}
        />
      </div>

      {/* Price labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-rose-400/60 font-mono tabular-nums">
          {stopLoss.toFixed(isJpy ? 2 : 3)}
        </span>
        <span className="text-[9px] text-white/40 font-mono tabular-nums">
          {entryPrice.toFixed(isJpy ? 2 : 3)}
        </span>
        <span className="text-[9px] text-emerald-400/60 font-mono tabular-nums">
          {takeProfit.toFixed(isJpy ? 2 : 3)}
        </span>
      </div>
    </div>
  );
}
