import { cn, formatPrice } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import type { ProgressBarState, PulseState } from './types';

interface PriceLabelsProps {
  state: ProgressBarState;
  pulse: PulseState;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  takeProfit2?: number;
  takeProfit3?: number;
  isCompleted: boolean;
  closedResult?: 'tp_hit' | 'sl_hit' | string;
}

export function PriceLabels({
  state, pulse, entryPrice, stopLoss,
  takeProfit, takeProfit2, takeProfit3,
  isCompleted, closedResult,
}: PriceLabelsProps) {
  const { tp1Pos, tp2Pos, tp3Pos, isJpy, hasMultipleTPs } = state;
  const sym = isJpy ? 'JPY' : 'EUR/USD';

  return (
    <div className={cn("relative mt-1", hasMultipleTPs ? "h-14" : "h-7")}>
      {/* SL price */}
      <div className="absolute left-0 flex flex-col items-start">
        <span className="text-[11px] text-rose-400/60 font-mono tabular-nums">
          {formatPrice(stopLoss, sym)}
        </span>
        <span className="text-[7px] text-rose-400/30 font-semibold uppercase tracking-widest leading-none">
          SL
        </span>
      </div>

      {/* Entry price + status badge */}
      <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: '50%' }}>
        <span className="text-[11px] text-white/40 font-mono tabular-nums">
          {formatPrice(entryPrice, sym)}
        </span>
        <span className="text-[7px] text-white/30 font-semibold uppercase tracking-widest leading-none">
          Entry
        </span>
        <StatusBadge
          state={state}
          pulse={pulse}
          isCompleted={isCompleted}
          closedResult={closedResult}
        />
      </div>

      {/* TP prices */}
      {!hasMultipleTPs ? (
        <div className="absolute right-0 flex flex-col items-end">
          <span className="text-[11px] text-emerald-400/60 font-mono tabular-nums">
            {formatPrice(takeProfit, sym)}
          </span>
          <span className="text-[7px] text-emerald-400/30 font-semibold uppercase tracking-widest leading-none">
            TP
          </span>
        </div>
      ) : (
        <>
          <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${tp1Pos}%` }}>
            <span className="text-[10px] text-emerald-400/70 font-mono tabular-nums leading-tight">
              {formatPrice(takeProfit, sym)}
            </span>
            <span className="text-[7px] text-emerald-400/50 font-bold uppercase tracking-wider leading-none">
              TP1
            </span>
          </div>

          {takeProfit2 && tp2Pos !== null && (
            <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${tp2Pos}%`, top: '20px' }}>
              <span className="text-[10px] text-emerald-300/60 font-mono tabular-nums leading-tight">
                {formatPrice(takeProfit2, sym)}
              </span>
              <span className="text-[7px] text-emerald-300/40 font-bold uppercase tracking-wider leading-none">
                TP2
              </span>
            </div>
          )}

          {takeProfit3 && tp3Pos !== null && (
            <div className="absolute right-0 flex flex-col items-end" style={{ top: '40px' }}>
              <span className="text-[10px] text-emerald-200/50 font-mono tabular-nums leading-tight">
                {formatPrice(takeProfit3, sym)}
              </span>
              <span className="text-[7px] text-emerald-200/30 font-bold uppercase tracking-wider leading-none">
                TP3
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
