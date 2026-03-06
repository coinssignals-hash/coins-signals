export interface TargetProgressBarProps {
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

export type PriceZone = 'tp' | 'entry' | 'sl';

/** Shared computed state passed to sub-components */
export interface ProgressBarState {
  position: number;
  tp1Pos: number;
  tp2Pos: number | null;
  tp3Pos: number | null;
  isAboveEntry: boolean;
  nearEntry: boolean;
  progressColor: string;
  pipsFromEntry: number;
  targetLabel: string;
  targetPercent: number;
  hasLivePrice: boolean;
  displayPrice: number | null;
  fillGradient: string;
  currentZone: PriceZone;
  isJpy: boolean;
  hasMultipleTPs: boolean;
  /** True when market price has reached entry (order filled) */
  isActivated: boolean;
}

export interface PulseState {
  pulse: boolean;
  pulseColor: string;
  crossed: 'profit' | 'loss' | null;
}
