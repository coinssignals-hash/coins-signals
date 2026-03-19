import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SignalLevelsOverlayProps {
  entryPrice: number;
  takeProfit: number;
  takeProfit2?: number;
  stopLoss: number;
  signalDatetime?: string;
  visible?: boolean;
  onExited?: () => void;
}

/**
 * Renders colored zones (TP green, SL red, Entry dashed)
 * overlaid on the chart area using proportional price→pixel mapping.
 */
export function SignalLevelsOverlay({
  entryPrice,
  takeProfit,
  takeProfit2,
  stopLoss,
  signalDatetime,
  visible = true,
  onExited,
}: SignalLevelsOverlayProps) {
  const timeLabel = useMemo(() => {
    if (!signalDatetime) return null;
    try {
      const d = new Date(signalDatetime);
      return format(d, 'HH:mm');
    } catch {
      return null;
    }
  }, [signalDatetime]);
  const levels = useMemo(() => {
    const allPrices = [entryPrice, takeProfit, stopLoss];
    if (takeProfit2) allPrices.push(takeProfit2);

    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const range = max - min;
    // Add 30% padding above and below
    const padding = range * 0.3;
    const viewMin = min - padding;
    const viewMax = max + padding;
    const viewRange = viewMax - viewMin;

    // Convert price to percentage from TOP (higher price = lower %)
    const toPercent = (price: number) =>
      ((viewMax - price) / viewRange) * 100;

    return {
      entry: toPercent(entryPrice),
      tp: toPercent(takeProfit),
      tp2: takeProfit2 ? toPercent(takeProfit2) : null,
      sl: toPercent(stopLoss),
      entryPrice,
      takeProfit,
      takeProfit2,
      stopLoss,
    };
  }, [entryPrice, takeProfit, takeProfit2, stopLoss]);

  const isBuy = takeProfit > entryPrice;

  // For BUY: TP is above entry, SL is below
  // For SELL: TP is below entry, SL is above
  const tpZoneTop = isBuy
    ? Math.min(levels.tp, levels.tp2 ?? levels.tp)
    : levels.entry;
  const tpZoneBottom = isBuy
    ? levels.entry
    : Math.max(levels.tp, levels.tp2 ?? levels.tp);

  const slZoneTop = isBuy ? levels.entry : Math.min(levels.sl, levels.entry);
  const slZoneBottom = isBuy ? levels.sl : levels.entry;

  return (
    <div
      className={cn("absolute inset-0 pointer-events-none z-[5] transition-opacity duration-300", visible ? "opacity-100" : "opacity-0")}
      style={{ overflow: 'hidden' }}
      onTransitionEnd={() => { if (!visible) onExited?.(); }}
    >
      {/* TP zone - green */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: `${tpZoneTop}%`,
          height: `${tpZoneBottom - tpZoneTop}%`,
          background: 'rgba(34, 197, 94, 0.08)',
          borderTop: '1.5px solid rgba(34, 197, 94, 0.6)',
          borderBottom: '1.5px solid rgba(34, 197, 94, 0.15)',
        }}
      />

      {/* SL zone - red */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: `${slZoneTop}%`,
          height: `${slZoneBottom - slZoneTop}%`,
          background: 'rgba(239, 68, 68, 0.08)',
          borderTop: '1.5px solid rgba(239, 68, 68, 0.15)',
          borderBottom: '1.5px solid rgba(239, 68, 68, 0.6)',
        }}
      />

      {/* TP line */}
      <div
        className="absolute left-0 right-0 flex items-center"
        style={{ top: `${levels.tp}%` }}
      >
        <div className="absolute inset-x-0 border-t border-dashed" style={{ borderColor: 'rgba(34, 197, 94, 0.7)' }} />
        <span className="absolute right-1 -translate-y-1/2 text-[9px] font-mono font-bold px-1 py-0.5 rounded"
          style={{ background: 'rgba(34, 197, 94, 0.85)', color: '#fff' }}>
          TP {takeProfit.toFixed(takeProfit > 100 ? 2 : 5)}
        </span>
      </div>

      {/* TP2 line */}
      {levels.tp2 !== null && takeProfit2 && (
        <div
          className="absolute left-0 right-0 flex items-center"
          style={{ top: `${levels.tp2}%` }}
        >
          <div className="absolute inset-x-0 border-t border-dashed" style={{ borderColor: 'rgba(34, 197, 94, 0.5)' }} />
          <span className="absolute right-1 -translate-y-1/2 text-[9px] font-mono font-bold px-1 py-0.5 rounded"
            style={{ background: 'rgba(34, 197, 94, 0.65)', color: '#fff' }}>
            TP2 {takeProfit2.toFixed(takeProfit2 > 100 ? 2 : 5)}
          </span>
        </div>
      )}

      {/* Entry line */}
      <div
        className="absolute left-0 right-0 flex items-center"
        style={{ top: `${levels.entry}%` }}
      >
        <div className="absolute inset-x-0 border-t-2 border-dashed" style={{ borderColor: 'rgba(250, 204, 21, 0.7)' }} />
        <span className="absolute left-1 -translate-y-1/2 text-[9px] font-mono font-bold px-1 py-0.5 rounded"
          style={{ background: 'rgba(250, 204, 21, 0.85)', color: '#000' }}>
          ENTRY {entryPrice.toFixed(entryPrice > 100 ? 2 : 5)}
        </span>
      </div>

      {/* Signal arrival time vertical line */}
      {timeLabel && (
        <div
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: '38%' }}
        >
          <div
            className="absolute inset-y-0"
            style={{
              width: 0,
              borderLeft: '1.5px dashed rgba(148, 163, 184, 0.45)',
            }}
          />
          <span
            className="absolute top-1 -translate-x-1/2 text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(148, 163, 184, 0.2)',
              color: 'rgba(203, 213, 225, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              backdropFilter: 'blur(4px)',
              left: '50%',
            }}
          >
            ⏱ {timeLabel}
          </span>
        </div>
      )}
    </div>
  );
}
