import { cn, formatPrice } from '@/lib/utils';
import type { ProgressBarState, PulseState } from './types';

interface BarTrackProps {
  state: ProgressBarState;
  pulse: PulseState;
  takeProfit2?: number;
  takeProfit3?: number;
}

export function BarTrack({ state, pulse: p, takeProfit2, takeProfit3 }: BarTrackProps) {
  const {
    position, tp1Pos, tp2Pos, tp3Pos,
    hasLivePrice, displayPrice, nearEntry, isAboveEntry,
    progressColor, fillGradient, isJpy, hasMultipleTPs,
  } = state;
  const { pulse, pulseColor, crossed } = p;

  return (
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

      {/* TP markers */}
      {hasMultipleTPs && (
        <div className="absolute z-10 flex flex-col items-center" style={{ left: `${tp1Pos}%`, top: '-3px', bottom: '-3px' }}>
          <div className="w-0.5 h-full bg-emerald-400/50 rounded-full" />
          <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-emerald-400/70 border border-emerald-300/50" />
        </div>
      )}
      {tp2Pos !== null && (
        <div className="absolute z-10 flex flex-col items-center" style={{ left: `${tp2Pos}%`, top: '-3px', bottom: '-3px' }}>
          <div className="w-0.5 h-full bg-emerald-300/40 rounded-full" />
          <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-emerald-300/60 border border-emerald-200/40" />
        </div>
      )}
      {tp3Pos !== null && (
        <div className="absolute z-10 flex flex-col items-center" style={{ left: `${tp3Pos}%`, top: '-3px', bottom: '-3px' }}>
          <div className="w-0.5 h-full bg-emerald-200/30 rounded-full" />
          <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-emerald-200/50 border border-emerald-100/30" />
        </div>
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
            {formatPrice(displayPrice!, isJpy ? 'JPY' : 'EUR/USD')}
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
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full z-[15] animate-[ripple-expand_1s_ease-out_forwards]"
          style={{ left: `${position}%`, transform: 'translateX(-50%) translateY(-50%)', background: `radial-gradient(circle, ${pulseColor}60 0%, transparent 70%)` }}
        />
      )}
    </div>
  );
}
