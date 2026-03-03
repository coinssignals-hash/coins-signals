import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Target, ShieldAlert } from 'lucide-react';

interface TargetProgressBarProps {
  entryPrice: number;
  takeProfit: number;
  takeProfit2?: number;
  takeProfit3?: number;
  stopLoss: number;
  currentPrice: number | null;
  action: 'BUY' | 'SELL';
  isCompleted?: boolean;
  closedResult?: 'tp_hit' | 'sl_hit' | string;
  closedPrice?: number;
  /** compact = smaller version for SignalCardCompact */
  compact?: boolean;
}

type PriceZone = 'tp' | 'entry' | 'sl';

/**
 * Horizontal progress bar:
 *   LEFT  = Stop Loss (red)
 *   CENTER = Entry Price (white marker, always 50%)
 *   RIGHT = Take Profit (green)
 *
 * The current price dot floats along the bar showing real-time position.
 * Works identically for BUY and SELL — the mapping handles direction internally.
 */
export function TargetProgressBar({
  entryPrice,
  takeProfit,
  takeProfit2,
  takeProfit3,
  stopLoss,
  currentPrice,
  action,
  isCompleted = false,
  closedResult,
  closedPrice,
  compact = false,
}: TargetProgressBarProps) {
  const prevZoneRef = useRef<PriceZone | null>(null);
  const [pulse, setPulse] = useState(false);
  const [pulseColor, setPulseColor] = useState('');
  const [crossed, setCrossed] = useState<'profit' | 'loss' | null>(null);

  const displayPrice = isCompleted && closedPrice ? closedPrice : currentPrice;
  const isBuy = action === 'BUY';
  const maxTP = takeProfit3 ?? takeProfit2 ?? takeProfit;

  // Distances from entry
  const distEntrySL = Math.abs(entryPrice - stopLoss);
  const distEntryTP = Math.abs(maxTP - entryPrice);
  const distEntryTP1 = Math.abs(takeProfit - entryPrice);
  const hasRange = distEntrySL > 0 || distEntryTP > 0;

  const isJpy = takeProfit.toString().split('.')[1]?.length <= 2 || Math.abs(takeProfit) > 50;
  const pipMultiplier = isJpy ? 100 : 10000;

  // --- Position mapping: SL=0%, Entry=50%, TP=100% ---
  // "Toward TP" always maps rightward, "Toward SL" always maps leftward
  const toPos = (price: number) => {
    const diff = price - entryPrice; // positive = price above entry, negative = below
    const towardTP = isBuy ? diff : -diff; // positive = moving toward TP

    if (towardTP >= 0) {
      // TP side → 50% to 100%
      return distEntryTP > 0 ? 50 + (towardTP / distEntryTP) * 50 : 50;
    }
    // SL side → 0% to 50%
    return distEntrySL > 0 ? 50 + (towardTP / distEntrySL) * 50 : 50;
  };

  let position = 50;
  let tp1Pos = 100;
  let tp2Pos: number | null = null;
  let tp3Pos: number | null = null;

  if (hasRange) {
    tp1Pos = Math.max(0, Math.min(100, distEntryTP > 0
      ? 50 + (distEntryTP1 / distEntryTP) * 50
      : 100));
    if (takeProfit2) {
      const d = Math.abs(takeProfit2 - entryPrice);
      tp2Pos = Math.max(0, Math.min(100, distEntryTP > 0 ? 50 + (d / distEntryTP) * 50 : 100));
    }
    if (takeProfit3) {
      tp3Pos = 100; // maxTP is always at 100%
    }
  }

  let isAboveEntry = false;
  let nearEntry = true;
  let progressColor = 'hsl(45, 80%, 55%)';
  let pipsFromEntry = 0;
  let targetLabel = 'ENTRY';
  let targetPercent = 0;

  const hasLivePrice = displayPrice !== null && Number.isFinite(displayPrice) && hasRange;

  if (hasLivePrice) {
    position = Math.max(0, Math.min(100, toPos(displayPrice)));
    isAboveEntry = position > 50;
    nearEntry = Math.abs(position - 50) < 5;
    progressColor = nearEntry
      ? 'hsl(45, 80%, 55%)'
      : isAboveEntry
        ? 'hsl(142, 70%, 50%)'
        : 'hsl(0, 70%, 55%)';

    pipsFromEntry = Math.abs((displayPrice - entryPrice) * pipMultiplier);

    if (isAboveEntry || nearEntry) {
      const distCurTP = Math.abs(isBuy ? takeProfit - displayPrice : displayPrice - takeProfit);
      const totalToTP = distEntryTP1;
      targetPercent = totalToTP > 0 ? Math.min(100, ((totalToTP - distCurTP) / totalToTP) * 100) : 0;
      targetLabel = 'TP1';
    } else {
      const distCurSL = Math.abs(isBuy ? displayPrice - stopLoss : stopLoss - displayPrice);
      targetPercent = distEntrySL > 0 ? Math.min(100, ((distEntrySL - distCurSL) / distEntrySL) * 100) : 0;
      targetLabel = 'SL';
    }
  }

  const currentZone: PriceZone = !hasLivePrice ? 'entry' : nearEntry ? 'entry' : isAboveEntry ? 'tp' : 'sl';

  // Zone-change pulse animation
  useEffect(() => {
    if (!hasLivePrice || isCompleted) return;
    if (prevZoneRef.current !== null && prevZoneRef.current !== currentZone) {
      const color = currentZone === 'tp'
        ? 'hsl(142, 70%, 50%)'
        : currentZone === 'sl'
          ? 'hsl(0, 70%, 55%)'
          : 'hsl(45, 80%, 55%)';
      setPulseColor(color);
      setPulse(true);

      const wasLosing = prevZoneRef.current === 'sl';
      const wasWinning = prevZoneRef.current === 'tp';
      if (currentZone === 'tp' && (wasLosing || prevZoneRef.current === 'entry')) setCrossed('profit');
      else if (currentZone === 'sl' && (wasWinning || prevZoneRef.current === 'entry')) setCrossed('loss');

      const timer = setTimeout(() => { setPulse(false); setCrossed(null); }, 1400);
      return () => clearTimeout(timer);
    }
    prevZoneRef.current = currentZone;
  }, [currentZone, hasLivePrice, isCompleted]);

  useEffect(() => { prevZoneRef.current = currentZone; }, [currentZone]);

  if (!hasRange) return null;

  // ─── Fill bar: from left edge up to price position ───
  // Left half is SL zone (red), right half is TP zone (green)
  const fillGradient = position <= 50
    ? `linear-gradient(90deg, hsl(0, 70%, 45%) 0%, ${progressColor} 100%)`
    : `linear-gradient(90deg, hsl(0, 70%, 45%) 0%, hsl(45, 80%, 55%) 50%, ${progressColor} 100%)`;

  // ─── COMPACT version ───
  if (compact) {
    return (
      <div className={cn("w-full px-4 pb-2 transition-all duration-300", pulse && "animate-[zone-bar-pulse_1.2s_ease-out]")}>
        <div className="relative h-1.5 rounded-full bg-slate-800/80">
          {crossed && (
            <div
              className="absolute inset-0 rounded-full z-20 animate-[zone-cross-flash_1.4s_ease-out_forwards]"
              style={{ background: crossed === 'profit'
                ? 'linear-gradient(90deg, transparent 30%, hsla(142, 70%, 50%, 0.5) 100%)'
                : 'linear-gradient(90deg, hsla(0, 70%, 55%, 0.5) 0%, transparent 70%)'
              }}
            />
          )}
          {/* Entry center marker */}
          <div className={cn("absolute top-0 bottom-0 w-px z-10 transition-all duration-500", crossed ? "bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "bg-white/40")} style={{ left: '50%' }} />
          {/* Fill */}
          <div
            className={cn("absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ease-out", pulse && "animate-[bar-glow_1.2s_ease-out]")}
            style={{ width: `${position}%`, background: fillGradient, ...(pulse ? { boxShadow: `0 0 12px ${pulseColor}` } : {}) }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-rose-400/70 font-mono">SL</span>
          <span className={cn(
            "text-[8px] font-bold font-mono transition-all duration-300",
            nearEntry ? "text-yellow-400" : isAboveEntry ? "text-emerald-400" : "text-rose-400",
            pulse && "scale-110"
          )}>
            {targetLabel} {targetPercent.toFixed(0)}% · {pipsFromEntry.toFixed(1)}p
          </span>
          <span className="text-[8px] text-emerald-400/70 font-mono">TP</span>
        </div>
      </div>
    );
  }

  // ─── FULL version ───
  return (
    <div className={cn("mx-4 mb-3 mt-1 transition-all duration-300", pulse && "animate-[zone-bar-pulse_1.2s_ease-out]")}>
      {/* Top labels: SL — status — TP */}
      <div className="flex items-center justify-between mb-1.5">
        <div className={cn("flex items-center gap-1 transition-all duration-500", pulse && currentZone === 'sl' && "scale-110")}>
          <ShieldAlert className={cn("w-3 h-3 text-rose-400 transition-all", pulse && currentZone === 'sl' && "animate-[icon-shake_0.5s_ease-out]")} />
          <span className="text-[10px] text-rose-400 font-semibold">SL</span>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-500",
          isCompleted && closedResult === 'tp_hit' ? "bg-emerald-500/20 text-emerald-400"
            : isCompleted && closedResult === 'sl_hit' ? "bg-rose-500/20 text-rose-400"
              : nearEntry ? "bg-yellow-500/15 text-yellow-400"
                : isAboveEntry ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400",
          pulse && "scale-110 shadow-lg"
        )}
          style={pulse ? { boxShadow: `0 0 16px ${pulseColor}50` } : {}}
        >
          {isCompleted
            ? closedResult === 'tp_hit' ? '✅ TP Alcanzado' : closedResult === 'sl_hit' ? '❌ SL Alcanzado' : '⏱ Expirada'
            : `${targetLabel} ${targetPercent.toFixed(0)}% · ${pipsFromEntry.toFixed(1)} pips`
          }
        </div>
        <div className={cn("flex items-center gap-1 transition-all duration-500", pulse && currentZone === 'tp' && "scale-110")}>
          <span className="text-[10px] text-emerald-400 font-semibold">TP</span>
          <Target className={cn("w-3 h-3 text-emerald-400 transition-all", pulse && currentZone === 'tp' && "animate-[icon-shake_0.5s_ease-out]")} />
        </div>
      </div>

      {/* Bar track */}
      <div
        className="relative h-2 rounded-full"
        style={{ background: 'linear-gradient(90deg, hsla(0, 70%, 25%, 0.4) 0%, hsla(210, 30%, 15%, 0.6) 50%, hsla(142, 70%, 25%, 0.4) 100%)' }}
      >
        {/* Zone-cross flash */}
        {crossed && (
          <div
            className="absolute inset-0 rounded-full z-30 animate-[zone-cross-flash_1.4s_ease-out_forwards]"
            style={{ background: crossed === 'profit'
              ? 'linear-gradient(90deg, transparent 30%, hsla(142, 70%, 50%, 0.4) 100%)'
              : 'linear-gradient(90deg, hsla(0, 70%, 55%, 0.4) 0%, transparent 70%)'
            }}
          />
        )}

        {/* Entry center marker */}
        <div
          className={cn("absolute top-0 bottom-0 w-0.5 z-10 transition-all duration-500", crossed ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]" : "bg-white/50")}
          style={{ left: '50%' }}
        />

        {/* TP1 marker (when there are multiple TPs) */}
        {(takeProfit2 || takeProfit3) && (
          <div className="absolute top-0 bottom-0 w-px bg-emerald-400/40 z-10" style={{ left: `${tp1Pos}%` }} />
        )}
        {/* TP2 marker */}
        {tp2Pos !== null && (
          <div className="absolute top-0 bottom-0 w-px bg-emerald-400/30 z-10" style={{ left: `${tp2Pos}%` }} />
        )}
        {/* TP3 marker */}
        {tp3Pos !== null && (
          <div className="absolute top-0 bottom-0 w-px bg-emerald-400/20 z-10" style={{ left: `${tp3Pos}%` }} />
        )}

        {/* Current price dot + floating label */}
        <div
          className={cn("absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-700 ease-out", pulse && "animate-[dot-pulse_1.2s_ease-out]")}
          style={{ left: `${position}%`, transform: 'translateX(-50%) translateY(-50%)' }}
        >
          {hasLivePrice && (
            <div className={cn(
              "absolute -top-4 whitespace-nowrap px-1 py-px rounded text-[8px] font-bold font-mono tabular-nums",
              nearEntry ? "bg-yellow-500/20 text-yellow-400" : isAboveEntry ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
            )}>
              {displayPrice!.toFixed(isJpy ? 2 : 3)}
            </div>
          )}
          <div
            className="w-3 h-3 rounded-full border-2 border-white/80 shadow-lg"
            style={{
              backgroundColor: progressColor,
              boxShadow: pulse ? `0 0 16px ${pulseColor}, 0 0 32px ${pulseColor}50` : `0 0 8px ${progressColor}`,
            }}
          />
        </div>

        {/* Fill from left to price position */}
        <div
          className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ease-out opacity-60"
          style={{ width: `${position}%`, background: fillGradient }}
        />

        {/* Pulse ripple */}
        {pulse && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full z-15 animate-[ripple-expand_1s_ease-out_forwards]"
            style={{ left: `${position}%`, transform: 'translateX(-50%) translateY(-50%)', background: `radial-gradient(circle, ${pulseColor}60 0%, transparent 70%)` }}
          />
        )}
      </div>

      {/* Bottom price labels */}
      <div className="relative mt-1 h-3">
        <span className="absolute left-0 text-[9px] text-rose-400/60 font-mono tabular-nums">
          {stopLoss.toFixed(isJpy ? 2 : 3)}
        </span>
        <span className="absolute text-[9px] text-white/40 font-mono tabular-nums -translate-x-1/2" style={{ left: '50%' }}>
          {entryPrice.toFixed(isJpy ? 2 : 3)}
        </span>
        {/* TP1 label */}
        <span className="absolute text-[9px] text-emerald-400/60 font-mono tabular-nums -translate-x-1/2" style={{ left: `${tp1Pos}%` }}>
          {takeProfit.toFixed(isJpy ? 2 : 3)}
        </span>
        {takeProfit2 && tp2Pos !== null && (
          <span className="absolute text-[9px] text-emerald-400/40 font-mono tabular-nums -translate-x-1/2" style={{ left: `${tp2Pos}%` }}>
            TP2
          </span>
        )}
        {takeProfit3 && tp3Pos !== null && (
          <span className="absolute right-0 text-[9px] text-emerald-400/30 font-mono tabular-nums">
            TP3
          </span>
        )}
      </div>
    </div>
  );
}
