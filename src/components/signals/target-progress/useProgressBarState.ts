import { useState, useEffect, useRef } from 'react';
import type { TargetProgressBarProps, PriceZone, ProgressBarState, PulseState } from './types';

export function useProgressBarState(props: TargetProgressBarProps): {
  state: ProgressBarState;
  pulse: PulseState;
  hasRange: boolean;
} {
  const {
    entryPrice, takeProfit, takeProfit2, takeProfit3,
    stopLoss, currentPrice, action, isCompleted = false, closedPrice,
  } = props;

  const prevZoneRef = useRef<PriceZone | null>(null);
  const activatedRef = useRef(false);
  const [pulse, setPulse] = useState(false);
  const [pulseColor, setPulseColor] = useState('');
  const [crossed, setCrossed] = useState<'profit' | 'loss' | null>(null);

  const displayPrice = isCompleted && closedPrice ? closedPrice : currentPrice;
  const isBuy = action === 'BUY';
  const maxTP = takeProfit3 ?? takeProfit2 ?? takeProfit;

  const distEntrySL = Math.abs(entryPrice - stopLoss);
  const distEntryTP = Math.abs(maxTP - entryPrice);
  const distEntryTP1 = Math.abs(takeProfit - entryPrice);
  const hasRange = distEntrySL > 0 || distEntryTP > 0;

  const isJpy = takeProfit.toString().split('.')[1]?.length <= 2 || Math.abs(takeProfit) > 50;
  const pipMultiplier = isJpy ? 100 : 10000;

  const toPos = (price: number) => {
    const diff = price - entryPrice;
    const towardTP = isBuy ? diff : -diff;
    if (towardTP >= 0) {
      return distEntryTP > 0 ? 50 + (towardTP / distEntryTP) * 50 : 50;
    }
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
      tp3Pos = 100;
    }
  }

  let isAboveEntry = false;
  let nearEntry = true;
  let progressColor = 'hsl(45, 80%, 55%)';
  let pipsFromEntry = 0;
  let targetLabel = 'ENTRY';
  let targetPercent = 0;

  const hasLivePrice = displayPrice !== null && Number.isFinite(displayPrice) && hasRange;

  // Activated = price has reached entry (order filled)
  // BUY: activated when price rises to entry or above
  // SELL: activated when price drops to entry or below
  // Completed signals are always activated
  const isActivated = isCompleted || (hasLivePrice && (
    isBuy ? displayPrice >= entryPrice : displayPrice <= entryPrice
  ));

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

  const fillGradient = position <= 50
    ? `linear-gradient(90deg, hsl(0, 70%, 45%) 0%, ${progressColor} 100%)`
    : `linear-gradient(90deg, hsl(0, 70%, 45%) 0%, hsl(45, 80%, 55%) 50%, ${progressColor} 100%)`;

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

  return {
    state: {
      position, tp1Pos, tp2Pos, tp3Pos,
      isAboveEntry, nearEntry, progressColor,
      pipsFromEntry, targetLabel, targetPercent,
      hasLivePrice, displayPrice, fillGradient,
      currentZone, isJpy,
      hasMultipleTPs: !!(takeProfit2 || takeProfit3),
      isActivated,
    },
    pulse: { pulse, pulseColor, crossed },
    hasRange,
  };
}
