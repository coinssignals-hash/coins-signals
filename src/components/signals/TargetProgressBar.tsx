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
 * Horizontal progress bar showing where the current price sits
 * between Stop Loss (left/red) and Take Profit (right/green).
 * Entry price is the center reference point.
 *
 * Once the signal is completed, it freezes showing the final state.
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
  // Zone change pulse detection
  const prevZoneRef = useRef<PriceZone | null>(null);
  const [pulse, setPulse] = useState(false);
  const [pulseColor, setPulseColor] = useState<string>('');

  // Use closed price if completed, otherwise current price
  const displayPrice = isCompleted && closedPrice ? closedPrice : currentPrice;

  const isBuy = action === 'BUY';
  // Extend range to include TP2/TP3 if present
  const maxTP = takeProfit3 ?? takeProfit2 ?? takeProfit;
  const totalRange = isBuy
    ? Math.abs(maxTP - stopLoss)
    : Math.abs(stopLoss - maxTP);
  const hasRange = totalRange > 0;

  // Calculate position as percentage (0% = SL, 100% = max TP)
  let position = 0;
  let entryPosition = 0;
  let tp1Position = 0;
  let tp2Position: number | null = null;
  let tp3Position: number | null = null;
  let isAboveEntry = false;
  let nearEntry = true;
  let progressColor = 'hsl(45, 80%, 55%)';
  let isJpy = takeProfit.toString().split('.')[1]?.length <= 2 || Math.abs(takeProfit) > 50;
  let pipsFromEntry = 0;
  let targetLabel = 'ENTRY';
  let targetPercent = 0;

  const toPos = (price: number) => {
    if (isBuy) return ((price - stopLoss) / totalRange) * 100;
    // SELL: flip bar so TP is on left (0%), SL on right (100%)
    return ((price - maxTP) / totalRange) * 100;
  };

  if (hasRange) {
    entryPosition = Math.max(0, Math.min(100, toPos(entryPrice)));
    tp1Position = Math.max(0, Math.min(100, toPos(takeProfit)));
    if (takeProfit2) tp2Position = Math.max(0, Math.min(100, toPos(takeProfit2)));
    if (takeProfit3) tp3Position = Math.max(0, Math.min(100, toPos(takeProfit3)));
    position = entryPosition;
  }

  const hasLivePrice = displayPrice !== null && Number.isFinite(displayPrice) && hasRange;

  if (hasLivePrice) {
    position = Math.max(0, Math.min(100, toPos(displayPrice)));

    isAboveEntry = isBuy ? position > entryPosition : position < entryPosition;
    nearEntry = Math.abs(position - entryPosition) < 5;
    progressColor = nearEntry
      ? 'hsl(45, 80%, 55%)'
      : isAboveEntry
        ? 'hsl(142, 70%, 50%)'
        : 'hsl(0, 70%, 55%)';

    const pipMultiplier = isJpy ? 100 : 10000;
    pipsFromEntry = Math.abs((displayPrice - entryPrice) * pipMultiplier);

    if (isAboveEntry || nearEntry) {
      const distToTP = isBuy ? Math.abs(takeProfit - displayPrice) : Math.abs(displayPrice - takeProfit);
      const totalToTP = isBuy ? Math.abs(takeProfit - entryPrice) : Math.abs(entryPrice - takeProfit);
      targetPercent = totalToTP > 0 ? Math.min(100, ((totalToTP - distToTP) / totalToTP) * 100) : 0;
      targetLabel = 'TP1';
    } else {
      const distToSL = isBuy ? Math.abs(displayPrice - stopLoss) : Math.abs(stopLoss - displayPrice);
      const totalToSL = isBuy ? Math.abs(entryPrice - stopLoss) : Math.abs(stopLoss - entryPrice);
      targetPercent = totalToSL > 0 ? Math.min(100, ((totalToSL - distToSL) / totalToSL) * 100) : 0;
      targetLabel = 'SL';
    }
  }

  // Determine current zone
  const currentZone: PriceZone = !hasLivePrice ? 'entry' : nearEntry ? 'entry' : isAboveEntry ? 'tp' : 'sl';

  // Did we cross from loss to profit or vice-versa?
  const [crossed, setCrossed] = useState<'profit' | 'loss' | null>(null);

  // Detect zone transitions and trigger pulse animation
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

      // Detect profit ↔ loss crossing (entry is the boundary)
      const wasLosing = prevZoneRef.current === 'sl';
      const wasWinning = prevZoneRef.current === 'tp';
      if (currentZone === 'tp' && (wasLosing || prevZoneRef.current === 'entry')) {
        setCrossed('profit');
      } else if (currentZone === 'sl' && (wasWinning || prevZoneRef.current === 'entry')) {
        setCrossed('loss');
      }

      const timer = setTimeout(() => { setPulse(false); setCrossed(null); }, 1400);
      return () => clearTimeout(timer);
    }
    prevZoneRef.current = currentZone;
  }, [currentZone, hasLivePrice, isCompleted]);

  // Also update ref when zone doesn't change
  useEffect(() => {
    prevZoneRef.current = currentZone;
  }, [currentZone]);

  if (!hasRange) return null;

  if (compact) {
    return (
      <div className={cn("w-full px-4 pb-2 transition-all duration-300", pulse && "animate-[zone-bar-pulse_1.2s_ease-out]")}>
        <div className="relative h-1.5 rounded-full bg-slate-800/80">
          {/* Zone-cross flash overlay */}
          {crossed && (
            <div
              className="absolute inset-0 rounded-full z-20 animate-[zone-cross-flash_1.4s_ease-out_forwards]"
              style={{ background: crossed === 'profit'
                ? 'linear-gradient(90deg, transparent 30%, hsla(142, 70%, 50%, 0.5) 100%)'
                : 'linear-gradient(90deg, hsla(0, 70%, 55%, 0.5) 0%, transparent 70%)'
              }}
            />
          )}
          {/* Entry marker */}
          <div
            className={cn(
              "absolute top-0 bottom-0 w-px z-10 transition-all duration-500",
              crossed ? "bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "bg-white/40"
            )}
            style={{ left: `${entryPosition}%` }}
          />
          {/* Progress fill */}
          <div
            className={cn(
              "absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ease-out",
              pulse && "animate-[bar-glow_1.2s_ease-out]"
            )}
            style={{
              width: `${position}%`,
              background: `linear-gradient(90deg, ${isBuy ? 'hsl(0, 70%, 55%)' : 'hsl(142, 70%, 45%)'} 0%, ${progressColor} 100%)`,
              ...(pulse ? { boxShadow: `0 0 12px ${pulseColor}` } : {}),
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className={cn("text-[8px] font-mono", isBuy ? "text-rose-400/70" : "text-emerald-400/70")}>{isBuy ? 'SL' : 'TP'}</span>
          <span className={cn(
            "text-[8px] font-bold font-mono transition-all duration-300",
            nearEntry ? "text-yellow-400" : isAboveEntry ? "text-emerald-400" : "text-rose-400",
            pulse && "scale-110"
          )}>
            {targetLabel} {targetPercent.toFixed(0)}% · {pipsFromEntry.toFixed(1)}p
          </span>
          <span className={cn("text-[8px] font-mono", isBuy ? "text-emerald-400/70" : "text-rose-400/70")}>{isBuy ? 'TP' : 'SL'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-4 mb-3 mt-1 transition-all duration-300", pulse && "animate-[zone-bar-pulse_1.2s_ease-out]")}>
      {/* Labels */}
      <div className="flex items-center justify-between mb-1.5">
        <div className={cn("flex items-center gap-1 transition-all duration-500", pulse && (isBuy ? currentZone === 'sl' : currentZone === 'tp') && "scale-110")}>
          {isBuy ? (
            <>
              <ShieldAlert className={cn("w-3 h-3 text-rose-400 transition-all", pulse && currentZone === 'sl' && "animate-[icon-shake_0.5s_ease-out]")} />
              <span className="text-[10px] text-rose-400 font-semibold">SL</span>
            </>
          ) : (
            <>
              <Target className={cn("w-3 h-3 text-emerald-400 transition-all", pulse && currentZone === 'tp' && "animate-[icon-shake_0.5s_ease-out]")} />
              <span className="text-[10px] text-emerald-400 font-semibold">TP</span>
            </>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-500",
          isCompleted && closedResult === 'tp_hit'
            ? "bg-emerald-500/20 text-emerald-400"
            : isCompleted && closedResult === 'sl_hit'
              ? "bg-rose-500/20 text-rose-400"
              : nearEntry
                ? "bg-yellow-500/15 text-yellow-400"
                : isAboveEntry
                  ? "bg-emerald-500/15 text-emerald-400"
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
        <div className={cn("flex items-center gap-1 transition-all duration-500", pulse && (isBuy ? currentZone === 'tp' : currentZone === 'sl') && "scale-110")}>
          {isBuy ? (
            <>
              <span className="text-[10px] text-emerald-400 font-semibold">TP</span>
              <Target className={cn("w-3 h-3 text-emerald-400 transition-all", pulse && currentZone === 'tp' && "animate-[icon-shake_0.5s_ease-out]")} />
            </>
          ) : (
            <>
              <span className="text-[10px] text-rose-400 font-semibold">SL</span>
              <ShieldAlert className={cn("w-3 h-3 text-rose-400 transition-all", pulse && currentZone === 'sl' && "animate-[icon-shake_0.5s_ease-out]")} />
            </>
          )}
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-2 rounded-full"
        style={{ background: isBuy
          ? 'linear-gradient(90deg, hsla(0, 70%, 25%, 0.4) 0%, hsla(210, 30%, 15%, 0.6) 50%, hsla(142, 70%, 25%, 0.4) 100%)'
          : 'linear-gradient(90deg, hsla(142, 70%, 25%, 0.4) 0%, hsla(210, 30%, 15%, 0.6) 50%, hsla(0, 70%, 25%, 0.4) 100%)'
        }}
      >
        {/* Zone-cross flash overlay */}
        {crossed && (
          <div
            className="absolute inset-0 rounded-full z-30 animate-[zone-cross-flash_1.4s_ease-out_forwards]"
            style={{ background: crossed === 'profit'
              ? 'linear-gradient(90deg, transparent 30%, hsla(142, 70%, 50%, 0.4) 100%)'
              : 'linear-gradient(90deg, hsla(0, 70%, 55%, 0.4) 0%, transparent 70%)'
            }}
          />
        )}
        {/* Entry marker */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-0.5 z-10 transition-all duration-500",
            crossed ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]" : "bg-white/50"
          )}
          style={{ left: `${entryPosition}%` }}
        />
        {/* TP1 marker */}
        {(takeProfit2 || takeProfit3) && (
          <div
            className="absolute top-0 bottom-0 w-px bg-emerald-400/40 z-10"
            style={{ left: `${tp1Position}%` }}
          />
        )}
        {/* TP2 marker */}
        {tp2Position !== null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-emerald-400/30 z-10"
            style={{ left: `${tp2Position}%` }}
          />
        )}
        {/* TP3 marker */}
        {tp3Position !== null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-emerald-400/20 z-10"
            style={{ left: `${tp3Position}%` }}
          />
        )}
        {/* Price position indicator (dot) with price label */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-700 ease-out",
            pulse && "animate-[dot-pulse_1.2s_ease-out]"
          )}
          style={{
            left: `${position}%`,
            transform: `translateX(-50%) translateY(-50%)`,
          }}
        >
          {/* Price label above the dot */}
          {hasLivePrice && (
            <div
              className={cn(
                "absolute -top-4 whitespace-nowrap px-1 py-px rounded text-[8px] font-bold font-mono tabular-nums",
                nearEntry ? "bg-yellow-500/20 text-yellow-400" : isAboveEntry ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              )}
            >
              {displayPrice!.toFixed(isJpy ? 2 : 3)}
            </div>
          )}
          {/* Dot */}
          <div
            className="w-3 h-3 rounded-full border-2 border-white/80 shadow-lg"
            style={{
              backgroundColor: progressColor,
              boxShadow: pulse
                ? `0 0 16px ${pulseColor}, 0 0 32px ${pulseColor}50`
                : `0 0 8px ${progressColor}`,
            }}
          />
        </div>
        {/* Fill from SL side to price position */}
        <div
          className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ease-out opacity-60"
          style={{
            width: `${position}%`,
            background: `linear-gradient(90deg, ${isBuy ? 'hsl(0, 70%, 45%)' : 'hsl(142, 70%, 45%)'} 0%, ${progressColor} 100%)`,
          }}
        />
        {/* Pulse ripple from dot position */}
        {pulse && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full z-15 animate-[ripple-expand_1s_ease-out_forwards]"
            style={{
              left: `${position}%`,
              transform: 'translateX(-50%) translateY(-50%)',
              background: `radial-gradient(circle, ${pulseColor}60 0%, transparent 70%)`,
            }}
          />
        )}
      </div>

      {/* Price labels */}
      <div className="relative mt-1 h-3">
        <span className="absolute left-0 text-[9px] text-rose-400/60 font-mono tabular-nums">
          {stopLoss.toFixed(isJpy ? 2 : 3)}
        </span>
        <span className="absolute text-[9px] text-white/40 font-mono tabular-nums -translate-x-1/2"
          style={{ left: `${entryPosition}%` }}>
          {entryPrice.toFixed(isJpy ? 2 : 3)}
        </span>
        <span className="absolute text-[9px] text-emerald-400/60 font-mono tabular-nums -translate-x-1/2"
          style={{ left: `${tp1Position}%` }}>
          {takeProfit.toFixed(isJpy ? 2 : 3)}
        </span>
        {takeProfit2 && tp2Position !== null && (
          <span className="absolute text-[9px] text-emerald-400/40 font-mono tabular-nums -translate-x-1/2"
            style={{ left: `${tp2Position}%` }}>
            TP2
          </span>
        )}
        {takeProfit3 && tp3Position !== null && (
          <span className="absolute right-0 text-[9px] text-emerald-400/30 font-mono tabular-nums">
            TP3
          </span>
        )}
      </div>
    </div>
  );
}
