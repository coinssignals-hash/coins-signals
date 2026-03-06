import { cn } from '@/lib/utils';
import type { ProgressBarState, PulseState } from './types';

interface CompactBarProps {
  state: ProgressBarState;
  pulse: PulseState;
}

export function CompactBar({ state, pulse: p }: CompactBarProps) {
  const { position, nearEntry, isAboveEntry, fillGradient, targetLabel, targetPercent, pipsFromEntry } = state;
  const { pulse, pulseColor, crossed } = p;

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
        <div className={cn("absolute top-0 bottom-0 w-px z-10 transition-all duration-500", crossed ? "bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "bg-white/40")} style={{ left: '50%' }} />
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
          {targetLabel} {targetPercent.toFixed(1)}% · {pipsFromEntry.toFixed(2)}p
        </span>
        <span className="text-[8px] text-emerald-400/70 font-mono">TP</span>
      </div>
    </div>
  );
}
